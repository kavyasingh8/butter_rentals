if not UseBridge('fuel', 'hyon_gas_station') then return end

---@param vehicle number
---@param fuel number
function SetVehicleFuel(vehicle, fuel)
    SetVehicleFuelLevel(vehicle, fuel + 0.0)
    exports['hyon_gas_station']:SetFuel(vehicle, fuel + 0.0)
end
