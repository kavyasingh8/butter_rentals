# butter_rentals

Vehicle rental resource for QBox, QBCore and ESX. Players rent cars, boats and aircraft from an agent ped, get a receipt and a rental agreement as items, and return the vehicle for a partial refund.

## Features

- Rent by the day or by the hour, paid with cash or bank
- Receipt and agreement items that open as documents in game
- Return the vehicle to any agent for a configurable refund
- Rentals expire automatically, with a warning before they end
- Keys are given on rent and removed on return
- In-game admin panel for creating and editing rental locations
- Rentals app for sd-phone: view, extend and locate rentals, and browse locations
- Two menu layouts and a configurable color theme
- Translatable through `locales/*.json`
- Prints a message in the server console when a new release is out

## Requirements

- [ox_lib](https://github.com/overextended/ox_lib)
- [oxmysql](https://github.com/overextended/oxmysql)
- A framework: qbx_core, qb-core or es_extended
- A target: ox_target, qb-target or interact
- An inventory: ox_inventory, qb-inventory, ps-inventory, lj-inventory or codem-inventory

Optional:

- A fuel resource (see [Supported resources](#supported-resources))
- A vehicle keys resource (see [Vehicle keys](#vehicle-keys))
- [sd-phone](https://github.com/Samuels-Development/sd-phone) for the Rentals app

## Installation

1. Put `butter_rentals` in your resources folder.
2. Add the items from `[docs]/items.lua` to your inventory.
3. Copy `[docs]/images` into your inventory's image folder.
4. Add it to `server.cfg` after your framework, inventory and target:

   ```cfg
   ensure butter_rentals
   ```

5. Start the server. The database is set up automatically (see [Database](#database)).

## Configuration

| File | What it holds |
| --- | --- |
| `config/shared.lua` | Prices, return rules, plates, theme, notifications, admin and phone settings |
| `config/locations.lua` | Default rental locations, their vehicles, peds, blips and spawn points. Only the server reads this file. |
| `config/client.lua` | The `Notify` function, for custom notifications (`Notify = 'custom'`) |
| `locales/*.json` | Player-facing text for the game and the UI |

### Main options

| Option | Default | Description |
| --- | --- | --- |
| `VehicleReturn.ReturnVehicle` | `true` | Show the "Return Vehicle" option on agents |
| `VehicleReturn.ReturnPercentage` | `50.0` | Percentage of the price refunded in cash on return |
| `VehicleReturn.RefundServiceFee` | `true` | `false` takes the service fee off before the percentage is applied |
| `VehicleReturn.OwnerOnlyReturn` | `true` | Only the renter can return the vehicle |
| `VehicleReturn.Distance` | `20.0` | Maximum distance between the player and the vehicle on return |
| `ExpiryWarningMinutes` | `10` | Warn the renter this many minutes before the rental ends. `0` disables it. |
| `VersionCheck` | `true` | Check GitHub for a new release on start |
| `SetPedInsideVehicle` | `false` | Put the player in the vehicle after renting |
| `MenuLayout` | `'side'` | `side` or `center` |
| `Theme` | | `background` and `accent` hex colors. Every other shade is generated from them. |
| `ServiceFee` | `100` | Flat fee added to every rental |
| `DefaultHourlyRatePercentage` | `15` | Hourly price as a percentage of the daily price when a vehicle has no `hourlyCost` |
| `PlateFormat` | `'NLLNNNLL'` | `N` is a number, `L` is a letter, anything else is kept. Max 8 characters. |
| `DefaultGarage` | `'pillboxgarage'` | Garage written to `player_vehicles` (QBCore and QBox only) |
| `Notify` | `'ox'` | `ox`, `qb` or `custom` |
| `DefaultImageUrl` | | Image used when a vehicle has none. `%s` is replaced with the spawn code. |

### Locations

Each location in `config/locations.lua` has a `label`, an optional `categories` list, a `blip`, a `ped` and its `spawncoords`. Each vehicle supports:

| Field | Description |
| --- | --- |
| `model` | Spawn code |
| `label` | Display name. Optional, defaults to the game label. |
| `category` | Tab the vehicle is listed under |
| `rentalCost` | Price per day |
| `hourlyCost` | Price per hour. Optional. |
| `minRentalDays` / `maxRentalDays` | Day limits |
| `minRentalHours` / `maxRentalHours` | Hour limits. Optional, default `1` / `24`. |
| `fuelLevel` | `0` to `100` |
| `image` | Optional, defaults to `DefaultImageUrl` |

Spawn points blocked by a vehicle or a ped are skipped. If all of them are blocked, the player is told to clear the area.

## Admin panel

Admins manage rental locations in game with `/rentaladmin`.

- The command and allowed group are set in `Admin.command` and `Admin.restricted` (default `group.admin`).
- Locations are stored in the `butter_rentals_locations` table.
- Saving a location from `config/locations.lua` stores an override in the database. **Revert to config** drops it.
- Changes reach every player instantly, including blips and agent peds.
- **Use my position** and **Add my position** capture coordinates. Sit in a vehicle when adding a spawn point to capture its heading.

## sd-phone app

When sd-phone is running, a **Rentals** app is added to the phone. Players can:

- See active rentals and the time left on each
- Extend a rental, up to the vehicle's maximum duration, paid with `Phone.extendPaymentMethod`
- Set a GPS route to a rented vehicle or to any rental location
- Browse each location's vehicles and prices

Start order does not matter. The app is added whenever sd-phone starts. Set `Phone.enabled = false` to turn it off, or `Phone.defaultApp = false` to make players install it from the App Store.

## Vehicle keys

| Resource | Give on rent | Remove on return |
| --- | --- | --- |
| qbx_vehiclekeys | yes | yes |
| Renewed-Vehiclekeys | yes | yes |
| wasabi_carlock | yes | yes |
| jaksam vehicles_keys | yes | yes |
| MrNewbVehicleKeys | yes | yes |
| t1ger_keys | yes | yes |
| qb-vehiclekeys, cd_garage, okokGarage | yes | no (no documented removal API) |

## Supported resources

| Category | Resources |
| --- | --- |
| Framework | qbx_core, qb-core, es_extended |
| Inventory | ox_inventory, qb-inventory, ps-inventory, lj-inventory, codem-inventory |
| Target | ox_target, qb-target, interact |
| Fuel | ox_fuel, LegacyFuel, cdn-fuel, ps-fuel, lj-fuel, Renewed-Fuel, rcore_fuel, lc_fuel, nd_fuel, okokGasStation, hyon_gas_station, butter_fuel |
| Phone | sd-phone |

The right bridge is picked automatically from the resources that are running. The server console lists the loaded bridges on start.

## Database

On first start these columns are added to `player_vehicles` (or `owned_vehicles` on ESX) when missing, together with an index:

`rental`, `rental_days`, `rental_hours`, `rental_start_date`, `rental_price`, `rental_location`

The `butter_rentals_locations` table is also created. Existing data is kept.

## Translations

Copy `locales/en.json` to a new language code, for example `de.json`, translate it and set:


## Debugging

Debug output uses ox_lib's print levels:

```cfg
setr ox:printlevel:butter_rentals debug
```

