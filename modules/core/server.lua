---@class RentalPlayer
---@field citizenId string
---@field license string
---@field name string

-- Fallbacks for keys resources handled on the server. A bridge loaded after this file replaces them.

---@param source number
---@param vehicle number
---@param plate string
function GrantVehicleKeys(source, vehicle, plate) end

--- Resources without a server export remove keys through their client bridge.
---@param source number
---@param vehicle number
---@param plate string
function RevokeVehicleKeys(source, vehicle, plate)
    TriggerClientEvent('butter-rentals:client:removeKeys', source, plate)
end

