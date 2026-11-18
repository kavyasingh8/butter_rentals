--[[
    Rental locations, keyed by a unique id. Only the server reads this file.

    Vehicle fields:
        model           spawn code
        label           display name (optional, defaults to the game label; useful for addon vehicles)
        category        tab the vehicle is listed under
        rentalCost      price per day
        hourlyCost      price per hour (optional, defaults to DefaultHourlyRatePercentage of rentalCost)
        minRentalDays / maxRentalDays
        minRentalHours / maxRentalHours (optional, default 1 / 24)
        fuelLevel       0 - 100
        image           optional, defaults to DefaultImageUrl

    categories is optional. When set, only those tabs are shown (every vehicle is still listed under "All").
]]

return {
    ['Downtown Rentals'] = {
        label = 'Downtown Rentals',
        categories = { 'Super', 'Sport', 'Muscle', 'Coupe', 'Motorcycle' },
        blip = { use = true, sprite = 198, color = 22, scale = 0.6, label = 'Downtown Rentals' },
        ped = {
            model = 's_m_m_highsec_01',
            coords = vector4(-1246.33, -239.75, 39.93, 293.58),
            scenario = 'WORLD_HUMAN_CLIPBOARD',
        },
        vehicles = {
            { model = 'bmx', category = 'Super', rentalCost = 50, minRentalDays = 1, maxRentalDays = 7, fuelLevel = 100.0 },
            { model = 'asterope', category = 'Sport', rentalCost = 300, minRentalDays = 1, maxRentalDays = 10, fuelLevel = 100.0 },
            { model = 'bison', category = 'Sport', rentalCost = 300, minRentalDays = 1, maxRentalDays = 10, fuelLevel = 100.0 },
            { model = 'adder', category = 'Super', rentalCost = 800, minRentalDays = 1, maxRentalDays = 7, fuelLevel = 100.0 },
            { model = 'sultan', category = 'Sport', rentalCost = 450, minRentalDays = 1, maxRentalDays = 10, fuelLevel = 100.0 },
            { model = 'bati', category = 'Motorcycle', rentalCost = 250, minRentalDays = 1, maxRentalDays = 5, fuelLevel = 100.0 },
            { model = 'buffalo', category = 'Muscle', rentalCost = 400, minRentalDays = 1, maxRentalDays = 8, fuelLevel = 100.0 },
            { model = 'f620', category = 'Coupe', rentalCost = 350, minRentalDays = 1, maxRentalDays = 7, fuelLevel = 100.0 },
        },
        spawncoords = {
            vector4(-1270.44, -250.75, 42.1, 212.91),
            vector4(-1273.58, -253.15, 42.1, 214.42),
            vector4(-1276.7, -255.47, 42.1, 212.74),
            vector4(-1259.1, -228.63, 42.1, 303.75),
        },
    },

    ['Boat Rental'] = {
        label = 'Del Perro Marina',
        categories = { 'Boat' },
        blip = { use = true, sprite = 410, color = 3, scale = 0.6, label = 'Boat Rentals' },
        ped = {
            model = 's_m_m_dockwork_01',
            coords = vector4(-805.21, -1496.92, 1.6, 111.24),
            scenario = 'WORLD_HUMAN_CLIPBOARD',
        },
        vehicles = {
            { model = 'dinghy', category = 'Boat', rentalCost = 300, minRentalDays = 1, maxRentalDays = 5, fuelLevel = 100.0 },
            { model = 'jetmax', category = 'Boat', rentalCost = 600, minRentalDays = 1, maxRentalDays = 5, fuelLevel = 100.0 },
            { model = 'toro', category = 'Boat', rentalCost = 750, minRentalDays = 1, maxRentalDays = 7, fuelLevel = 100.0 },
            { model = 'suntrap', category = 'Boat', rentalCost = 250, minRentalDays = 1, maxRentalDays = 3, fuelLevel = 100.0 },
            { model = 'seashark', category = 'Boat', rentalCost = 200, minRentalDays = 1, maxRentalDays = 2, fuelLevel = 100.0 },
        },
        spawncoords = {
            vector4(-798.45, -1505.22, 0.0, 110.0),
            vector4(-792.88, -1510.71, 0.0, 108.4),
            vector4(-786.32, -1516.29, 0.0, 106.7),
        },
    },

    ['Aircraft Rental'] = {
        label = 'LSIA Hangar Rentals',
        categories = { 'Plane', 'Helicopter' },
        blip = { use = true, sprite = 251, color = 38, scale = 0.6, label = 'Aircraft Rentals' },
        ped = {
            model = 's_m_m_pilot_01',
            coords = vector4(-941.16, -2955.42, 13.95, 60.12),
            scenario = 'WORLD_HUMAN_STAND_IMPATIENT',
        },
        vehicles = {
            { model = 'dodo', category = 'Plane', rentalCost = 1200, minRentalDays = 1, maxRentalDays = 7, fuelLevel = 100.0 },
            { model = 'mammatus', category = 'Plane', rentalCost = 900, minRentalDays = 1, maxRentalDays = 7, fuelLevel = 100.0 },
            { model = 'velum', category = 'Plane', rentalCost = 1100, minRentalDays = 1, maxRentalDays = 10, fuelLevel = 100.0 },
            { model = 'frogger', category = 'Helicopter', rentalCost = 1500, minRentalDays = 1, maxRentalDays = 5, fuelLevel = 100.0 },
            { model = 'swift', category = 'Helicopter', rentalCost = 2000, minRentalDays = 1, maxRentalDays = 5, fuelLevel = 100.0 },
        },
        spawncoords = {
            vector4(-970.45, -2994.52, 13.95, 60.0),
            vector4(-980.12, -3004.33, 13.95, 60.0),
            vector4(-990.88, -3013.94, 13.95, 60.0),
        },
    },
}
