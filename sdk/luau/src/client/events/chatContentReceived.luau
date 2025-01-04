local TextChatService = game:GetService("TextChatService")

local chatBubbleManager = require("@client/chatBubbleManager")
local constants = require("@src/constants")

return function(chatId: string, content: string)
	local managedGui = chatBubbleManager.get(chatId)

	if not managedGui or not managedGui.chat.active then
		return
	end

	managedGui.chat.content:set(content)
	managedGui.chat.status:set("received")

	task.delay(constants.MESSAGE_SHOW_TIME, function()
		chatBubbleManager.remove(chatId)
	end)

	local model = managedGui.managedGui.model

	if model:GetAttribute("ShowMessagesInChat") then
		local chatChannelName = model:GetAttribute("ChatChannelName")

		if not chatChannelName then
			warn(
				"ChatChannelName not found on a model that has ShowMessagesInChat enabled. Messages will not be shown in chat."
			)
			return
		end

		local messageMarkup = model:GetAttribute("MessageMarkup") or "%s"
		local nameMarkup = model:GetAttribute("NameMarkup") or "%s: "

		local modelName = model:GetAttribute("Character")

		local channel = TextChatService.TextChannels:FindFirstChild(chatChannelName)
		channel:DisplaySystemMessage(string.format(nameMarkup, modelName) .. string.format(messageMarkup, content))
	end
end
