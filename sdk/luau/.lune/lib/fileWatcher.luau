local fs = require("@lune/fs")
local date = require("@lune/datetime")
local task = require("@lune/task")

type fileMap = {
	path: string,
	children: { fileMap | string },
}

local function setupWatcher(
	directory: string,
	callback: (files: { string }) -> any,
	onDelete: (files: { string }) -> any
)
	local lastModified: number = nil :: any
	local lastMap: fileMap = {
		path = directory,
		children = {},
	}

	local function scanFiles(dir: string, map: fileMap)
		local files = fs.readDir(dir)
		local modified = {}

		for _, file in files do
			local path = dir .. "/" .. file
			local meta = fs.metadata(path)

			local childValue = meta.kind == "file" and path or {
				path = path,
				children = {},
			}

			table.insert(map.children, childValue)

			if meta.kind == "file" then
				if lastModified and meta.modifiedAt.unixTimestamp > lastModified then
					table.insert(modified, path)
				end
			elseif meta.kind == "dir" then
				local subModified = scanFiles(path, childValue :: fileMap)

				for _, subPath in subModified do
					table.insert(modified, subPath)
				end
			end
		end

		return modified
	end

	while true do
		local currentMap = {
			path = directory,
			children = {},
		}

		local modified = scanFiles(directory, currentMap)

		if #modified > 0 then
			-- -0.5 to account for time that may have passed at some point
			-- in my own testing, i experienced a lot of issues with the file watcher not detecting changes
			-- so this is an attempt to fix that
			lastModified = date.now().unixTimestamp - 0.5
			task.spawn(callback, modified)
		elseif lastModified == nil then
			lastModified = date.now().unixTimestamp - 3
		end

		local deleted = {}

		-- recursively iterate over the last map and check if the file is in the current map (so do NOT use fs.exists)
		local function checkDeleted(map: fileMap, comparisonMap: fileMap)
			for _, child in map.children do
				if type(child) == "string" and table.find(comparisonMap.children, child) == nil then
					table.insert(deleted, child)
				elseif type(child) == "table" then
					local found = false

					for _, comparisonChild in comparisonMap.children do
						if type(comparisonChild) == "table" and comparisonChild.path == child.path then
							found = true
							checkDeleted(child, comparisonChild)
							break
						end
					end

					if not found then
						table.insert(deleted, child.path)
					end
				end
			end
		end

		checkDeleted(lastMap, currentMap)

		if #deleted > 0 then
			onDelete(deleted)
		end

		lastMap = currentMap
		task.wait(1)
	end
end

return function(
	directories: { string } | string,
	callback: (files: { string }) -> any,
	onDelete: (files: { string }) -> any
)
	if type(directories) == "string" then
		directories = { directories }
	end

	for _, directory in directories :: { string } do
		task.spawn(setupWatcher, directory, callback, onDelete)
	end
end
