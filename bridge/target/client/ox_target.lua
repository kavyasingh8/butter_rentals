if not UseBridge('target', 'ox_target') then return end

---@param ped number
---@param id string
---@param options TargetOption[]
function AddTargetPed(ped, id, options)
    local targetOptions = {}
    for i, option in ipairs(options) do
        targetOptions[i] = {
            name = ('butter_rentals:%s:%d'):format(id, i),
            label = option.label,
            icon = 'fa-solid ' .. option.icon,
            distance = 2.5,
            onSelect = option.onSelect,
        }
    end
    exports.ox_target:addLocalEntity(ped, targetOptions)
end

---@param ped number
function RemoveTargetPed(ped)
    exports.ox_target:removeLocalEntity(ped)
end
