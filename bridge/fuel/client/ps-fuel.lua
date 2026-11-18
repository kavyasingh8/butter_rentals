if not UseBridge('fuel', 'ps-fuel') then return end

---@param vehicle number
---@param fuel number
function SetVehicleFuel(vehicle, fuel)
    SetVehicleFuelLevel(vehicle, fuel + 0.0)
    exports['ps-fuel']:SetFuel(vehicle, fuel + 0.0)
end
