if not UseBridge('fuel', 'okokGasStation') then return end

---@param vehicle number
---@param fuel number
function SetVehicleFuel(vehicle, fuel)
    SetVehicleFuelLevel(vehicle, fuel + 0.0)
    exports['okokGasStation']:SetFuel(vehicle, fuel + 0.0)
end
