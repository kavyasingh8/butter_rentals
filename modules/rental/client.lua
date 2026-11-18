local config = require 'config.shared'
local locations = require 'modules.locations.client'
local utils = require 'modules.utils.client'

local MAX_RETURN_CANDIDATES = 10

---@type string? location id of the open rental menu
local currentLocation

---@param id string
local function openRentalMenu(id)
    local location = locations.get(id)
    if not location then return end

    local vehicles = {}
    for i, vehicle in ipairs(location.vehicles) do
        vehicles[i] = {
            id = tostring(vehicle.hash),
            name = vehicle.label or utils.getVehicleLabel(vehicle.hash),
            category = vehicle.category,
            pricePerDay = vehicle.rentalCost,
            pricePerHour = vehicle.pricePerHour,
            minRentalDays = vehicle.minRentalDays,
            maxRentalDays = vehicle.maxRentalDays,
            minRentalHours = vehicle.minRentalHours,
            maxRentalHours = vehicle.maxRentalHours,
            image = vehicle.image,
            fuelLevel = vehicle.fuelLevel,
            seats = GetVehicleModelNumberOfSeats(vehicle.hash),
        }
    end

    currentLocation = id

    SendNUIMessage({
        action = 'setRentalData',
        data = {
            vehicles = vehicles,
            categories = location.categories,
            locationLabel = location.label,
            serviceFee = config.ServiceFee,
            layout = config.MenuLayout == 'center' and 'center' or 'side',
        },
    })
    SetNuiFocus(true, true)
end

---@param netId number
---@return number?
local function waitForVehicle(netId)
    local ok, vehicle = pcall(lib.waitFor, function()
        if not NetworkDoesNetworkIdExist(netId) then return end

        local entity = NetToVeh(netId)
        if entity ~= 0 and DoesEntityExist(entity) then return entity end
    end, 'rental vehicle did not arrive', 5000)

    return ok and vehicle or nil
end

---@param result { plate: string, netId: number, fuelLevel: number }
local function prepareVehicle(result)
    local vehicle = waitForVehicle(result.netId)
    if not vehicle then
        Notify(locale('notify.vehicle_parked_nearby', result.plate), 'inform')
        return
    end

    GiveVehicleKeys(result.plate)

    local ok, err = pcall(SetVehicleFuel, vehicle, result.fuelLevel)
    if not ok then lib.print.warn(('Could not set fuel: %s'):format(err)) end

    if config.SetPedInsideVehicle then
        TaskWarpPedIntoVehicle(cache.ped, vehicle, -1)
    end

    Notify(locale('notify.vehicle_ready', result.plate), 'success')
end

RegisterNUICallback('getTheme', function(_, cb)
    cb(config.Theme or {})
end)

RegisterNUICallback('getLocale', function(_, cb)
    cb(utils.getUiLocale())
end)

-- ox_lib reloads its strings first, so the page gets the new language.
AddEventHandler('ox_lib:setLocale', function()
    SendNUIMessage({ action = 'setLocale', data = utils.getUiLocale() })
end)

RegisterNUICallback('closeUI', function(_, cb)
    SetNuiFocus(false, false)
    currentLocation = nil
    cb('ok')
end)

RegisterNUICallback('confirmRental', function(data, cb)
    local location = currentLocation and locations.get(currentLocation)
    local hash = type(data) == 'table' and tonumber(data.vehicleHash)

    if not location or not hash then
        cb({ success = false, message = locale('error.invalid_request') })
        return
    end

    local result = lib.callback.await('butter-rentals:server:processRental', false, {
        locationId = currentLocation,
        vehicleHash = hash,
        vehicleType = utils.getVehicleType(hash),
        vehicleName = utils.getVehicleLabel(hash),
        rentalType = data.rentalType,
        duration = data.duration,
        paymentMethod = data.paymentMethod,
    })

    if not result or not result.success then
        local message = result and result.message or locale('error.processing_failed')
        Notify(message, 'error')
        cb({ success = false, message = message })
        return
    end

    cb({ success = true, receiptData = result.receiptData })
    prepareVehicle(result)
end)

local function returnVehicle()
    local coords = GetEntityCoords(cache.ped)
    local nearby = lib.getNearbyVehicles(coords, config.VehicleReturn.Distance, true)

    table.sort(nearby, function(a, b)
        return #(a.coords - coords) < #(b.coords - coords)
    end)

    local netIds = {}
    for _, entry in ipairs(nearby) do
        if NetworkGetEntityIsNetworked(entry.vehicle) then
            netIds[#netIds + 1] = VehToNet(entry.vehicle)
            if #netIds >= MAX_RETURN_CANDIDATES then break end
        end
    end

    if #netIds == 0 then
        Notify(locale('notify.no_rental_nearby'), 'error')
        return
    end

    local result = lib.callback.await('butter-rentals:server:returnVehicle', false, netIds)
    if result and result.message then
        Notify(result.message, result.success and 'success' or 'error')
    end
end

---@param action string
---@param document table
local function showDocument(action, document)
    SendNUIMessage({ action = action, data = document })
    SetNuiFocus(true, true)
end

RegisterNetEvent('butter-rentals:client:notify', function(message, notifyType)
    if type(message) == 'string' then Notify(message, notifyType) end
end)

RegisterNetEvent('butter-rentals:client:removeKeys', function(plate)
    if type(plate) == 'string' then RemoveVehicleKeys(plate) end
end)

RegisterNetEvent('butter-rentals:client:openReceipt', function(document)
    showDocument('showStandaloneReceipt', document)
end)

RegisterNetEvent('butter-rentals:client:openAgreement', function(document)
    showDocument('showStandaloneAgreement', document)
end)

locations.setInteractions({
    rent = openRentalMenu,
    returnVehicle = returnVehicle,
})
