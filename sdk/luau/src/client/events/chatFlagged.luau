local chatBubbleManager = require("@client/chatBubbleManager")
local constants = require("@src/constants")

return function(chatId: string)
	local managedGui = chatBubbleManager.get(chatId)

	if not managedGui or not managedGui.chat.active then
		return
	end

	managedGui.chat.status:set("flagged")
	managedGui.chat.active = false

	task.delay(constants.MESSAGE_SHOW_TIME, function()
		chatBubbleManager.remove(chatId)
	end)
end
