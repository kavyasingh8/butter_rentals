local config = require 'config.shared'

if not config.VersionCheck then return end

local resource = cache.resource
local currentTag = GetResourceMetadata(resource, 'version', 0)
local repository = GetResourceMetadata(resource, 'repository', 0)
local slug = repository and repository:match('github%.com/([^/]+/[^/%s]+)')

local FAILURES = {
    [403] = 'GitHub rate limit reached, update check skipped.',
    [404] = 'No published release found for %s. Is the repository public with a release?',
    [429] = 'GitHub rate limit reached, update check skipped.',
}

---@param version string?
---@return integer[]?
local function parseVersion(version)
    local major, minor, patch = (version or ''):match('(%d+)%.(%d+)%.?(%d*)')
    if not major then return end

    return { tonumber(major), tonumber(minor), tonumber(patch) or 0 }
end

---@param a integer[]
---@param b integer[]
---@return integer -1 when a is older than b, 1 when newer, 0 when equal
local function compareVersions(a, b)
    for i = 1, 3 do
        if a[i] ~= b[i] then return a[i] < b[i] and -1 or 1 end
    end
    return 0
end

---@param current integer[]
---@param status integer
---@param body string?
local function onRelease(current, status, body)
    if status ~= 200 then
        local message = FAILURES[status] or 'Update check failed (HTTP %s).'
        lib.print.warn(message:format(status == 404 and slug or status))
        return
    end

    local ok, release = pcall(json.decode, body or '')
    local latest = ok and type(release) == 'table' and parseVersion(release.tag_name)
    if not latest then
        lib.print.warn('Update check failed: the latest release has no readable version tag.')
        return
    end

    local result = compareVersions(current, latest)
    if result < 0 then
        lib.print.warn(('Update available: %s -> %s\n%s'):format(currentTag, release.tag_name, release.html_url))
    elseif result == 0 then
        lib.print.info(('Running the latest version (%s).'):format(currentTag))
    else
        lib.print.info(('Running %s, newer than the latest release (%s).'):format(currentTag, release.tag_name))
    end
end

local current = parseVersion(currentTag)
if not current or not slug then
    lib.print.warn('Update check skipped: set a "version" and a GitHub "repository" in fxmanifest.lua.')
    return
end

PerformHttpRequest(('https://api.github.com/repos/%s/releases/latest'):format((slug:gsub('%.git$', ''))), function(status, body)
    onRelease(current, status, body)
end, 'GET', '', { ['User-Agent'] = resource, ['Accept'] = 'application/vnd.github+json' })
