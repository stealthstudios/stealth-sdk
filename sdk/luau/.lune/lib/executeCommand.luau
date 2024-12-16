local process = require("@lune/process")

local logger = require("./logger").new(4)

return function(command, args, options, ignoreErrors)
	local data = process.spawn(command, args, options or {
		stdio = "default",
	})

	if data.stderr ~= "" and not ignoreErrors then
		logger:error(`Error occurred when running \"{command}\" (code {data.code}): \n{data.stderr}`)
	end

	return data
end