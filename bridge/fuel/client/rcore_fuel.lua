if not UseBridge('fuel', 'rcore_fuel') then return end

---@param vehicle number
---@param fuel number
function SetVehicleFuel(vehicle, fuel)
    SetVehicleFuelLevel(vehicle, fuel + 0.0)
    exports['rcore_fuel']:SetVehicleFuel(vehicle, fuel + 0.0)
end
