local chatBubbleManager = require("@client/chatBubbleManager")
local constants = require("@src/constants")

return function(
	chatId: string,
	feedback: {
		success: boolean,
		message: string?,
	}
)
	local managedGui = chatBubbleManager.get(chatId)

	if not managedGui or not managedGui.chat.active then
		return
	end

	managedGui.chat.status:set(`{feedback.success and "actionSuccess" or "actionFailure"}`)
	managedGui.chat.content:set(`{feedback.success and "✅" or "❌"} {feedback.message}`)
	managedGui.chat.active = false

	task.delay(constants.MESSAGE_SHOW_TIME, function()
		chatBubbleManager.remove(chatId)
	end)
end
