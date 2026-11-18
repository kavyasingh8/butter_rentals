local config = require 'config.shared'

if not config.Phone.enabled then return end

local locations = require 'modules.locations.client'
local utils = require 'modules.utils.client'

local NO_RESPONSE = { success = false, message = locale('error.no_response') }

---@param rentals table[]?
---@return table[]
local function withVehicleNames(rentals)
    rentals = rentals or {}
    for _, rental in ipairs(rentals) do
        rental.vehicleName = rental.hash and utils.getVehicleLabel(rental.hash) or rental.plate
    end
    return rentals
end

---@return table[]
local function getPhoneLocations()
    local list = {}
    for id, location in pairs(locations.all()) do
        local vehicles = {}
        for i, vehicle in ipairs(location.vehicles) do
            vehicles[i] = {
                name = vehicle.label or utils.getVehicleLabel(vehicle.hash),
                category = vehicle.category,
                pricePerDay = vehicle.rentalCost,
                pricePerHour = vehicle.pricePerHour,
                image = vehicle.image,
                seats = GetVehicleModelNumberOfSeats(vehicle.hash),
            }
        end

        list[#list + 1] = {
            id = id,
            label = location.label,
            categories = location.categories,
            vehicles = vehicles,
        }
    end

    table.sort(list, function(a, b) return a.label < b.label end)
    return list
end

RegisterNUICallback('phone:getData', function(_, cb)
    cb({
        locations = getPhoneLocations(),
        rentals = withVehicleNames(lib.callback.await('butter-rentals:server:phone:getRentals', false)),
        extendPaymentMethod = config.Phone.extendPaymentMethod,
        theme = config.Theme,
        locale = utils.getUiLocale(),
    })
end)

RegisterNUICallback('phone:setWaypoint', function(data, cb)
    local location = type(data) == 'table' and locations.get(data.id)
    if not location then
        cb({ success = false })
        return
    end

    SetNewWaypoint(location.ped.coords.x, location.ped.coords.y)
    cb({ success = true })
end)

RegisterNUICallback('phone:locate', function(data, cb)
    local plate = type(data) == 'table' and data.plate
    local coords = lib.callback.await('butter-rentals:server:phone:locate', false, plate)
    if not coords then
        cb({ success = false, message = locale('error.vehicle_not_located') })
        return
    end

    SetNewWaypoint(coords.x, coords.y)
    cb({ success = true })
end)

RegisterNUICallback('phone:extend', function(data, cb)
    if type(data) ~= 'table' then
        cb({ success = false, message = locale('error.invalid_request') })
        return
    end

    local result = lib.callback.await('butter-rentals:server:phone:extend', false, data.plate, data.amount)
    if not result then
        cb(NO_RESPONSE)
        return
    end

    if result.rentals then withVehicleNames(result.rentals) end
    cb(result)
end)

RegisterPhoneApp()
