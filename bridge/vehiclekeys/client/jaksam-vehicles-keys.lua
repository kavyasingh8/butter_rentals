local resource = IsResourceStarted('vehicles_keys') and 'vehicles_keys' or 'jaksam-vehicles-keys'
if not UseBridge('vehiclekeys', resource) then return end

---@param plate string
function GiveVehicleKeys(plate)
    TriggerServerEvent('vehicles_keys:selfGiveVehicleKeys', plate)
end
