return {
    VehicleReturn = {
        ReturnVehicle = true, -- Show the "Return Vehicle" option on rental agents
        ReturnPercentage = 50.0, -- Percentage of the rental price refunded (in cash) on return
        RefundServiceFee = true, -- false: the service fee is taken off the price before the percentage is applied
        OwnerOnlyReturn = true, -- Only the original renter can return the vehicle
        Distance = 20.0, -- How far the vehicle can be from the player when returning it
    },

    ExpiryWarningMinutes = 10, -- Notify the renter this many minutes before a rental ends (0 to disable)

    VersionCheck = true, -- Check GitHub on start and print in the server console when an update is released

    SetPedInsideVehicle = false, -- Warp the player into the vehicle after renting

    MenuLayout = 'side', -- side: panel docked on the right / center: wide window in the middle of the screen

    -- UI colors as hex codes. Every lighter/darker shade is generated from these.
    Theme = {
        background = '#020610', -- Darkest panel color; cards, borders and muted text are tinted from it
        accent = '#4c74f0', -- Buttons, highlights and selected tabs
    },

    ServiceFee = 100,
    DefaultHourlyRatePercentage = 15, -- Hourly price as a percentage of the daily price when a vehicle has no hourlyCost

    item = {
        receipt = 'rental_receipt',
        agreement = 'rental_agreement',
    },

    DefaultGarage = 'pillboxgarage', -- Garage written to player_vehicles (QBCore / QBox only)

    -- N = number, L = letter, anything else is kept as is. Max 8 characters.
    PlateFormat = 'NLLNNNLL',
    -- PlateFormat = 'ABCNNN', -- Always starts with "ABC", then 3 random numbers

    Notify = 'ox', -- ox / qb / custom (edit Notify in config/client.lua)

    -- Image used when a vehicle has no image set. %s is replaced with the spawn code.
    DefaultImageUrl = 'https://raw.githubusercontent.com/MericcaN41/gta5carimages/main/images/%s.png',

    -- In-game panel for creating and editing rental locations. Locations saved there are stored in the
    -- database and override any location in config/locations.lua with the same id.
    Admin = {
        command = 'rentaladmin',
        restricted = 'group.admin',
    },

    -- Rentals app for sd-phone: view active rentals, extend them, locate vehicles and find locations.
    Phone = {
        enabled = true,
        identifier = 'butter_rentals',
        name = 'Rentals',
        description = 'Manage your vehicle rentals and find rental locations.',
        defaultApp = true, -- Installed on every phone without visiting the App Store
        extendPaymentMethod = 'bank', -- cash / bank, used when extending a rental from the phone
    },
}
