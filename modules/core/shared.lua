local IS_SERVER = IsDuplicityVersion()

--- True only for a resource started under exactly this name. GetResourceState
--- also reports names a resource `provide`s (qbx_core providing qb-core),
--- which would load the wrong bridge.
---@param name string
---@return boolean
function IsResourceStarted(name)
    for i = 0, GetNumResources() - 1 do
        if GetResourceByFindIndex(i) == name then
            return GetResourceState(name) == 'started'
        end
    end
    return false
end

local loadedBridges = {} ---@type table<string, string>

--- Bridge guard: true when `resource` is started, and records it for the
--- startup log. A later bridge in the same category replaces the earlier
--- one's functions, so running two of them is warned about.
---@param category string
---@param resource string
---@return boolean
function UseBridge(category, resource)
    if not IsResourceStarted(resource) then return false end

    local previous = loadedBridges[category]
    if previous then
        lib.print.warn(('%s and %s are both running for %s, %s is used'):format(previous, resource, category, resource))
    end
    loadedBridges[category] = resource
    return true
end

--- Categories the resource cannot run without, checked once every script has loaded.
local REQUIRED = IS_SERVER
    and { framework = 'qbx_core, qb-core or es_extended', inventory = 'ox_inventory, qb-inventory, ps-inventory, lj-inventory or codem-inventory' }
    or { target = 'ox_target, qb-target or interact' }

CreateThread(function()
    local categories = {}
    for category in pairs(loadedBridges) do categories[#categories + 1] = category end
    table.sort(categories)

    lib.print.info(('Loaded %s bridges:'):format(IS_SERVER and 'server' or 'client'))
    for _, category in ipairs(categories) do
        lib.print.info(('  %-12s ^5%s^7'):format(category, loadedBridges[category]))
    end

    for category, options in pairs(REQUIRED) do
        if not loadedBridges[category] then
            lib.print.error(('No supported %s is running. Start %s before %s.'):format(category, options, cache.resource))
        end
    end
end)
