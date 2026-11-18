-- jaksam's resource is named vehicles_keys in its docs; older installs may use jaksam-vehicles-keys.
local resource = IsResourceStarted('vehicles_keys') and 'vehicles_keys' or 'jaksam-vehicles-keys'
if not UseBridge('vehiclekeys', resource) then return end

---@param source number
---@param _ number
---@param plate string
function RevokeVehicleKeys(source, _, plate)
    exports[resource]:removeKeysFromPlayerId(source, plate)
end
