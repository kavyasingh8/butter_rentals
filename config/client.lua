local config = require 'config.shared'

--- Edit this to use your own notifications (Notify = 'custom' in config/shared.lua).
---@param message string
---@param notifyType? 'inform'|'success'|'error'
function Notify(message, notifyType)
    if config.Notify == 'qb' then
        exports['qb-core']:Notify(message, notifyType)
        return
    end

    lib.notify({ description = message, type = notifyType or 'inform' })
end
