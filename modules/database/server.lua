local config = require 'config.shared'

local isESX = FrameworkName == 'esx'
local TABLE = isESX and 'owned_vehicles' or 'player_vehicles'
local OWNER = isESX and 'owner' or 'citizenid'
local MODEL = isESX and 'vehicle' or 'hash'

-- Seconds left on a rental, computed in SQL so it always matches the expiry check.
local REMAINING = [[GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(), IF(rental_hours IS NOT NULL,
    DATE_ADD(rental_start_date, INTERVAL rental_hours HOUR),
    DATE_ADD(rental_start_date, INTERVAL rental_days DAY))))]]

local EXPIRED = [[rental = 1 AND (
    (rental_hours IS NOT NULL AND DATE_ADD(rental_start_date, INTERVAL rental_hours HOUR) <= NOW()) OR
    (rental_hours IS NULL AND DATE_ADD(rental_start_date, INTERVAL rental_days DAY) <= NOW())
)]]

local COLUMNS = {
    rental = 'TINYINT(1) NOT NULL DEFAULT 0',
    rental_days = 'INT NULL DEFAULT NULL',
    rental_hours = 'INT NULL DEFAULT NULL',
    rental_start_date = 'DATETIME NULL DEFAULT NULL',
    rental_price = 'INT NOT NULL DEFAULT 0',
    rental_location = 'VARCHAR(64) NULL DEFAULT NULL',
}

-- ESX stores vehicles by type; anything that is not a boat or aircraft is a car.
local ESX_TYPES = { boat = 'boat', heli = 'aircraft', plane = 'aircraft' }

---@class RentalRow
---@field plate string
---@field owner string
---@field hash number?
---@field rentalDays number?
---@field rentalHours number?
---@field price number
---@field location string? id of the location it was rented from, nil for rentals made before it was stored
---@field remaining number seconds until the rental expires

local Database = {}

---@param row table
---@return RentalRow
local function toRental(row)
    local hash = tonumber(row.model)
    if not hash and row.model then
        local ok, data = pcall(json.decode, row.model)
        hash = ok and type(data) == 'table' and tonumber(data.model) or nil
    end

    return {
        plate = row.plate,
        owner = row.owner,
        hash = hash,
        rentalDays = row.rental_days,
        rentalHours = row.rental_hours,
        price = row.rental_price or 0,
        location = row.rental_location,
        remaining = row.remaining or 0,
    }
end

local SELECT_RENTAL = ('SELECT plate, %s AS owner, %s AS model, rental_days, rental_hours, rental_price, rental_location, %s AS remaining FROM %s')
    :format(OWNER, MODEL, REMAINING, TABLE)

---Adds the rental columns and index to the vehicles table when an install is missing them.
function Database.migrate()
    local existing = MySQL.query.await(
        'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
        { TABLE }
    )

    if not existing or #existing == 0 then
        error(('Vehicle table %s was not found. Is your framework installed?'):format(TABLE))
    end

    local present = {}
    for _, row in ipairs(existing) do
        present[row.COLUMN_NAME] = true
    end

    for column, definition in pairs(COLUMNS) do
        if not present[column] then
            MySQL.query.await(('ALTER TABLE `%s` ADD COLUMN `%s` %s'):format(TABLE, column, definition))
            lib.print.info(('Added column %s.%s'):format(TABLE, column))
        end
    end

    local index = MySQL.scalar.await(
        'SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?',
        { TABLE, 'idx_butter_rental' }
    )
    if not index then
        MySQL.query.await(('CREATE INDEX `idx_butter_rental` ON `%s` (`rental`)'):format(TABLE))
    end
end

---@param plate string
---@return boolean
function Database.plateExists(plate)
    return MySQL.scalar.await(('SELECT 1 FROM %s WHERE plate = ? LIMIT 1'):format(TABLE), { plate }) ~= nil
end

---@class NewRental
---@field license string
---@field citizenId string
---@field model string
---@field hash number
---@field vehicleType string
---@field locationId string
---@field plate string
---@field days number?
---@field hours number?
---@field price number

---@param rental NewRental
---@return boolean
function Database.insertRental(rental)
    if isESX then
        local id = MySQL.insert.await(
            [[INSERT INTO owned_vehicles (owner, plate, vehicle, type, stored, rental, rental_days, rental_hours, rental_start_date, rental_price, rental_location)
              VALUES (?, ?, ?, ?, 0, 1, ?, ?, NOW(), ?, ?)]],
            {
                rental.citizenId,
                rental.plate,
                json.encode({ model = rental.hash, plate = rental.plate }),
                ESX_TYPES[rental.vehicleType] or 'car',
                rental.days,
                rental.hours,
                rental.price,
                rental.locationId,
            }
        )
        return id ~= nil
    end

    local id = MySQL.insert.await(
        [[INSERT INTO player_vehicles (license, citizenid, vehicle, hash, mods, plate, garage, state, rental, rental_days, rental_hours, rental_start_date, rental_price, rental_location)
          VALUES (?, ?, ?, ?, '{}', ?, ?, 0, 1, ?, ?, NOW(), ?, ?)]],
        {
            rental.license,
            rental.citizenId,
            rental.model,
            rental.hash,
            rental.plate,
            config.DefaultGarage,
            rental.days,
            rental.hours,
            rental.price,
            rental.locationId,
        }
    )
    return id ~= nil
end

---@param plate string
---@return RentalRow?
function Database.getRental(plate)
    local row = MySQL.single.await(SELECT_RENTAL .. ' WHERE plate = ? AND rental = 1', { plate })
    return row and toRental(row)
end

---Active rentals owned by a character.
---@param owner string
---@return RentalRow[]
function Database.getRentals(owner)
    local rows = MySQL.query.await(SELECT_RENTAL .. (' WHERE %s = ? AND rental = 1'):format(OWNER), { owner })
    if not rows then
        lib.print.error(('Failed to fetch rentals for %s'):format(owner))
        return {}
    end

    for i, row in ipairs(rows) do
        rows[i] = toRental(row)
    end
    return rows
end

---Adds days or hours to an active rental and records what was paid for it.
---@param plate string
---@param unit 'days'|'hours'
---@param amount number
---@param cost number
---@return boolean
function Database.extendRental(plate, unit, amount, cost)
    local column = unit == 'hours' and 'rental_hours' or 'rental_days'
    local query = ('UPDATE %s SET %s = %s + ?, rental_price = rental_price + ? WHERE plate = ? AND rental = 1')
        :format(TABLE, column, column)

    return (MySQL.update.await(query, { amount, cost, plate }) or 0) > 0
end

---@param plate string
---@return boolean deleted
function Database.deleteRental(plate)
    return (MySQL.update.await(('DELETE FROM %s WHERE plate = ? AND rental = 1'):format(TABLE), { plate }) or 0) > 0
end

---Active rentals that end within `seconds`.
---@param seconds number
---@return { plate: string, owner: string, remaining: number }[]
function Database.getExpiringRentals(seconds)
    local rows = MySQL.query.await(
        ('SELECT plate, %s AS owner, %s AS remaining FROM %s WHERE rental = 1 HAVING remaining BETWEEN 1 AND ?')
            :format(OWNER, REMAINING, TABLE),
        { seconds }
    )
    if not rows then
        lib.print.error('Failed to fetch expiring rentals')
        return {}
    end
    return rows
end

---@return string[]
function Database.getExpiredPlates()
    local rows = MySQL.query.await(('SELECT plate FROM %s WHERE %s'):format(TABLE, EXPIRED))
    if not rows then
        lib.print.error('Failed to fetch expired rentals')
        return {}
    end

    local plates = {}
    for i, row in ipairs(rows) do
        plates[i] = row.plate
    end
    return plates
end

---@param plates string[]
function Database.deleteRentals(plates)
    if #plates == 0 then return end

    local placeholders = ('?, '):rep(#plates):sub(1, -3)
    MySQL.update.await(('DELETE FROM %s WHERE rental = 1 AND plate IN (%s)'):format(TABLE, placeholders), plates)
end

return Database
