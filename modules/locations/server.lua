local config = require 'config.shared'

local MAX_VEHICLES = 100
local MAX_SPAWN_POINTS = 20

---@class RentalVehicle
---@field model string spawn code, or a numeric hash as a string
---@field hash number
---@field label string? display name, for addon vehicles without a game label
---@field category string
---@field rentalCost number
---@field hourlyCost number?
---@field pricePerHour number
---@field minRentalDays number
---@field maxRentalDays number
---@field minRentalHours number
---@field maxRentalHours number
---@field fuelLevel number
---@field image string?

---@class RentalLocation
---@field label string
---@field categories string[]
---@field blip { use: boolean, sprite: number, color: number, scale: number, label: string }
---@field ped { model: string, hash: number, coords: table, scenario: string?, renderDistance: number }
---@field vehicles RentalVehicle[]
---@field spawncoords table[]

---@type table<string, RentalLocation> Sanitized locations from config/locations.lua
local defaults = {}

---@type table<string, RentalLocation> Sanitized locations saved from the admin panel
local custom = {}

---@type table<string, RentalLocation> What players see: defaults with custom locations on top
local merged = {}

local Locations = {}

local function clamp(value, min, max, fallback)
    local num = tonumber(value)
    if not num or num ~= num then return fallback end
    return math.min(math.max(num, min), max)
end

local function round(value)
    return math.floor(value * 100 + 0.5) / 100
end

local function cleanString(value, maxLength)
    if type(value) ~= 'string' then return end

    local trimmed = value:match('^%s*(.-)%s*$')
    if trimmed == '' then return end

    return trimmed:sub(1, maxLength)
end

---@param value any model name, numeric hash or numeric string
---@return string?
local function cleanModel(value)
    if type(value) == 'number' then return tostring(math.floor(value)) end

    local model = cleanString(value, 32)
    return model and model:lower()
end

local function modelHash(model)
    return tonumber(model) or joaat(model)
end

---Accepts vector3/vector4 from the config file and plain tables from the panel or database.
local function cleanCoords(coords)
    local kind = type(coords)
    if kind ~= 'table' and kind ~= 'vector3' and kind ~= 'vector4' then return end

    local x, y, z = tonumber(coords.x), tonumber(coords.y), tonumber(coords.z)
    if not x or not y or not z then return end

    local w = kind == 'vector3' and 0 or coords.w
    return { x = round(x), y = round(y), z = round(z), w = round(clamp(w, 0, 360, 0)) }
end

---@return RentalVehicle?, string?
local function cleanVehicle(input)
    if type(input) ~= 'table' then return nil, 'Invalid vehicle entry.' end

    local model = cleanModel(input.model or input.hash)
    if not model then return nil, 'Every vehicle needs a spawn code.' end

    local rentalCost = math.floor(clamp(input.rentalCost, 0, 10000000, 0))
    local hourlyCost = tonumber(input.hourlyCost) and math.floor(clamp(input.hourlyCost, 0, 10000000, 0)) or nil
    local minDays = math.floor(clamp(input.minRentalDays, 1, 365, 1))
    local minHours = math.floor(clamp(input.minRentalHours, 1, 720, 1))

    local image = cleanString(input.image, 256)
    if not image and not tonumber(model) then
        image = config.DefaultImageUrl:format(model)
    end

    return {
        model = model,
        hash = modelHash(model),
        label = cleanString(input.label, 48),
        category = cleanString(input.category, 24) or 'Other',
        rentalCost = rentalCost,
        hourlyCost = hourlyCost,
        pricePerHour = hourlyCost or math.ceil(rentalCost * config.DefaultHourlyRatePercentage / 100),
        minRentalDays = minDays,
        maxRentalDays = math.floor(clamp(input.maxRentalDays, minDays, 365, math.max(minDays, 30))),
        minRentalHours = minHours,
        maxRentalHours = math.floor(clamp(input.maxRentalHours, minHours, 720, math.max(minHours, 24))),
        fuelLevel = round(clamp(input.fuelLevel, 0, 100, 100)),
        image = image,
    }
end

---Categories in the order their vehicles first appear.
local function deriveCategories(vehicles)
    local categories, seen = {}, {}
    for _, vehicle in ipairs(vehicles) do
        if not seen[vehicle.category] then
            seen[vehicle.category] = true
            categories[#categories + 1] = vehicle.category
        end
    end
    return categories
end

local function cleanCategories(input, vehicles)
    if type(input) ~= 'table' then return deriveCategories(vehicles) end

    local categories = {}
    for _, value in ipairs(input) do
        local category = cleanString(value, 24)
        if category then categories[#categories + 1] = category end
    end
    return #categories > 0 and categories or deriveCategories(vehicles)
end

---Validates a location from the config file, the admin panel or the database into one shape.
---@param input any
---@return RentalLocation?, string?
function Locations.sanitize(input)
    if type(input) ~= 'table' then return nil, 'Invalid location data.' end

    local label = cleanString(input.label, 48)
    if not label then return nil, 'Location name is required.' end

    local ped = type(input.ped) == 'table' and input.ped or {}
    local pedModel = cleanModel(ped.model)
    if not pedModel then return nil, 'Agent ped model is required.' end

    local pedCoords = cleanCoords(ped.coords)
    if not pedCoords then return nil, 'Agent position is required.' end

    local vehicles, seen = {}, {}
    for i, entry in ipairs(type(input.vehicles) == 'table' and input.vehicles or {}) do
        if i > MAX_VEHICLES then break end

        local vehicle, err = cleanVehicle(entry)
        if not vehicle then return nil, err end

        -- Rentals pick a vehicle by model hash, so a second entry for the same model could never be rented.
        if seen[vehicle.hash] then
            return nil, ('"%s" is in the fleet more than once.'):format(vehicle.model)
        end
        seen[vehicle.hash] = true

        vehicles[#vehicles + 1] = vehicle
    end
    if #vehicles == 0 then return nil, 'Add at least one vehicle.' end

    local spawncoords = {}
    for i, entry in ipairs(type(input.spawncoords) == 'table' and input.spawncoords or {}) do
        if i > MAX_SPAWN_POINTS then break end

        local coords = cleanCoords(entry)
        if coords then spawncoords[#spawncoords + 1] = coords end
    end
    if #spawncoords == 0 then return nil, 'Add at least one vehicle spawn point.' end

    local blip = type(input.blip) == 'table' and input.blip or {}

    return {
        label = label,
        categories = cleanCategories(input.categories, vehicles),
        blip = {
            use = blip.use ~= false,
            sprite = math.floor(clamp(blip.sprite, 1, 900, 225)),
            color = math.floor(clamp(blip.color, 0, 85, 3)),
            scale = round(clamp(blip.scale, 0.1, 2.0, 0.6)),
            label = cleanString(blip.label, 48) or label,
        },
        ped = {
            model = pedModel,
            hash = modelHash(pedModel),
            coords = pedCoords,
            scenario = cleanString(ped.scenario, 64),
            renderDistance = clamp(ped.renderDistance, 10, 200, 30),
        },
        vehicles = vehicles,
        spawncoords = spawncoords,
    }
end

local function merge()
    merged = {}
    for id, location in pairs(defaults) do
        merged[id] = location
    end
    for id, location in pairs(custom) do
        merged[id] = location
    end
end

local function rebuild()
    merge()
    TriggerClientEvent('butter-rentals:client:setLocations', -1, merged)
end

---@param id string
---@return RentalLocation?
function Locations.get(id)
    return merged[id]
end

---@return table<string, RentalLocation>
function Locations.all()
    return merged
end

---@param id string
---@return 'config'|'custom'|'override'
function Locations.source(id)
    if not custom[id] then return 'config' end
    return defaults[id] and 'override' or 'custom'
end

---@param location RentalLocation
---@param hash number
---@return RentalVehicle?
function Locations.findVehicle(location, hash)
    for _, vehicle in ipairs(location.vehicles) do
        if vehicle.hash == hash then return vehicle end
    end
end

---Finds the first location offering a model, used to look up rates for an existing rental.
---@param hash number?
---@return RentalVehicle?, RentalLocation?
function Locations.findVehicleAnywhere(hash)
    if not hash then return end

    for _, location in pairs(merged) do
        local vehicle = Locations.findVehicle(location, hash)
        if vehicle then return vehicle, location end
    end
end

---@param id string
---@param location RentalLocation sanitized
---@return boolean
function Locations.save(id, location)
    local ok, err = pcall(MySQL.query.await,
        'INSERT INTO butter_rentals_locations (id, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data)',
        { id, json.encode(location) }
    )
    if not ok then
        lib.print.error(('Failed to save rental location %s: %s'):format(id, err))
        return false
    end

    custom[id] = location
    rebuild()
    return true
end

---@param id string
---@return boolean
function Locations.delete(id)
    local ok, err = pcall(MySQL.query.await, 'DELETE FROM butter_rentals_locations WHERE id = ?', { id })
    if not ok then
        lib.print.error(('Failed to delete rental location %s: %s'):format(id, err))
        return false
    end

    custom[id] = nil
    rebuild()
    return true
end

---@param id string
---@return boolean
function Locations.isCustom(id)
    return custom[id] ~= nil
end

---@param label string
---@return string
function Locations.uniqueId(label)
    local base = label:lower():gsub('%s+', '_'):gsub('[^%w_%-]', '')
    if base == '' then base = 'location' end

    local id, n = base, 1
    while merged[id] do
        n += 1
        id = ('%s_%d'):format(base, n)
    end
    return id
end

for id, input in pairs(lib.load('config.locations') or {}) do
    local location, err = Locations.sanitize(input)
    if location then
        defaults[id] = location
    else
        lib.print.error(('Location "%s" in config/locations.lua is invalid: %s'):format(id, err))
    end
end
merge()

---Creates the table and loads saved locations. Called once the database is ready.
function Locations.load()
    MySQL.query.await([[
        CREATE TABLE IF NOT EXISTS `butter_rentals_locations` (
            `id` VARCHAR(64) NOT NULL,
            `data` LONGTEXT NOT NULL,
            `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`)
        )
    ]])

    for _, row in ipairs(MySQL.query.await('SELECT id, data FROM butter_rentals_locations') or {}) do
        local decoded, data = pcall(json.decode, row.data)
        local location, err = Locations.sanitize(decoded and data)
        if location then
            custom[row.id] = location
        else
            lib.print.warn(('Skipping saved rental location %s: %s'):format(row.id, err))
        end
    end

    rebuild()
end

lib.callback.register('butter-rentals:server:getLocations', function()
    return merged
end)

return Locations
