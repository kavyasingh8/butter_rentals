local SPAWN_CLEARANCE = 3.0
local PED_CLEARANCE = 2.0

-- CreateVehicleServerSetter needs the vehicle type, which only the client can read from the model.
local VEHICLE_TYPES = {
    automobile = true,
    bike = true,
    boat = true,
    heli = true,
    plane = true,
    submarine = true,
    trailer = true,
}

---@type table<string, number> plate -> entity, for rentals spawned since the resource started
local spawned = {}

local Vehicles = {}

---@param plate string
---@return string
function Vehicles.trimPlate(plate)
    return (plate:match('^%s*(.-)%s*$'))
end

---@param vehicleType any
---@return boolean
function Vehicles.isValidType(vehicleType)
    return VEHICLE_TYPES[vehicleType] == true
end

---Finds a rental vehicle in the world. Rentals spawned before a restart are found by scanning once.
---@param plate string
---@return number?
function Vehicles.find(plate)
    local entity = spawned[plate]
    if entity and DoesEntityExist(entity) then return entity end

    spawned[plate] = nil

    for _, vehicle in ipairs(GetAllVehicles()) do
        if Vehicles.trimPlate(GetVehicleNumberPlateText(vehicle)) == plate then
            spawned[plate] = vehicle
            return vehicle
        end
    end
end

---@param plate string
function Vehicles.despawn(plate)
    local entity = Vehicles.find(plate)
    if entity then DeleteEntity(entity) end

    spawned[plate] = nil
end

---@param plate string
function Vehicles.forget(plate)
    spawned[plate] = nil
end

---Removes several rentals with a single pass over the world's vehicles.
---@param plates string[]
function Vehicles.despawnMany(plates)
    local pending = {}
    for _, plate in ipairs(plates) do
        local entity = spawned[plate]
        if entity and DoesEntityExist(entity) then
            DeleteEntity(entity)
        else
            pending[plate] = true
        end
        spawned[plate] = nil
    end

    if not next(pending) then return end

    for _, vehicle in ipairs(GetAllVehicles()) do
        if pending[Vehicles.trimPlate(GetVehicleNumberPlateText(vehicle))] then
            DeleteEntity(vehicle)
        end
    end
end

---@param entities number[]
---@param clearance number
---@param occupied { coords: vector3, clearance: number }[]
local function addOccupied(entities, clearance, occupied)
    for _, entity in ipairs(entities) do
        occupied[#occupied + 1] = { coords = GetEntityCoords(entity), clearance = clearance }
    end
end

---@param coords vector3
---@param occupied { coords: vector3, clearance: number }[]
---@return boolean
local function isBlocked(coords, occupied)
    for i = 1, #occupied do
        if #(occupied[i].coords - coords) < occupied[i].clearance then return true end
    end
    return false
end

---A point is free when no vehicle, player or networked ped is standing on it.
---@param spawnPoints table[]
---@return table?
function Vehicles.findFreeSpawn(spawnPoints)
    local occupied = {}
    addOccupied(GetAllVehicles(), SPAWN_CLEARANCE, occupied)
    addOccupied(GetAllPeds(), PED_CLEARANCE, occupied)

    for _, point in ipairs(spawnPoints) do
        if not isBlocked(vector3(point.x, point.y, point.z), occupied) then return point end
    end
end

---@param hash number
---@param vehicleType string
---@param point table
---@param plate string
---@param fuel number
---@return number? entity
function Vehicles.spawn(hash, vehicleType, point, plate, fuel)
    local entity = CreateVehicleServerSetter(hash, vehicleType, point.x, point.y, point.z, point.w)

    local exists = pcall(lib.waitFor, function()
        if DoesEntityExist(entity) then return true end
    end, 'vehicle did not spawn', 5000)

    if not exists then
        if DoesEntityExist(entity) then DeleteEntity(entity) end
        return
    end

    SetVehicleNumberPlateText(entity, plate)
    Entity(entity).state:set('fuel', fuel, true)
    spawned[plate] = entity

    return entity
end

return Vehicles
