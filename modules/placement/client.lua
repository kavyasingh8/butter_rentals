local utils = require 'modules.utils.client'

local MAX_DISTANCE = 60.0
local RAY_FLAGS = 1 | 16 -- world and objects
local MAX_POINTS = 20

local CONTROLS = {
    confirm = 24, -- left mouse
    confirmKey = 201, -- enter
    cancel = 177, -- backspace / right mouse / escape
    copy = 26, -- C
    rotateLeft = 14, -- scroll down
    rotateRight = 15, -- scroll up
    fineLeft = 174, -- arrow left
    fineRight = 175, -- arrow right
}

-- Blocked while placing so clicks and scrolling do not shoot, aim or switch weapons.
local BLOCKED = { 24, 25, 14, 15, 16, 17, 37, 44, 140, 141, 142, 199, 200, 257, 263, 26, 174, 175 }

local PED_HELP = table.concat({
    '[LMB / Enter] Confirm',
    '[Scroll] Rotate 5°  [← →] Rotate 1°',
    '[C] Copy coords',
    '[RMB / Backspace] Cancel',
}, '  \n')

local VEHICLE_HELP = table.concat({
    '[LMB] Place vehicle  [Enter] Finish',
    '[Scroll] Rotate 5°  [← →] Rotate 1°',
    '[C] Copy coords',
    '[RMB / Backspace] Undo last / Cancel',
    'Placed: %d / %d',
}, '  \n')

local active = false

--- Where the gameplay camera is pointing: the ground, an object or the water surface, whichever is closest.
--- Same raycast as the butter_admin laser, so the preview lands exactly under the camera's aim.
---@return vector3? point, boolean onWater
local function getAimPoint()
    local rotation = GetGameplayCamRot(2)
    local origin = GetGameplayCamCoord()
    local pitch, yaw = math.rad(rotation.x), math.rad(rotation.z)
    local direction = vector3(-math.sin(yaw) * math.abs(math.cos(pitch)), math.cos(yaw) * math.abs(math.cos(pitch)), math.sin(pitch))
    local target = origin + direction * MAX_DISTANCE

    local handle = StartExpensiveSynchronousShapeTestLosProbe(origin.x, origin.y, origin.z, target.x, target.y, target.z, RAY_FLAGS, cache.ped, 7)
    local _, hit, groundCoords = GetShapeTestResult(handle)
    hit = hit == true or hit == 1
    local waterHit, waterCoords = TestProbeAgainstWater(origin.x, origin.y, origin.z, target.x, target.y, target.z)

    if waterHit and (not hit or #(waterCoords - origin) < #(groundCoords - origin)) then
        return waterCoords, true
    end

    if hit then return groundCoords, false end
    return nil, false
end

---@param kind 'vehicle'|'ped'
---@param hash number
---@return number
local function createGhost(kind, hash)
    local coords = GetEntityCoords(cache.ped)
    local entity = kind == 'ped'
        and CreatePed(4, hash, coords.x, coords.y, coords.z, 0.0, false, false)
        or CreateVehicle(hash, coords.x, coords.y, coords.z, 0.0, false, false)

    SetEntityAlpha(entity, 170, false)
    SetEntityCollision(entity, false, false)
    SetEntityInvincible(entity, true)
    FreezeEntityPosition(entity, true)

    if kind == 'ped' then
        SetBlockingOfNonTemporaryEvents(entity, true)
        SetPedCanRagdoll(entity, false)
    else
        SetVehicleDoorsLocked(entity, 2)
        SetVehicleEngineOn(entity, false, true, true)
    end

    return entity
end

--- Moves the ghost onto the aimed point and returns the coords to save.
---@param kind 'vehicle'|'ped'
---@param entity number
---@param point vector3
---@param onWater boolean
---@param heading number
---@return table
local function positionGhost(kind, entity, point, onWater, heading)
    SetEntityHeading(entity, heading)

    if kind == 'ped' then
        -- Same height the agent spawns at (saved z - 1.0), so the preview matches the real ped.
        SetEntityCoords(entity, point.x, point.y, point.z, false, false, false, false)
        return { x = point.x, y = point.y, z = point.z + 1.0, w = heading }
    end

    SetEntityCoords(entity, point.x, point.y, point.z + 1.0, false, false, false, false)
    if onWater then
        SetEntityCoords(entity, point.x, point.y, point.z, false, false, false, false)
    else
        SetVehicleOnGroundProperly(entity)
    end

    local coords = GetEntityCoords(entity)
    return { x = coords.x, y = coords.y, z = coords.z, w = heading }
end

---@param coords table
---@return table
local function roundCoords(coords)
    return { x = utils.round(coords.x), y = utils.round(coords.y), z = utils.round(coords.z), w = utils.round(coords.w % 360) }
end

---@param coords table
local function copyCoords(coords)
    lib.setClipboard(('vector4(%.2f, %.2f, %.2f, %.2f)'):format(coords.x, coords.y, coords.z, coords.w))
    Notify('Coords copied to clipboard.', 'success')
end

---@param kind 'vehicle'|'ped'
---@param placed number
---@param limit number
local function showHelp(kind, placed, limit)
    lib.showTextUI(kind == 'ped' and PED_HELP or VEHICLE_HELP:format(placed, limit), { position = 'left-center' })
end

--- Runs the aiming loop until the player finishes or cancels.
--- Vehicles can be dropped one after another; each dropped ghost stays visible until the loop ends.
---@param kind 'vehicle'|'ped'
---@param hash number
---@param limit number
---@param ghosts number[] every ghost entity created, so the caller can clean up
---@return table[]|false
local function aim(kind, hash, limit, ghosts)
    -- Start facing the player, the way an agent or display vehicle usually should.
    local heading = (GetEntityHeading(cache.ped) + 180.0) % 360
    local point, onWater = GetEntityCoords(cache.ped) - vector3(0.0, 0.0, 1.0), false
    local entity = createGhost(kind, hash)
    local placed = {}
    ghosts[#ghosts + 1] = entity

    showHelp(kind, 0, limit)

    while true do
        for i = 1, #BLOCKED do DisableControlAction(0, BLOCKED[i], true) end

        -- Aiming at the sky keeps the preview where it last hit.
        local aimPoint, aimOnWater = getAimPoint()
        if aimPoint then point, onWater = aimPoint, aimOnWater end

        local coords = positionGhost(kind, entity, point, onWater, heading)

        if IsDisabledControlJustPressed(0, CONTROLS.rotateRight) then heading = heading + 5.0 end
        if IsDisabledControlJustPressed(0, CONTROLS.rotateLeft) then heading = heading - 5.0 end
        if IsDisabledControlPressed(0, CONTROLS.fineRight) then heading = heading + 1.0 end
        if IsDisabledControlPressed(0, CONTROLS.fineLeft) then heading = heading - 1.0 end
        heading = heading % 360

        if IsDisabledControlJustPressed(0, CONTROLS.copy) then
            copyCoords(roundCoords(coords))
        end

        if kind == 'ped' then
            if IsDisabledControlJustPressed(0, CONTROLS.confirm) or IsControlJustPressed(0, CONTROLS.confirmKey) then
                return { roundCoords(coords) }
            end

            if IsDisabledControlJustPressed(0, CONTROLS.cancel) then return false end
        else
            if IsDisabledControlJustPressed(0, CONTROLS.confirm) then
                placed[#placed + 1] = { entity = entity, coords = roundCoords(coords) }
                if #placed >= limit then break end

                entity = createGhost(kind, hash)
                ghosts[#ghosts + 1] = entity
                showHelp(kind, #placed, limit)
            end

            if IsControlJustPressed(0, CONTROLS.confirmKey) then
                -- Finishing without dropping anything keeps the current preview.
                if #placed == 0 then return { roundCoords(coords) } end
                break
            end

            if IsDisabledControlJustPressed(0, CONTROLS.cancel) then
                local last = table.remove(placed)
                if not last then return false end

                DeleteEntity(last.entity)
                showHelp(kind, #placed, limit)
            end
        end

        Wait(0)
    end

    local points = {}
    for i = 1, #placed do points[i] = placed[i].coords end
    return points
end

--- Aims see-through previews of `model` where the camera points.
--- Returns the confirmed coords, or nil when cancelled.
---@param kind 'vehicle'|'ped'
---@param model string
---@param limit number
---@return table[]?
local function place(kind, model, limit)
    local hash = joaat(model)
    if not IsModelInCdimage(hash) then return end
    if not pcall(lib.requestModel, hash) then return end

    local ghosts = {}

    -- Clean up even if a frame errors, so the panel never stays hidden.
    local ok, result = pcall(aim, kind, hash, limit, ghosts)

    lib.hideTextUI()
    for i = 1, #ghosts do
        if DoesEntityExist(ghosts[i]) then DeleteEntity(ghosts[i]) end
    end
    SetModelAsNoLongerNeeded(hash)

    if not ok then
        lib.print.error(result)
        return
    end

    return result or nil
end

RegisterNUICallback('admin:startPlacement', function(data, cb)
    local kind = type(data) == 'table' and data.kind == 'ped' and 'ped' or 'vehicle'
    local model = type(data) == 'table' and type(data.model) == 'string' and data.model:lower() or ''
    local limit = math.floor(tonumber(type(data) == 'table' and data.limit) or 1)
    limit = kind == 'ped' and 1 or math.max(1, math.min(limit, MAX_POINTS))

    if active then return cb({ success = false, message = 'Already placing.' }) end

    local hash = joaat(model)
    local valid = IsModelInCdimage(hash) and (kind == 'ped' and IsModelAPed(hash) or kind == 'vehicle' and IsModelAVehicle(hash))
    if not valid then return cb({ success = false, message = ('"%s" is not a valid %s model.'):format(model, kind) }) end

    active = true
    SendNUIMessage({ action = 'setHidden', data = true })
    SetNuiFocus(false, false)

    local points = place(kind, model, limit)

    active = false
    SendNUIMessage({ action = 'setHidden', data = false })
    SetNuiFocus(true, true)

    cb(points and #points > 0 and { success = true, points = points } or { success = false })
end)
