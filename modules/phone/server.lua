local config = require 'config.shared'

if not config.Phone.enabled then return end

local database = require 'modules.database.server'
local locations = require 'modules.locations.server'
local vehicles = require 'modules.vehicles.server'

---@type table<number, true> players with an extension in progress
local busy = {}

---The location the rental came from, or for older rentals any location offering the model.
---@param rental RentalRow
---@return RentalVehicle?, RentalLocation?
local function findRentalTerms(rental)
    local location = rental.location and locations.get(rental.location)
    local vehicle = location and rental.hash and locations.findVehicle(location, rental.hash)
    if vehicle then return vehicle, location end

    return locations.findVehicleAnywhere(rental.hash)
end

---@param rental RentalRow
---@return table
local function formatRental(rental)
    local unit = rental.rentalHours and 'hours' or 'days'
    local duration = rental.rentalHours or rental.rentalDays or 0

    local data = {
        plate = rental.plate,
        hash = rental.hash,
        unit = unit,
        duration = duration,
        remaining = rental.remaining,
        price = rental.price,
        canExtend = false,
    }

    local vehicle, location = findRentalTerms(rental)
    if not vehicle or not location then return data end

    local max = unit == 'hours' and vehicle.maxRentalHours or vehicle.maxRentalDays
    data.image = vehicle.image
    data.category = vehicle.category
    data.locationLabel = location.label
    data.rate = unit == 'hours' and vehicle.pricePerHour or vehicle.rentalCost
    data.maxExtend = math.max(0, max - duration)
    data.canExtend = data.maxExtend > 0 and rental.remaining > 0

    return data
end

---@param citizenId string
---@return table[]
local function getRentals(citizenId)
    local rentals = database.getRentals(citizenId)
    for i, rental in ipairs(rentals) do
        rentals[i] = formatRental(rental)
    end
    return rentals
end

---@param citizenId string
---@param plate any
---@return RentalRow?
local function getOwnedRental(citizenId, plate)
    if type(plate) ~= 'string' then return end

    local rental = database.getRental(plate)
    if rental and rental.owner == citizenId then return rental end
end

lib.callback.register('butter-rentals:server:phone:getRentals', function(source)
    local player = GetPlayerData(source)
    return player and getRentals(player.citizenId) or {}
end)

---@param source number
---@param plate any
---@param amount any
---@return table
local function extendRental(source, plate, amount)
    local player = GetPlayerData(source)
    if not player then return { success = false, message = locale('error.player_not_found') } end

    amount = math.floor(tonumber(amount) or 0)
    if amount < 1 then return { success = false, message = locale('error.invalid_extension') } end

    local rental = getOwnedRental(player.citizenId, plate)
    if not rental then return { success = false, message = locale('error.rental_not_found') } end

    local details = formatRental(rental)
    if not details.canExtend then
        return { success = false, message = locale('error.cannot_extend') }
    end

    if amount > details.maxExtend then
        return { success = false, message = locale('error.extend_limit', details.maxExtend, locale('units.' .. details.unit)) }
    end

    local cost = details.rate * amount
    local method = config.Phone.extendPaymentMethod
    if not RemoveMoney(source, method, cost, 'Rental Extension') then
        return { success = false, message = locale('error.not_enough_money') }
    end

    if not database.extendRental(rental.plate, details.unit, amount, cost) then
        AddMoney(source, method, cost, 'Rental Extension Refund')
        lib.print.error(('Failed to extend rental %s for %s'):format(rental.plate, player.citizenId))
        return { success = false, message = locale('error.extend_failed_refunded') }
    end

    return {
        success = true,
        message = locale('success.extended', amount, locale('units.' .. details.unit), cost),
        rentals = getRentals(player.citizenId),
    }
end

lib.callback.register('butter-rentals:server:phone:extend', function(source, plate, amount)
    if busy[source] then return { success = false, message = locale('error.extension_in_progress') } end

    busy[source] = true
    local ok, result = pcall(extendRental, source, plate, amount)
    busy[source] = nil

    if not ok then
        lib.print.error(result)
        return { success = false, message = locale('error.extend_error') }
    end

    return result
end)

AddEventHandler('playerDropped', function()
    busy[source] = nil
end)

lib.callback.register('butter-rentals:server:phone:locate', function(source, plate)
    local player = GetPlayerData(source)
    local rental = player and getOwnedRental(player.citizenId, plate)
    if not rental then return end

    local entity = vehicles.find(rental.plate)
    if not entity then return end

    local coords = GetEntityCoords(entity)
    return { x = coords.x, y = coords.y }
end)
