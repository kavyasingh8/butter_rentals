if not UseBridge('fuel', 'ox_fuel') then return end

---@param vehicle number
---@param fuel number
function SetVehicleFuel(vehicle, fuel)
    SetVehicleFuelLevel(vehicle, fuel + 0.0)
    Entity(vehicle).state:set('fuel', fuel + 0.0, true)
end
