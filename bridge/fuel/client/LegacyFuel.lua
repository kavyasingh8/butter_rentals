if not UseBridge('fuel', 'LegacyFuel') then return end

---@param vehicle number
---@param fuel number
function SetVehicleFuel(vehicle, fuel)
    SetVehicleFuelLevel(vehicle, fuel + 0.0)
    exports['LegacyFuel']:SetFuel(vehicle, fuel + 0.0)
end
