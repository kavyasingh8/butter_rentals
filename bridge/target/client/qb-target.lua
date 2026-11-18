if not UseBridge('target', 'qb-target') then return end

---@param ped number
---@param _ string
---@param options TargetOption[]
function AddTargetPed(ped, _, options)
    local targetOptions = {}
    for i, option in ipairs(options) do
        targetOptions[i] = { label = option.label, icon = 'fas ' .. option.icon, action = option.onSelect }
    end
    exports['qb-target']:AddTargetEntity(ped, { options = targetOptions, distance = 2.5 })
end

---@param ped number
function RemoveTargetPed(ped)
    exports['qb-target']:RemoveTargetEntity(ped)
end
