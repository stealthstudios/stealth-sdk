local fs = require("@lune/fs")

local logger = require("./lib/logger").new(4)
local executeCommand = require("./lib/executeCommand")

if fs.isDir("packages") then
	fs.removeDir("packages")
end

local status = executeCommand("wally", {
	"install",
}, {
	stdio = "inherit",
}, true)

if not status.ok then
	logger:error("Failed to install packages!")
	return
end

if not fs.isDir("packages") then
	fs.writeDir("packages")
end

-- do this so the project file doesn't refer to files that don't exist and cause rojo to fail
if fs.isFile("src/server/network.zap") then
	executeCommand("zap", { "src/server/network.zap" })
end

executeCommand("rojo", {
	"sourcemap",
	fs.isFile("sourcemap.project.json") and "sourcemap.project.json" or "default.project.json",
	"-o",
	"sourcemap.json",
})

if fs.isDir("Packages") then
	local packageTypeStatus = executeCommand("wally-package-types", {
		"--sourcemap",
		"sourcemap.json",
		"./Packages",
	}, nil, true)

	if packageTypeStatus.ok then
		logger:info("Successfully generated package types!")
	else
		logger:error("Failed to generate package types!")
	end 

    local success, result = pcall(function()
        if fs.isDir("./Packages") then
            fs.move("./Packages", "./packages", true)
        end
        
        if fs.isDir("./ServerPackages") then
            fs.move("./ServerPackages", "./ServerPackages", true)
        end
    end)

    if not success then
        warn("Failed to rename package folders (this is generally caused by wally/wally-package-types locking a file in the directory): " .. tostring(result))
    end
end

logger:info("Installed packages!")
