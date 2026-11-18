if not UseBridge('fuel', 'cdn-fuel') then return end

---@param vehicle number
---@param fuel number
function SetVehicleFuel(vehicle, fuel)
    SetVehicleFuelLevel(vehicle, fuel + 0.0)
    exports['cdn-fuel']:SetFuel(vehicle, fuel + 0.0)
end
