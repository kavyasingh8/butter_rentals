if not UseBridge('fuel', 'lc_fuel') then return end

---@param vehicle number
---@param fuel number
function SetVehicleFuel(vehicle, fuel)
    SetVehicleFuelLevel(vehicle, fuel + 0.0)
    exports['lc_fuel']:SetFuel(vehicle, fuel + 0.0)
end
