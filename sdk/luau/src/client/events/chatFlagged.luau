local chatBubbleManager = require("@client/chatBubbleManager")
local constants = require("@src/constants")

return function(chatId: string)
	local managedGui = chatBubbleManager.get(chatId)

	if not managedGui then
		return
	end

	managedGui.chat.status:set("flagged")

	task.delay(constants.MESSAGE_SHOW_TIME, function()
		chatBubbleManager.remove(chatId)
	end)
end
