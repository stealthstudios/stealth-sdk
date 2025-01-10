local characterModel = {}
characterModel.__index = characterModel

local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")

local communication = require("@src/communication")
local constants = require("@src/constants")
local conversation = require("@server/classes/conversation")

function characterModel.new(model: Model, config: ModelConfig): CharacterModel
	local self = {
		model = model,
		config = config,
		playersInRadius = {},
		conversations = {},
		_chats = {},
	}

	return setmetatable(self, characterModel)
end

function characterModel.update(self: CharacterModel): UpdateState
	local currentPlayers = self.playersInRadius
	local newPlayers = self:getPlayersInRadius(self.config.interestRadius :: number)

	local playerChanges = {
		enter = {},
		leave = {},
	}

	for _, player: Player in newPlayers do
		if not table.find(currentPlayers, player) then
			table.insert(playerChanges.enter, player)
		end
	end

	for _, player: Player in currentPlayers do
		if not table.find(newPlayers, player) then
			table.insert(playerChanges.leave, player)
		end
	end

	return table.freeze({
		playerChanges = playerChanges,
	})
end

function characterModel.apply(self: CharacterModel, state: UpdateState)
	for _, player: Player in state.playerChanges.enter do
		table.insert(self.playersInRadius, player)
	end

	for _, player: Player in state.playerChanges.leave do
		table.remove(self.playersInRadius, table.find(self.playersInRadius, player))
	end
end

function characterModel.getDistanceToPlayer(self: CharacterModel, player: Player): number
	local distance = player:DistanceFromCharacter(self.model:GetPivot().Position)

	if distance == 0 then
		return math.huge -- Character isn't loaded (this number will never be 0 due to floating point precision)
	end

	return distance
end

function characterModel.getPlayersInRadius(self: CharacterModel, radius: number): { Player }
	local players = Players:GetPlayers()
	local playersInRadius = {}

	for _, player: Player in players do
		if self:getDistanceToPlayer(player) <= radius then
			table.insert(playersInRadius, player)
		end
	end

	return playersInRadius
end

function characterModel.isInteractingWithPlayer(self: CharacterModel, player: Player): boolean
	for _, playerInRadius: Player in self.playersInRadius do
		if playerInRadius == player then
			return true
		end
	end

	return false
end

local function sendDataToAllConversationMembers(convo: conversation.Conversation, topic: string, ...: any)
	for _, player: Player in convo:getPlayers() do
		communication.sendToPlayer(player, topic, ...)
	end
end

function characterModel.createChat(self: CharacterModel, chatConversation: conversation.Conversation): string
	-- check if this conversation is from this model
	local conversationFromModel = false

	for _, modelConversation: conversation.Conversation in self.conversations do
		if modelConversation == chatConversation then
			conversationFromModel = true
			break
		end
	end

	if not conversationFromModel then
		error(`{constants.ENGINE_LOG_PREFIX} Conversation {chatConversation.id} is not from this model!`)
	end

	local chatId = HttpService:GenerateGUID(false)
	self._chats[chatId] = chatConversation

	sendDataToAllConversationMembers(chatConversation, "chatStarted", {
		chatId = chatId,
		model = self.model,
	})

	return chatId
end

function characterModel.provideActionFeedback(
	self: CharacterModel,
	chatId: string,
	feedback: {
		success: boolean,
		message: string?,
	}
)
	if not self._chats[chatId] then
		return
	end

	sendDataToAllConversationMembers(self._chats[chatId], "actionFeedback", chatId, feedback)
	self:cleanChat(chatId)
end

function characterModel.cancelChat(self: CharacterModel, chatId: string)
	if not self._chats[chatId] then
		return
	end

	sendDataToAllConversationMembers(self._chats[chatId], "chatCancelled", chatId)
	self:cleanChat(chatId)
end

function characterModel.flagChat(self: CharacterModel, chatId: string)
	if not self._chats[chatId] then
		return
	end

	sendDataToAllConversationMembers(self._chats[chatId], "chatFlagged", chatId)
	self:cleanChat(chatId)
end

function characterModel.setChatContent(self: CharacterModel, chatId: string, player: Player, content: string)
	if not self._chats[chatId] then
		return
	end

	communication.sendToPlayer(player, "chatContentReceived", chatId, content)
end

function characterModel.cleanChat(self: CharacterModel, chatId: string)
	if not self._chats[chatId] then
		return
	end

	self._chats[chatId] = nil
end

function characterModel.cancelChats(self: CharacterModel, target: conversation.Conversation)
	for chatId, chatConversation: conversation.Conversation in self._chats do
		if chatConversation == target then
			self:cancelChat(chatId)
		end
	end
end

function characterModel.cancelChatsForPlayer(self: CharacterModel, player: Player, target: conversation.Conversation)
	for chatId, chatConversation: conversation.Conversation in self._chats do
		if chatConversation == target then
			-- send cancel payload to only that player
			communication.sendToPlayer(player, "chatCancelled", chatId)
		end
	end
end

type UpdateState = {
	playerChanges: {
		enter: { Player },
		leave: { Player },
	},
}

export type ModelConfig = {
	interestRadius: number?,
	[string]: nil,
}

export type CharacterModel = typeof(setmetatable(
	{} :: {
		model: Model,
		config: ModelConfig,
		playersInRadius: { Player },
		conversations: { conversation.Conversation },
		_chats: { [string]: conversation.Conversation },
	},
	characterModel
))

return characterModel
