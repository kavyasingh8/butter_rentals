if not UseBridge('inventory', 'lj-inventory') then return end

local inventory = exports['lj-inventory']

---@param source number
---@param item string
---@param metadata table
---@return boolean
function AddItem(source, item, metadata)
    return inventory:AddItem(source, item, 1, false, metadata) ~= false
end

---@param source number
---@param item string
---@param slot number
---@return boolean
function RemoveItem(source, item, slot)
    return inventory:RemoveItem(source, item, 1, slot) ~= false
end

--- Slot of the document item that belongs to `plate`.
---@param source number
---@param item string
---@param plate string
---@return number?
function FindItemSlot(source, item, plate)
    for _, data in pairs(GetPlayerItems(source) or {}) do
        local metadata = data.info or data.metadata
        if data.name == item and metadata?.plate == plate then return data.slot end
    end
end

---@param items string[]
---@param cb fun(source: number, item: string, metadata: table?)
function OnItemUse(items, cb)
    for _, name in ipairs(items) do
        RegisterUsableItem(name, function(source, item)
            cb(source, name, item.info or item.metadata)
        end)
    end
end
