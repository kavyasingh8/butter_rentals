if not UseBridge('fuel', 'Renewed-Fuel') then return end

---@param vehicle number
---@param fuel number
function SetVehicleFuel(vehicle, fuel)
    SetVehicleFuelLevel(vehicle, fuel + 0.0)
    exports['Renewed-Fuel']:SetFuel(vehicle, fuel + 0.0)
end
