if not UseBridge('framework', 'qb-core') then return end

FrameworkName = 'qb'

local QBCore = exports['qb-core']:GetCoreObject()

---@param source number
---@return RentalPlayer?
function GetPlayerData(source)
    local player = QBCore.Functions.GetPlayer(source)
    if not player then return end

    local data = player.PlayerData
    return {
        citizenId = data.citizenid,
        license = data.license,
        name = ('%s %s'):format(data.charinfo.firstname, data.charinfo.lastname),
    }
end

--- Server ID of an online character.
---@param citizenId string
---@return number?
function GetPlayerSource(citizenId)
    local player = QBCore.Functions.GetPlayerByCitizenId(citizenId)
    return player and player.PlayerData.source
end

--- QBCore lets bank go negative, so the balance is checked first.
---@param source number
---@param account 'cash'|'bank'
---@param amount number
---@param reason string
---@return boolean
function RemoveMoney(source, account, amount, reason)
    local player = QBCore.Functions.GetPlayer(source)
    if not player or player.Functions.GetMoney(account) < amount then return false end

    return player.Functions.RemoveMoney(account, amount, reason) ~= false
end

---@param source number
---@param account 'cash'|'bank'
---@param amount number
---@param reason string
---@return boolean
function AddMoney(source, account, amount, reason)
    local player = QBCore.Functions.GetPlayer(source)
    if not player then return false end

    return player.Functions.AddMoney(account, amount, reason) ~= false
end

---@param source number
---@return table?
function GetPlayerItems(source)
    local player = QBCore.Functions.GetPlayer(source)
    return player and player.PlayerData.items
end

---@param name string
---@param cb fun(source: number, item: table)
function RegisterUsableItem(name, cb)
    QBCore.Functions.CreateUseableItem(name, cb)
end
