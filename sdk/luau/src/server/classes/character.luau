local character = {}
character.__index = character

local CollectionService = game:GetService("CollectionService")

local characterModel = require("@server/classes/model")
local constants = require("@src/constants")
local conversation = require("@server/classes/conversation")
local rateLimit = require("@packages/ratelimit")(1, 2) -- 1 call per 2 seconds
local wrapper = require("@server/wrapper")

function character.new(config: Config)
	if not config.characterConfig or not config.characterConfig.name then
		error(`{constants.ENGINE_LOG_PREFIX} Character config is missing name`)
	end

	local self = {
		config = config.characterConfig,
		_fullConfig = config,
		events = config.events,
		functions = config.functions,
		models = {},
	}

	for _, instance in CollectionService:GetTagged(constants.NPC_TAG) do
		if instance:GetAttribute(constants.NPC_CHARACTER_ATTRIBUTE) == config.characterConfig.name then
			self.models[instance] = characterModel.new(instance, config.modelConfig :: characterModel.ModelConfig)
		end
	end

	return setmetatable(self, character) :: Character
end

function character.update(self: Character)
	for _, model: characterModel.CharacterModel in self.models do
		local state = model:update()

		if state.playerChanges.leave then
			for _, player in state.playerChanges.leave do
				if self.events.onRadiusLeft then
					local playerConversation = self:getConversationForPlayer(player)

					if not playerConversation then
						continue
					end

					-- we don't wrap this in spawn to prevent a race condition
					self.events.onRadiusLeft(self, player, playerConversation)

					if not table.find(playerConversation.partakingPlayers, player) then
						model:cancelChatsForPlayer(player, playerConversation)
					end
				end
			end
		end

		for _, modelConversation in model.conversations do
			if modelConversation:isEmpty() and self.events.onConversationEmpty then
				task.spawn(function()
					self.events.onConversationEmpty(self, modelConversation)
				end)
			end
		end

		model:apply(state)

		if state.playerChanges.enter then
			for _, player in state.playerChanges.enter do
				if self.events.onRadiusEnter then
					task.spawn(function()
						self.events.onRadiusEnter(self, player)
					end)
				end
			end
		end
	end
end

function character._chat(self: Character, player: Player, message: string)
	if not rateLimit(player) then
		return
	end

	local playerConversation = self:getConversationForPlayer(player)
	if playerConversation and self.events.onChatted then
		task.spawn(function()
			self.events.onChatted(self, player, message)
		end)
	end
end

function character.executeFunctions(
	self: Character,
	player: Player,
	functions: {
		{
			name: string,
			parameters: {
				[string]: number | string | boolean,
			},
		}
	}
)
	for _, func in functions do
		local foundFunction = self.functions[func.name]

		if foundFunction then
			foundFunction.callback(player, self:getConversationForPlayer(player), func.parameters)
		end
	end
end

function character.getInteractingModel(self: Character, player: Player): characterModel.CharacterModel?
	for _, model: characterModel.CharacterModel in self.models do
		if model:isInteractingWithPlayer(player) then
			return model
		end
	end
	return nil
end

function character.getConversationForPlayer(
	self: Character,
	player: Player,
	createNew: boolean?
): conversation.Conversation?
	for _, model: characterModel.CharacterModel in self.models do
		if model:isInteractingWithPlayer(player) then
			for _, modelConversation in model.conversations do
				if modelConversation:containsPlayer(player) then
					return modelConversation
				end
			end
		end
	end

	if not createNew then
		return nil
	end

	for _, model: characterModel.CharacterModel in self.models do
		if model:isInteractingWithPlayer(player) then
			if self.config.individualInteractions then
				return self:createConversation(model, player)
			end

			local firstConversation = model.conversations[1] or self:createConversation(model, nil :: any)
			if firstConversation then
				firstConversation:addPlayer(player)
				return firstConversation
			end
		end
	end

	return nil
end

function character.createConversation(
	self: Character,
	model: characterModel.CharacterModel,
	player: Player?
): conversation.Conversation?
	local persistenceToken
	if self.config.persistent and player then
		persistenceToken = `{game.GameId}-{self.config.name}-{player.UserId}`
	end

	local personality = table.clone(self.config.personality)
	personality.name = self.config.name

	local createdConversation = wrapper.create({
		personality = personality,
		functions = self.functions :: any, -- this is just pure laziness - i'll revisit this sometime
	}, player and { player } or {}, persistenceToken)
	if not createdConversation then
		return nil
	end

	local conversationObject = conversation.new(createdConversation.id, createdConversation.secret)
	conversationObject.partakingPlayers = { player }
	table.insert(model.conversations, conversationObject)

	if self.events.onConversationStart then
		task.spawn(function()
			self.events.onConversationStart(self, conversationObject)
		end)
	end

	return conversationObject
end

function character.finishConversation(self: Character, target: conversation.Conversation, yieldCallback: boolean?)
	local containingModel

	for _, model: characterModel.CharacterModel in self.models do
		local index = table.find(model.conversations, target)

		if index then
			containingModel = model
			table.remove(model.conversations, index)
		end
	end

	if yieldCallback then
		task.spawn(function()
			if self.events.onConversationFinish then
				self.events.onConversationFinish(self, target)
			end

			containingModel:cancelChats(target)

			target:finish()
		end)
	else
		if self.events.onConversationFinish then
			self.events.onConversationFinish(self, target)
		end

		containingModel:cancelChats(target)

		target:finish()
	end
end

type Events = {
	onRadiusEnter: ((self: Character, player: Player) -> ())?,
	onRadiusLeft: ((self: Character, player: Player, conversation: conversation.Conversation?) -> ())?,
	onChatted: ((self: Character, player: Player, message: string) -> ())?,
	onConversationStart: ((self: Character, conversation: conversation.Conversation) -> ())?,
	onConversationFinish: ((self: Character, conversation: conversation.Conversation) -> ())?,
	onConversationEmpty: ((self: Character, conversation: conversation.Conversation) -> ())?,
}

type Function = {
	callback: (player: Player, conversation: conversation.Conversation, data: { [string]: any }) -> (),
	description: string?,
	parameters: {
		{
			name: string,
			description: string,
			type: "string" | "number" | "boolean",
		}
	},
}

type CharacterConfig = {
	name: string?,
	individualInteractions: boolean?,
	persistent: boolean?,
	personality: wrapper.Personality?,
}

export type Config = {
	characterConfig: CharacterConfig,
	modelConfig: characterModel.ModelConfig?,
	events: Events?,
	functions: { Function }?,
}

export type Character = typeof(setmetatable(
	{} :: {
		events: Events,
		functions: { [string]: Function },
		config: CharacterConfig,
		_fullConfig: Config,
		models: { [Model]: characterModel.CharacterModel },
	},
	character
))

return character
