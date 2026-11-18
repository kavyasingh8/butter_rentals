local config = require 'config.shared'
local locations = require 'modules.locations.server'

local DENIED = { success = false, message = 'You are not allowed to do this.' }

---@param source number
---@return boolean
local function isAdmin(source)
    return IsPlayerAceAllowed(source, 'command.' .. config.Admin.command)
end

---Converts a location into the editable form the admin panel works with.
---@param id string
---@param location RentalLocation
---@return table
local function toAdminForm(id, location)
    local vehicles = {}
    for i, vehicle in ipairs(location.vehicles) do
        vehicles[i] = {
            model = vehicle.model,
            label = vehicle.label,
            category = vehicle.category,
            rentalCost = vehicle.rentalCost,
            hourlyCost = vehicle.hourlyCost,
            minRentalDays = vehicle.minRentalDays,
            maxRentalDays = vehicle.maxRentalDays,
            minRentalHours = vehicle.minRentalHours,
            maxRentalHours = vehicle.maxRentalHours,
            fuelLevel = vehicle.fuelLevel,
            image = vehicle.image or '',
        }
    end

    return {
        id = id,
        source = locations.source(id),
        label = location.label,
        blip = location.blip,
        ped = {
            model = location.ped.model,
            coords = location.ped.coords,
            scenario = location.ped.scenario or '',
        },
        vehicles = vehicles,
        spawncoords = location.spawncoords,
    }
end

---@return table[]
local function getAdminLocations()
    local list = {}
    for id, location in pairs(locations.all()) do
        list[#list + 1] = toAdminForm(id, location)
    end

    table.sort(list, function(a, b) return a.label:lower() < b.label:lower() end)
    return list
end

lib.callback.register('butter-rentals:server:admin:getLocations', function(source)
    if not isAdmin(source) then return false end
    return getAdminLocations()
end)

lib.callback.register('butter-rentals:server:admin:saveLocation', function(source, input)
    if not isAdmin(source) then return DENIED end

    local location, err = locations.sanitize(input)
    if not location then return { success = false, message = err } end

    local id = type(input.id) == 'string' and locations.get(input.id) and input.id or locations.uniqueId(location.label)
    if not locations.save(id, location) then
        return { success = false, message = 'Database error while saving.' }
    end

    lib.print.info(('%s saved rental location %s'):format(GetPlayerName(source), id))
    return { success = true, id = id, locations = getAdminLocations() }
end)

lib.callback.register('butter-rentals:server:admin:deleteLocation', function(source, id)
    if not isAdmin(source) then return DENIED end

    if type(id) ~= 'string' or not locations.isCustom(id) then
        return { success = false, message = 'Locations from the config file cannot be deleted.' }
    end

    if not locations.delete(id) then
        return { success = false, message = 'Database error while deleting.' }
    end

    lib.print.info(('%s deleted rental location %s'):format(GetPlayerName(source), id))
    return { success = true, locations = getAdminLocations() }
end)

lib.addCommand(config.Admin.command, {
    help = 'Open the rental locations panel',
    restricted = config.Admin.restricted,
}, function(source)
    TriggerClientEvent('butter-rentals:client:openAdmin', source)
end)
