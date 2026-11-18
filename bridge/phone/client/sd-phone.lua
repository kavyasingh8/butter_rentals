local config = require 'config.shared'
local resource = cache.resource

local function registerApp()
    if GetResourceState('sd-phone') ~= 'started' then return end

    local ok, err = exports['sd-phone']:addCustomApp({
        identifier = config.Phone.identifier,
        name = config.Phone.name,
        description = config.Phone.description,
        developer = 'ButterChilly',
        defaultApp = config.Phone.defaultApp,
        ui = resource .. '/web/phone.html',
        icon = ('https://cfx-nui-%s/web/phone-icon.svg'):format(resource),
    })

    if not ok then lib.print.error(('Failed to register sd-phone app: %s'):format(err)) end
end

function RegisterPhoneApp()
    registerApp()

    AddEventHandler('onClientResourceStart', function(started)
        if started == 'sd-phone' then registerApp() end
    end)
end
