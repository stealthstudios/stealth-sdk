local client = {}
client.__index = client

local communication = require("@src/communication")
local constants = require("@src/constants")

local events = {}

for _, event in script.events:GetChildren() do
	events[event.Name] = require(event)
end

communication.receive(function(topic: string, ...: any)
	local event = events[topic]
	if not event then
		warn(`{constants.ENGINE_LOG_PREFIX} Event "{topic}" not found`)
		return
	end

	event(...)
end)

return client
