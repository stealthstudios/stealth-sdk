local fs = require("@lune/fs")
local task = require("@lune/task")
local process = require("@lune/process")

local logger = require("./lib/logger").new(4)
local fileWatcher = require("./lib/fileWatcher")
local executeCommand = require("./lib/executeCommand")

if not fs.isFile("env.luau") then
	logger:error("No .env.luau file found, please create one.")
	return
end

local env: { API_URL: string, API_KEY: string } = require("../env.luau")
process.env.API_URL = env.API_URL
process.env.API_KEY = env.API_KEY

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

local hasDarkLua = fs.isFile(".darklua.json")

local function processFiles()
	if fs.isFile(".darklua.json") then
		recursiveCopy("src", "temp/src")

		executeCommand("rojo", { "sourcemap", "sourcemap.project.json", "-o", "sourcemap.json" }, {
			stdio = "inherit",
		}, true)

		local status = executeCommand("darklua", { "process", "temp", "temp", "-c", ".darklua.dev.json" }, {
			stdio = "inherit",
		}, true)

		if status.code == 0 then
			recursiveCopy("temp/src", "dist/src")
		end

		-- We don't allow processing steps for demo - it has weird rojo sourcemap things so we have to do it like this
		recursiveCopy("demo", "dist/demo")

		executeCommand("rojo", { "sourcemap", "dev.project.json", "-o", "sourcemap.json" }, {
			stdio = "inherit",
		}, true)

		executeCommand("darklua", { "process", "dist/demo", "dist/demo", "-c", ".darklua.dev.json" }, {
			stdio = "inherit",
		}, true)

		fs.removeDir("temp")
	end
end

processFiles()

logger:success("Watching for file changes..")

task.spawn(fileWatcher, { "./src", "./demo" }, function(files)
	logger:info(`Detected changes in {#files} file(s)..`)

	local success, err = pcall(function()
		processFiles()
	end)

	if not success then
		logger:error(`Failed to process files: {err}`)
	end
end, function(files)
	if not hasDarkLua then
		return
	end

	for _, file in files do
		logger:info(`{file} deleted, removing from build..`)

		-- get the second part of the file path
		local secondPart = file:match("^./([^/]+)")

		file = file:gsub(`./{secondPart}/`, "")

		if fs.isFile(`dist/{secondPart}/{file}`) then
			fs.removeFile(`dist/{secondPart}/{file}`)
		elseif fs.isDir(`dist/{secondPart}/{file}`) then
			fs.removeDir(`dist/{secondPart}/{file}`)
		end
	end

	processFiles()
end)

executeCommand("rojo", { "serve", "dev.project.json" }, {
	stdio = "inherit",
})
