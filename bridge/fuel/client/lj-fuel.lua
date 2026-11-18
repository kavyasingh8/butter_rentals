if not UseBridge('fuel', 'lj-fuel') then return end

---@param vehicle number
---@param fuel number
function SetVehicleFuel(vehicle, fuel)
    SetVehicleFuelLevel(vehicle, fuel + 0.0)
    exports['lj-fuel']:SetFuel(vehicle, fuel + 0.0)
end
