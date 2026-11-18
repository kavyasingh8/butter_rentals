if not UseBridge('vehiclekeys', 'Renewed-Vehiclekeys') then return end

-- Keys are given by the client bridge; only removal happens here.

---@param source number
---@param _ number
---@param plate string
function RevokeVehicleKeys(source, _, plate)
    exports['Renewed-Vehiclekeys']:removeKey(source, plate)
end
