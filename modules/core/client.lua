---@class TargetOption
---@field label string
---@field icon string
---@field onSelect fun()

-- Fallbacks for optional bridges. A bridge loaded after this file replaces them.

---@param vehicle number
---@param fuel number
function SetVehicleFuel(vehicle, fuel)
    SetVehicleFuelLevel(vehicle, fuel + 0.0)
end

---@param plate string
function GiveVehicleKeys(plate) end

---@param plate string
function RemoveVehicleKeys(plate) end

function RegisterPhoneApp() end
