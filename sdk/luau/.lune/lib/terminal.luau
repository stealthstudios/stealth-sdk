-- A collection of utility functions for manipulating the terminal
local terminal = {}

local isVerbose = false

local lineStateData = (_G._terminalLineStateData or {
	currentLine = 0,
	lineMax = 0,
	lineLengthData = {},
}) :: {
	currentLine: number,
	lineMax: number,
	lineLengthData: { number },
}

local stdio = require("@lune/stdio")

local function getLineCount(str)
	local lines = 0
	for i = 1, #str do
		local c = str:sub(i, i)
		if c == "\n" then
			lines = lines + 1
		end
	end

	return lines
end

local function moveCurrentLine(n)
	lineStateData.currentLine += n
	lineStateData.lineMax = math.max(lineStateData.lineMax, lineStateData.currentLine)
end

function terminal.moveLine(n: number)
	if n == 0 then
		return
	end

	moveCurrentLine(n)

	if n > 0 then
		stdio.write("\27[" .. n .. "E")
	else
		stdio.write("\27[" .. -n .. "F")
	end
end

function terminal.moveLineWrite(n: number, str: string)
	terminal.moveLine(n)
	stdio.write(str)
end

function terminal.save(): number
	return lineStateData.currentLine
end

function terminal.moveToLine(targetLine: number)
	terminal.moveLine(targetLine - lineStateData.currentLine)
	lineStateData.currentLine = targetLine
end

function terminal.write(str: string)
	if false then
		return
	end

	-- count amount of newlines, add to linememory
	if lineStateData.lineLengthData[lineStateData.currentLine] then
		str = terminal.pad(str, lineStateData.lineLengthData[lineStateData.currentLine])
	end

	lineStateData.lineLengthData[lineStateData.currentLine] = #str
	moveCurrentLine(getLineCount(str) + 1)

	-- pad out string to PADDING_LENGTH
	stdio.write(str .. "\n")
end

function terminal.writeVerbose(str)
	if not isVerbose then
		return
	end

	terminal.write(str)
end

function terminal.verbose(verbose: boolean)
	isVerbose = verbose
end

function terminal.reset()
	terminal.moveToLine(lineStateData.lineMax)
end

function terminal.pad(str, len)
	return str .. (" "):rep(len - #str)
end

return terminal
