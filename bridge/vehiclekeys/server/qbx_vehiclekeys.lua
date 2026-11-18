if not UseBridge('vehiclekeys', 'qbx_vehiclekeys') then return end

-- Granted on the server because qbx_vehiclekeys refuses client key requests from players
-- standing further than its distanceToVehicle from the car, and rentals spawn away from the agent.

---@param source number
---@param vehicle number
function GrantVehicleKeys(source, vehicle)
    exports.qbx_vehiclekeys:GiveKeys(source, vehicle, true)
end

---@param source number
---@param vehicle number
function RevokeVehicleKeys(source, vehicle)
    exports.qbx_vehiclekeys:RemoveKeys(source, vehicle, true)
end
