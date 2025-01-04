local fusion = require("@packages/fusion")
local peek = fusion.peek

local chatBubbleManager = require("@client/chatBubbleManager")

return function(data: {
	chatId: string,
	model: Model,
})
	local managedGui = chatBubbleManager.new(data.chatId, data.model)
	local chats = managedGui.chats

	local newChat = {
		id = data.chatId,
		status = managedGui.scope:Value("started"),
		content = managedGui.scope:Value(nil),
		isOpen = managedGui.scope:Value(false),
		active = true,
	}

	local mappedId = chatBubbleManager.get(data.chatId)
	mappedId.chat = newChat

	local newChats = peek(chats)
	managedGui.chatIndex += 1
	newChats[managedGui.chatIndex] = newChat
	chats:set(newChats)
end
