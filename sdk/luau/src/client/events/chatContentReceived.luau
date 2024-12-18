local chatBubbleManager = require("@client/chatBubbleManager")
local constants = require("@src/constants")
return function(chatId: string, content: string)
	local managedGui = chatBubbleManager.get(chatId)

	if not managedGui then
		return
	end

	managedGui.chat.content:set(content)
	managedGui.chat.status:set("received")

	task.delay(constants.MESSAGE_SHOW_TIME, function()
		chatBubbleManager.remove(chatId)
	end)
end
