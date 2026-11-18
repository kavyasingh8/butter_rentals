if not UseBridge('inventory', 'ox_inventory') then return end

local ox = exports.ox_inventory
local useHandler

-- Referenced by the items in ox_inventory: server = { export = 'butter_rentals.openDocument' }
exports('openDocument', function(event, item, inventory, slot)
    if event ~= 'usingItem' or not useHandler then return end

    local slotData = ox:GetSlot(inventory.id, slot)
    useHandler(inventory.id, item.name, slotData and slotData.metadata)
    return false
end)

---@param source number
---@param item string
---@param metadata table
---@return boolean
function AddItem(source, item, metadata)
    return ox:AddItem(source, item, 1, metadata) == true
end

---@param source number
---@param item string
---@param slot number
---@return boolean
function RemoveItem(source, item, slot)
    return ox:RemoveItem(source, item, 1, nil, slot) == true
end

--- Slot of the document item that belongs to `plate`.
---@param source number
---@param item string
---@param plate string
---@return number?
function FindItemSlot(source, item, plate)
    for _, data in pairs(ox:Search(source, 'slots', item) or {}) do
        if data.metadata?.plate == plate then return data.slot end
    end
end

--- ox_inventory calls the openDocument export, so the item names are not needed here.
---@param _ string[]
---@param cb fun(source: number, item: string, metadata: table?)
function OnItemUse(_, cb)
    useHandler = cb
end
