if not UseBridge('vehiclekeys', 'wasabi_carlock') then return end

-- Keys are given by the client bridge; removal uses the trusted server export.

---@param source number
---@param _ number
---@param plate string
function RevokeVehicleKeys(source, _, plate)
    local removed, reason = exports.wasabi_carlock:RemoveKeys(source, plate)
    if not removed and reason ~= 'missing_key' then
        lib.print.warn(('Could not remove keys for %s: %s'):format(plate, reason))
    end
end
