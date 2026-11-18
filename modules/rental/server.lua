local config = require 'config.shared'
local database = require 'modules.database.server'
local locations = require 'modules.locations.server'
local vehicles = require 'modules.vehicles.server'

local AGENT_DISTANCE = 10.0
local MAX_RETURN_CANDIDATES = 10
local PLATE_ATTEMPTS = 25
local CLEANUP_INTERVAL = 60000

---@type table<number, true> players with a rental or return in progress
local busy = {}

---@type table<string, true> plates whose renter was already warned about the rental ending
local warned = {}

---@param source number
---@param location RentalLocation
---@return boolean
local function isNearAgent(source, location)
    local coords = location.ped.coords
    return #(GetEntityCoords(GetPlayerPed(source)) - vector3(coords.x, coords.y, coords.z)) <= AGENT_DISTANCE
end

---@param source number
---@return boolean
local function isNearAnyAgent(source)
    for _, location in pairs(locations.all()) do
        if isNearAgent(source, location) then return true end
    end
    return false
end

---@return string?
local function generatePlate()
    for _ = 1, PLATE_ATTEMPTS do
        local plate = config.PlateFormat:gsub('[NL]', function(char)
            if char == 'N' then return string.char(math.random(48, 57)) end
            return string.char(math.random(65, 90))
        end):sub(1, 8):upper()

        if not database.plateExists(plate) then return plate end
    end
end

---@param rental NewRental
---@return boolean
local function saveRental(rental)
    local ok, result = pcall(database.insertRental, rental)
    if not ok then lib.print.error(result) end

    return ok and result == true
end

---Gives both rental documents, taking back whichever one was added when the other fails.
---@param source number
---@param document table
---@return boolean
local function giveDocuments(source, document)
    local items = { config.item.receipt, config.item.agreement }

    for i, item in ipairs(items) do
        if not AddItem(source, item, document) then
            for j = 1, i - 1 do
                local slot = FindItemSlot(source, items[j], document.plate)
                if slot then RemoveItem(source, items[j], slot) end
            end
            return false
        end
    end

    return true
end

---The client only picks a vehicle and duration; price and limits always come from the location.
---@param vehicle RentalVehicle
---@param rentalType any
---@param duration any
---@return 'days'|'hours', number rate, number duration
local function resolveTerms(vehicle, rentalType, duration)
    local unit = rentalType == 'hours' and 'hours' or 'days'
    local min = unit == 'hours' and vehicle.minRentalHours or vehicle.minRentalDays
    local max = unit == 'hours' and vehicle.maxRentalHours or vehicle.maxRentalDays
    local rate = unit == 'hours' and vehicle.pricePerHour or vehicle.rentalCost

    return unit, rate, math.floor(math.min(math.max(tonumber(duration) or min, min), max))
end

---@param source number
---@param data table
---@return table
local function processRental(source, data)
    local player = GetPlayerData(source)
    if not player then return { success = false, message = locale('error.player_not_found') } end

    if data.paymentMethod ~= 'cash' and data.paymentMethod ~= 'bank' then
        return { success = false, message = locale('error.invalid_payment') }
    end

    if not vehicles.isValidType(data.vehicleType) then
        return { success = false, message = locale('error.invalid_vehicle_type') }
    end

    local location = type(data.locationId) == 'string' and locations.get(data.locationId)
    local vehicle = location and locations.findVehicle(location, tonumber(data.vehicleHash))
    if not vehicle then return { success = false, message = locale('error.invalid_vehicle') } end

    if not isNearAgent(source, location) then
        return { success = false, message = locale('error.too_far') }
    end

    local spawnPoint = vehicles.findFreeSpawn(location.spawncoords)
    if not spawnPoint then
        return { success = false, message = locale('error.spawns_blocked') }
    end

    local plate = generatePlate()
    if not plate then return { success = false, message = locale('error.plate_failed') } end

    local unit, rate, duration = resolveTerms(vehicle, data.rentalType, data.duration)
    local total = rate * duration + config.ServiceFee

    if not RemoveMoney(source, data.paymentMethod, total, 'Vehicle Rental') then
        return { success = false, message = locale('error.not_enough_money') }
    end

    local entity = vehicles.spawn(vehicle.hash, data.vehicleType, spawnPoint, plate, vehicle.fuelLevel)
    local saved = entity and saveRental({
        license = player.license,
        citizenId = player.citizenId,
        model = vehicle.model,
        hash = vehicle.hash,
        vehicleType = data.vehicleType,
        locationId = data.locationId,
        plate = plate,
        days = unit == 'days' and duration or nil,
        hours = unit == 'hours' and duration or nil,
        price = total,
    })

    -- Payment is taken first, so any failure after it must undo the spawn and refund.
    if not saved then
        if entity then vehicles.despawn(plate) end
        AddMoney(source, data.paymentMethod, total, 'Vehicle Rental Refund')
        lib.print.error(('Rental of %s for %s failed, payment refunded'):format(vehicle.model, player.citizenId))
        return { success = false, message = locale('error.rental_failed_refunded') }
    end

    local receipt = {
        transactionId = ('#TRX-%05d'):format(math.random(0, 99999)),
        date = os.date('%Y-%m-%d'),
        time = os.date('%H:%M'),
        vehicleName = vehicle.label or type(data.vehicleName) == 'string' and data.vehicleName:sub(1, 48) or vehicle.model,
        vehicleClass = vehicle.category,
        plate = plate,
        ownerName = player.name,
        rentalType = unit,
        duration = duration,
        days = unit == 'days' and duration or nil,
        hours = unit == 'hours' and duration or nil,
        dailyRate = rate,
        rentalRate = rate,
        serviceFee = config.ServiceFee,
        total = total,
        paymentMethod = data.paymentMethod,
        locationLabel = location.label,
    }

    -- Without both documents the vehicle can never be returned, so undo the rental instead.
    if not giveDocuments(source, receipt) then
        if not database.deleteRental(plate) then
            lib.print.error(('Could not remove rental %s after its documents failed'):format(plate))
        end
        vehicles.despawn(plate)
        AddMoney(source, data.paymentMethod, total, 'Vehicle Rental Refund')
        return { success = false, message = locale('error.inventory_full_refunded') }
    end

    GrantVehicleKeys(source, entity, plate)

    return {
        success = true,
        plate = plate,
        netId = NetworkGetNetworkIdFromEntity(entity),
        fuelLevel = vehicle.fuelLevel,
        receiptData = receipt,
    }
end

lib.callback.register('butter-rentals:server:processRental', function(source, data)
    if busy[source] or type(data) ~= 'table' then return { success = false } end

    busy[source] = true
    local ok, result = pcall(processRental, source, data)
    busy[source] = nil

    if not ok then
        lib.print.error(result)
        return { success = false, message = locale('error.processing_failed') }
    end

    return result
end)

---Picks the closest vehicle the player is allowed to return from the candidates the client saw.
---@param source number
---@param player RentalPlayer
---@param netIds any
---@return number? entity, RentalRow?
local function findReturnable(source, player, netIds)
    local playerCoords = GetEntityCoords(GetPlayerPed(source))

    for i, netId in ipairs(netIds) do
        if i > MAX_RETURN_CANDIDATES then break end

        local entity = type(netId) == 'number' and NetworkGetEntityFromNetworkId(netId) or 0
        local valid = entity ~= 0 and DoesEntityExist(entity) and GetEntityType(entity) == 2
        local inRange = valid and #(GetEntityCoords(entity) - playerCoords) <= config.VehicleReturn.Distance + 5.0
        local rental = inRange and database.getRental(vehicles.trimPlate(GetVehicleNumberPlateText(entity)))

        if rental and (not config.VehicleReturn.OwnerOnlyReturn or rental.owner == player.citizenId) then
            return entity, rental
        end
    end
end

---@param source number
---@param netIds table
---@return table
local function returnVehicle(source, netIds)
    local player = GetPlayerData(source)
    if not player then return { success = false, message = locale('error.player_not_found') } end

    if not isNearAnyAgent(source) then
        return { success = false, message = locale('error.too_far') }
    end

    local entity, rental = findReturnable(source, player, netIds)
    if not entity or not rental then
        return { success = false, message = locale('error.no_owned_rental_nearby') }
    end

    local receiptSlot = FindItemSlot(source, config.item.receipt, rental.plate)
    local agreementSlot = FindItemSlot(source, config.item.agreement, rental.plate)
    if not receiptSlot or not agreementSlot then
        return { success = false, message = locale('error.missing_documents') }
    end

    -- Deleting the row first means a second request for the same plate finds nothing to refund.
    if not database.deleteRental(rental.plate) then
        return { success = false, message = locale('error.already_returned') }
    end

    RevokeVehicleKeys(source, entity, rental.plate)
    DeleteEntity(entity)
    vehicles.forget(rental.plate)
    RemoveItem(source, config.item.receipt, receiptSlot)
    RemoveItem(source, config.item.agreement, agreementSlot)

    local refundable = config.VehicleReturn.RefundServiceFee and rental.price or math.max(0, rental.price - config.ServiceFee)
    local refund = math.floor(refundable * config.VehicleReturn.ReturnPercentage / 100)
    if refund <= 0 then
        return { success = true, message = locale('success.returned') }
    end

    AddMoney(source, 'cash', refund, 'Rental Vehicle Refund')
    return { success = true, message = locale('success.returned_refund', refund) }
end

lib.callback.register('butter-rentals:server:returnVehicle', function(source, netIds)
    if not config.VehicleReturn.ReturnVehicle then return { success = false } end
    if busy[source] or type(netIds) ~= 'table' then return { success = false } end

    busy[source] = true
    local ok, result = pcall(returnVehicle, source, netIds)
    busy[source] = nil

    if not ok then
        lib.print.error(result)
        return { success = false, message = locale('error.return_failed') }
    end

    return result
end)

---Opens a receipt or agreement item with defaults for anything missing from old metadata.
---@param source number
---@param item string
---@param metadata table?
local function openDocument(source, item, metadata)
    if type(metadata) ~= 'table' or not metadata.plate then return end

    local document = {
        transactionId = metadata.transactionId or '#TRX-00000',
        date = metadata.date or '0000-00-00',
        time = metadata.time or '00:00',
        vehicleName = metadata.vehicleName or locale('document.unknown_vehicle'),
        vehicleClass = metadata.vehicleClass or locale('document.vehicle_class'),
        plate = metadata.plate,
        ownerName = metadata.ownerName or locale('document.customer'),
        rentalType = metadata.rentalType or 'days',
        duration = tonumber(metadata.duration) or tonumber(metadata.days) or 1,
        days = tonumber(metadata.days) or 1,
        hours = tonumber(metadata.hours) or 0,
        dailyRate = tonumber(metadata.dailyRate) or 0,
        rentalRate = tonumber(metadata.rentalRate) or tonumber(metadata.dailyRate) or 0,
        serviceFee = tonumber(metadata.serviceFee) or config.ServiceFee,
        total = tonumber(metadata.total) or 0,
        paymentMethod = metadata.paymentMethod or 'cash',
        locationLabel = metadata.locationLabel,
    }

    local event = item == config.item.receipt and 'openReceipt' or 'openAgreement'
    TriggerClientEvent('butter-rentals:client:' .. event, source, document)
end

OnItemUse({ config.item.receipt, config.item.agreement }, openDocument)

local function cleanExpiredRentals()
    local plates = database.getExpiredPlates()
    if #plates == 0 then return end

    vehicles.despawnMany(plates)
    database.deleteRentals(plates)
    lib.print.info(('Cleaned up %d expired rental(s)'):format(#plates))
end

---Warns online renters once when their rental is about to end. Extending it past the
---warning window clears the warning, so it is sent again before the new end time.
local function warnExpiringRentals()
    local minutes = tonumber(config.ExpiryWarningMinutes) or 0
    if minutes <= 0 then return end

    local expiring = {}
    for _, rental in ipairs(database.getExpiringRentals(minutes * 60)) do
        expiring[rental.plate] = true

        local playerId = not warned[rental.plate] and GetPlayerSource(rental.owner)
        if playerId then
            warned[rental.plate] = true
            local message = locale('notify.rental_ending', rental.plate, math.ceil(rental.remaining / 60))
            TriggerClientEvent('butter-rentals:client:notify', playerId, message, 'inform')
        end
    end

    for plate in pairs(warned) do
        if not expiring[plate] then warned[plate] = nil end
    end
end

local function runRentalTimers()
    cleanExpiredRentals()
    warnExpiringRentals()
end

AddEventHandler('playerDropped', function()
    busy[source] = nil
end)

MySQL.ready(function()
    database.migrate()
    locations.load()
    runRentalTimers()
    SetInterval(runRentalTimers, CLEANUP_INTERVAL)
end)
