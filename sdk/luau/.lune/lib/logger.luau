local logger = {}

local terminal = require("./terminal")
local chalk = require("./chalk")
local dateTime = require("@lune/datetime")

local function padToTwo(number: number): string
	return number < 10 and `0{number}` or tostring(number)
end

local function generateTimestamp(): string
	local time = dateTime.now():toLocalTime()
	return chalk.dim(`[{padToTwo(time.hour)}:{padToTwo(time.minute)}:{padToTwo(time.second)}]`)
end

local logger_templates = {
	info = chalk.green("INFO"),
	warn = chalk.yellow("WARN"),
	error = chalk.red("ERROR"),
	success = chalk.green("SUCCESS"),
	debug = chalk.magenta("DEBUG"),
}

-- Types
export type logger = typeof(setmetatable(
	{} :: {
		logLevel: number,
	},
	{ __index = logger }
))

function logger.new(logLevel: number): logger
	return setmetatable({
		logLevel = logLevel,
	}, { __index = logger })
end

function logger:error(message: string, ...: string)
	local formattedMessage = string.format(message, ...)

	if self.logLevel >= 1 then
		terminal.write(`{generateTimestamp()} {logger_templates.error} {chalk.white(formattedMessage)}`)
	end
end

function logger:warn(message: string, ...: string)
	local formattedMessage = string.format(message, ...)

	if self.logLevel >= 2 then
		terminal.write(`{generateTimestamp()} {logger_templates.warn} {chalk.white(formattedMessage)}`)
	end
end

function logger:info(message: string, ...: string)
	local formattedMessage = string.format(message, ...)

	if self.logLevel >= 3 then
		terminal.write(`{generateTimestamp()} {logger_templates.info} {chalk.white(formattedMessage)}`)
	end
end

function logger:success(message: string, ...: string)
	local formattedMessage = string.format(message, ...)

	if self.logLevel >= 3 then
		terminal.write(`{generateTimestamp()} {logger_templates.success} {chalk.white(formattedMessage)}`)
	end
end

function logger:debug(message: string, ...: string)
	local formattedMessage = string.format(message, ...)

	if self.logLevel >= 4 then
		terminal.write(`{generateTimestamp()} {logger_templates.debug} {chalk.white(formattedMessage)}`)
	end
end

return logger
