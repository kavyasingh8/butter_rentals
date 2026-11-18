local config = require 'config.shared'

---@type table<string, table> synced from the server
local locations = {}
local blips = {}
local points = {}

---@type { rent: fun(id: string), returnVehicle: fun() }?
local interactions

local Locations = {}

---@param id string
---@return table?
function Locations.get(id)
    return locations[id]
end

---@return table<string, table>
function Locations.all()
    return locations
end

---@param handlers { rent: fun(id: string), returnVehicle: fun() }
function Locations.setInteractions(handlers)
    interactions = handlers
end

---@param id string
---@return TargetOption[]
local function getTargetOptions(id)
    local options = {
        {
            label = locale('target.rent'),
            icon = 'fa-car',
            onSelect = function() interactions.rent(id) end,
        },
    }

    if config.VehicleReturn.ReturnVehicle then
        options[2] = {
            label = locale('target.return'),
            icon = 'fa-undo',
            -- Waits on a server callback, so it must not hold up the target resource's thread.
            onSelect = function() CreateThread(interactions.returnVehicle) end,
        }
    end

    return options
end

local function fadeIn(entity)
    CreateThread(function()
        for alpha = 0, 255, 51 do
            if not DoesEntityExist(entity) then return end
            SetEntityAlpha(entity, alpha, false)
            Wait(50)
        end
        ResetEntityAlpha(entity)
    end)
end

local function removePed(point)
    if not point.entity then return end

    RemoveTargetPed(point.entity, point.locationId)
    DeleteEntity(point.entity)
    point.entity = nil
end

local function spawnPed(point)
    local ped = point.ped
    if point.entity or not IsModelInCdimage(ped.hash) then return end

    if not pcall(lib.requestModel, ped.hash) then
        lib.print.warn(('Could not load agent ped model %s'):format(ped.model))
        return
    end

    -- The player may have walked away, or locations resynced, while the model loaded.
    if not point.inside or point.removed or point.entity then
        SetModelAsNoLongerNeeded(ped.hash)
        return
    end

    local coords = ped.coords
    local entity = CreatePed(4, ped.hash, coords.x, coords.y, coords.z - 1.0, coords.w, false, false)
    SetModelAsNoLongerNeeded(ped.hash)

    SetEntityAlpha(entity, 0, false)
    SetEntityInvincible(entity, true)
    SetBlockingOfNonTemporaryEvents(entity, true)
    FreezeEntityPosition(entity, true)

    if ped.scenario then
        TaskStartScenarioInPlace(entity, ped.scenario, 0, true)
    end

    point.entity = entity
    AddTargetPed(entity, point.locationId, getTargetOptions(point.locationId))
    fadeIn(entity)
end

local function createBlip(location)
    local coords = location.ped.coords
    local blip = AddBlipForCoord(coords.x, coords.y, coords.z)

    SetBlipSprite(blip, location.blip.sprite)
    SetBlipDisplay(blip, 4)
    SetBlipScale(blip, location.blip.scale)
    SetBlipColour(blip, location.blip.color)
    SetBlipAsShortRange(blip, true)
    BeginTextCommandSetBlipName('STRING')
    AddTextComponentSubstringPlayerName(location.blip.label)
    EndTextCommandSetBlipName(blip)

    return blip
end

local function clear()
    for _, blip in ipairs(blips) do
        RemoveBlip(blip)
    end

    for _, point in ipairs(points) do
        point.removed = true
        removePed(point)
        point:remove()
    end

    table.wipe(blips)
    table.wipe(points)
end

local function build()
    clear()

    for id, location in pairs(locations) do
        if location.blip.use then
            blips[#blips + 1] = createBlip(location)
        end

        local coords = location.ped.coords
        points[#points + 1] = lib.points.new({
            coords = vector3(coords.x, coords.y, coords.z),
            distance = location.ped.renderDistance,
            locationId = id,
            ped = location.ped,
            -- Spawned on its own thread so loading the model does not stall every other point.
            onEnter = function(self)
                CreateThread(function() spawnPed(self) end)
            end,
            onExit = removePed,
        })
    end
end

local function setLocations(data)
    if type(data) ~= 'table' then return end

    locations = data
    build()
end

RegisterNetEvent('butter-rentals:client:setLocations', setLocations)

CreateThread(function()
    setLocations(lib.callback.await('butter-rentals:server:getLocations', false))
end)

AddEventHandler('onResourceStop', function(resource)
    if resource == cache.resource then clear() end
end)

return Locations
