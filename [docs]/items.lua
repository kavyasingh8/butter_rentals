-- Copy the images in [docs]/images into your inventory's image folder.

-- ox_inventory: add to ox_inventory/data/items.lua
['rental_receipt'] = {
    label = 'Rental Receipt',
    weight = 10,
    stack = false,
    close = true,
    description = 'Proof of payment for a rented vehicle.',
    server = { export = 'butter_rentals.openDocument' },
},

['rental_agreement'] = {
    label = 'Rental Agreement',
    weight = 10,
    stack = false,
    close = true,
    description = 'Signed agreement for a rented vehicle.',
    server = { export = 'butter_rentals.openDocument' },
},

-- qb-inventory / ps-inventory / lj-inventory: add to qb-core/shared/items.lua
rental_receipt = {
    name = 'rental_receipt',
    label = 'Rental Receipt',
    weight = 10,
    type = 'item',
    image = 'rental_receipt.png',
    unique = true,
    useable = true,
    shouldClose = true,
    description = 'Proof of payment for a rented vehicle.',
},

rental_agreement = {
    name = 'rental_agreement',
    label = 'Rental Agreement',
    weight = 10,
    type = 'item',
    image = 'rental_agreement.png',
    unique = true,
    useable = true,
    shouldClose = true,
    description = 'Signed agreement for a rented vehicle.',
},
