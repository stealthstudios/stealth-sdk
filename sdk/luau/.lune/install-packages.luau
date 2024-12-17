local fs = require("@lune/fs")

local executeCommand = require("./lib/executeCommand")
local logger = require("./lib/logger").new(4)

local function recursiveCopy(src, dest)
	local files = fs.readDir(src)

	for _, file in files do
		local path = src .. "/" .. file

		if fs.isFile(path) then
			fs.writeDir(dest)
			fs.writeFile(`{dest}/{file}`, fs.readFile(path))
		elseif fs.isDir(path) then
			recursiveCopy(path, `{dest}/{file}`)
		end
	end
end

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

recursiveCopy("src", "temp/src")

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
		warn(
			"Failed to rename package folders (this is generally caused by wally/wally-package-types locking a file in the directory): "
				.. tostring(result)
		)
	end
end

fs.removeDir("temp")
logger:info("Installed packages!")
