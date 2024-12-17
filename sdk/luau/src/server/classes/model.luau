local Chat = game:GetService("Chat")
local Players = game:GetService("Players")

local constants = require("@src/constants")
local conversation = require("@server/classes/conversation")

local characterModel = {}
characterModel.__index = characterModel

function characterModel.new(model: Model, config: ModelConfig): CharacterModel
	local self = {
		model = model,
		config = config,
		playersInRadius = {},
		conversations = {},
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

	for _, player in newPlayers do
		if not table.find(currentPlayers, player) then
			table.insert(playerChanges.enter, player)
		end
	end

	for _, player in currentPlayers do
		if not table.find(newPlayers, player) then
			table.insert(playerChanges.leave, player)
		end
	end

	return table.freeze({
		playerChanges = playerChanges,
	})
end

function characterModel.apply(self: CharacterModel, state: UpdateState)
	for _, player in state.playerChanges.enter do
		table.insert(self.playersInRadius, player)
	end

	for _, player in state.playerChanges.leave do
		table.remove(self.playersInRadius, table.find(self.playersInRadius, player))
	end
end

function characterModel.getDistanceToPlayer(self: CharacterModel, player: Player): number
	local distance = player:DistanceFromCharacter(self.model:GetPivot().Position)

	if distance == 0 then
		-- character isn't loaded (this number will *never* be 0 due to floating point precision)
		return math.huge
	end

	return distance
end

function characterModel.getPlayersInRadius(self: CharacterModel, radius: number): { Player }
	local players = Players:GetPlayers()
	local playersInRadius = {}

	for _, player in players do
		if self:getDistanceToPlayer(player) <= radius then
			table.insert(playersInRadius, player)
		end
	end

	return playersInRadius
end

function characterModel.isInteractingWithPlayer(self: CharacterModel, player: Player): boolean
	for _, playerInRadius in self.playersInRadius do
		if playerInRadius == player then
			return true
		end
	end

	return false
end

function characterModel.say(self: CharacterModel, message: string): nil
	local success, rootPart = pcall(function()
		return self.model.PrimaryPart
	end)

	if not success then
		warn(`{constants.ENGINE_LOG_PREFIX} Model has no root part!`)
		return nil
	end

	Chat:Chat(rootPart, message)
	return nil
end

type UpdateState = {
	playerChanges: {
		enter: { Player },
		leave: { Player },
	},
}

export type ModelConfig = {
	interestRadius: number?,
	requiresLineOfSight: boolean?,
	[string]: nil,
}

export type CharacterModel = typeof(setmetatable(
	{} :: {
		model: Model,
		config: ModelConfig,
		playersInRadius: { Player },
		conversations: { conversation.Conversation },
	},
	characterModel
))

return characterModel
