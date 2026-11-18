if not UseBridge('framework', 'es_extended') then return end

FrameworkName = 'esx'

local ESX = exports.es_extended:getSharedObject()
local ACCOUNTS = { cash = 'money', bank = 'bank' }

---@param source number
---@return RentalPlayer?
function GetPlayerData(source)
    local player = ESX.GetPlayerFromId(source)
    if not player then return end

    return {
        citizenId = player.identifier,
        license = player.identifier,
        name = player.getName(),
    }
end

--- Server ID of an online character.
---@param identifier string
---@return number?
function GetPlayerSource(identifier)
    local player = ESX.GetPlayerFromIdentifier(identifier)
    return player and player.source
end

---@param source number
---@param account 'cash'|'bank'
---@return number
local function getMoney(source, account)
    local player = ESX.GetPlayerFromId(source)
    local data = player and player.getAccount(ACCOUNTS[account])
    return data and data.money or 0
end

---@param source number
---@param account 'cash'|'bank'
---@param amount number
---@return boolean
function RemoveMoney(source, account, amount)
    local player = ESX.GetPlayerFromId(source)
    if not player or getMoney(source, account) < amount then return false end

    player.removeAccountMoney(ACCOUNTS[account], amount)
    return true
end

---@param source number
---@param account 'cash'|'bank'
---@param amount number
---@return boolean
function AddMoney(source, account, amount)
    local player = ESX.GetPlayerFromId(source)
    if not player then return false end

    player.addAccountMoney(ACCOUNTS[account], amount)
    return true
end

---@param source number
---@return table?
function GetPlayerItems(source)
    local player = ESX.GetPlayerFromId(source)
    return player and player.getInventory()
end

---@param name string
---@param cb fun(source: number, item: table)
function RegisterUsableItem(name, cb)
    ESX.RegisterUsableItem(name, cb)
end
