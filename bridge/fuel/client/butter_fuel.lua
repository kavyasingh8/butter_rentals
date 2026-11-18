if not UseBridge('fuel', 'butter_fuel') then return end

---@param vehicle number
---@param fuel number
function SetVehicleFuel(vehicle, fuel)
    SetVehicleFuelLevel(vehicle, fuel + 0.0)
    exports['butter_fuel']:SetFuel(vehicle, fuel + 0.0)
end
