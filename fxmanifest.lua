fx_version 'cerulean'
game 'gta5'
lua54 'yes'
use_experimental_fxv2_oal 'yes'

author 'ButterChilly'
description 'A vehicle rental resource for your FiveM server'
version '1.0.0'
repository 'https://github.com/ButterChilly/butter_rentals'

ox_lib 'locale'

shared_scripts {
    '@ox_lib/init.lua',
    'modules/core/shared.lua',
}

client_scripts {
    'config/client.lua',
    'modules/core/client.lua',
    'bridge/**/client/*.lua',
    'modules/rental/client.lua',
    'modules/admin/client.lua',
    'modules/placement/client.lua',
    'modules/phone/client.lua',
}

server_scripts {
    '@oxmysql/lib/MySQL.lua',
    'modules/core/server.lua',
    'modules/version/server.lua',
    'bridge/**/server/*.lua',
    'modules/rental/server.lua',
    'modules/admin/server.lua',
    'modules/phone/server.lua',
}

ui_page 'web/index.html'

files {
    'config/shared.lua',
    'locales/*.json',
    'modules/locations/client.lua',
    'modules/utils/client.lua',
    'web/index.html',
    'web/phone.html',
    'web/**/*',
}

dependencies {
    'ox_lib',
    'oxmysql',
}
