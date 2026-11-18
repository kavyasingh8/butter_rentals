local config = require 'config.shared'
local utils = require 'modules.utils.client'

local VEHICLE_CLASSES = {
    [0] = 'Compact', 'Sedan', 'SUV', 'Coupe', 'Muscle', 'Sports Classic', 'Sports', 'Super', 'Motorcycle',
    'Off-road', 'Industrial', 'Utility', 'Van', 'Cycle', 'Boat', 'Helicopter', 'Plane', 'Service',
    'Emergency', 'Military', 'Commercial', 'Train', 'Open Wheel',
}

local NO_RESPONSE = { success = false, message = 'No response from server.' }

---@param model any
---@return number?
local function modelHash(model)
    if type(model) ~= 'string' or model == '' then return end
    return tonumber(model) or joaat(model:lower())
end

---Adds display labels, and swaps numeric hashes for spawn codes when the game can confirm them.
---@param locations table[]?
---@return table[]?
local function prepareLocations(locations)
    for _, location in ipairs(locations or {}) do
        for _, vehicle in ipairs(location.vehicles) do
            local hash = modelHash(vehicle.model)

            if hash and IsModelInCdimage(hash) then
                -- Kept apart from label so a blank display name is not saved as the game label.
                vehicle.gameLabel = utils.getVehicleLabel(hash)

                local name = GetDisplayNameFromVehicleModel(hash):lower()
                if tonumber(vehicle.model) and joaat(name) == hash then
                    vehicle.model = name
                end
            end
        end
    end

    return locations
end

---Model checks only the game client can answer, run before a location is sent to the server.
---@param location table
---@return string?
local function validateModels(location)
    local pedModel = type(location.ped) == 'table' and location.ped.model
    local pedHash = modelHash(pedModel)
    if not pedHash or not IsModelInCdimage(pedHash) or not IsModelAPed(pedHash) then
        return ('"%s" is not a valid ped model.'):format(tostring(pedModel))
    end

    for _, vehicle in ipairs(type(location.vehicles) == 'table' and location.vehicles or {}) do
        local hash = modelHash(vehicle.model)
        if not hash or not IsModelInCdimage(hash) or not IsModelAVehicle(hash) then
            return ('"%s" is not a valid vehicle model.'):format(tostring(vehicle.model))
        end
    end
end

---@param result table?
---@return table
local function withPreparedLocations(result)
    if not result then return NO_RESPONSE end

    prepareLocations(result.locations)
    return result
end

RegisterNetEvent('butter-rentals:client:openAdmin', function()
    local locations = lib.callback.await('butter-rentals:server:admin:getLocations', false)
    if not locations then
        Notify("You don't have access to the rental panel.", 'error')
        return
    end

    SendNUIMessage({
        action = 'openAdmin',
        data = { locations = prepareLocations(locations), imageTemplate = config.DefaultImageUrl },
    })
    SetNuiFocus(true, true)
end)

RegisterNUICallback('admin:getPosition', function(_, cb)
    local entity = cache.vehicle or cache.ped
    local coords = GetEntityCoords(entity)

    cb({
        x = utils.round(coords.x),
        y = utils.round(coords.y),
        z = utils.round(coords.z),
        w = utils.round(GetEntityHeading(entity)),
    })
end)

RegisterNUICallback('admin:validateModel', function(data, cb)
    local model = type(data) == 'table' and type(data.model) == 'string' and data.model:lower() or ''
    local hash = modelHash(model)

    if not hash or not IsModelInCdimage(hash) or not IsModelAVehicle(hash) then
        cb({ valid = false })
        return
    end

    cb({
        valid = true,
        label = utils.getVehicleLabel(hash),
        category = VEHICLE_CLASSES[GetVehicleClassFromName(hash)] or 'Other',
        image = config.DefaultImageUrl:format(model),
    })
end)

---@type table[]?
local catalog

--- Every vehicle model the game knows about, addon vehicles included.
---@return table[]
local function getVehicleCatalog()
    if catalog then return catalog end

    catalog = {}
    for _, model in ipairs(GetAllVehicleModels()) do
        local name = model:lower()
        local hash = joaat(name)
        catalog[#catalog + 1] = {
            model = name,
            label = utils.getVehicleLabel(hash),
            category = VEHICLE_CLASSES[GetVehicleClassFromName(hash)] or 'Other',
            image = config.DefaultImageUrl:format(name),
        }
    end

    table.sort(catalog, function(a, b) return a.label:lower() < b.label:lower() end)
    return catalog
end

RegisterNUICallback('admin:getVehicleCatalog', function(_, cb)
    cb(getVehicleCatalog())
end)

RegisterNUICallback('admin:teleport', function(coords, cb)
    if type(coords) == 'table' and tonumber(coords.x) and tonumber(coords.y) and tonumber(coords.z) then
        SetEntityCoords(cache.ped, coords.x + 0.0, coords.y + 0.0, coords.z + 0.0, false, false, false, false)
    end
    cb('ok')
end)

RegisterNUICallback('admin:saveLocation', function(location, cb)
    local invalid = type(location) == 'table' and validateModels(location)
    if invalid then
        cb({ success = false, message = invalid })
        return
    end

    cb(withPreparedLocations(lib.callback.await('butter-rentals:server:admin:saveLocation', false, location)))
end)

RegisterNUICallback('admin:deleteLocation', function(data, cb)
    local id = type(data) == 'table' and data.id
    cb(withPreparedLocations(lib.callback.await('butter-rentals:server:admin:deleteLocation', false, id)))
end)
