if not UseBridge('target', 'interact') then return end

---@param ped number
---@param id string
---@param options TargetOption[]
function AddTargetPed(ped, id, options)
    local interactOptions = {}
    for i, option in ipairs(options) do
        interactOptions[i] = { label = option.label, action = option.onSelect }
    end
    exports.interact:AddLocalEntityInteraction({
        entity = ped,
        id = 'butter_rentals:' .. id,
        distance = 2.0,
        options = interactOptions,
    })
end

---@param ped number
---@param id string
function RemoveTargetPed(ped, id)
    exports.interact:RemoveLocalEntityInteraction(ped, 'butter_rentals:' .. id)
end
