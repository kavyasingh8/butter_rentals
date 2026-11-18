local Utils = {}

-- Matches the vehicle types CreateVehicleServerSetter accepts, by vehicle class.
local CLASS_TYPES = {
    [8] = 'bike',
    [13] = 'bike',
    [14] = 'boat',
    [15] = 'heli',
    [16] = 'plane',
}

---@param hash number
---@return string
function Utils.getVehicleLabel(hash)
    local name = GetDisplayNameFromVehicleModel(hash)
    local label = GetLabelText(name)
    return label ~= 'NULL' and label or name
end

---@param hash number
---@return string
function Utils.getVehicleType(hash)
    if hash == `submersible` or hash == `submersible2` or hash == `kosatka` then return 'submarine' end

    return CLASS_TYPES[GetVehicleClassFromName(hash)] or 'automobile'
end

---The "ui" locale strings, without their prefix, for the NUI pages.
---@return table<string, string>
function Utils.getUiLocale()
    local strings = {}
    for key, value in pairs(lib.getLocales()) do
        local name = key:match('^ui%.(.+)$')
        if name then strings[name] = value end
    end
    return strings
end

---@param value number
---@return number
function Utils.round(value)
    return math.floor(value * 100 + 0.5) / 100
end

return Utils
