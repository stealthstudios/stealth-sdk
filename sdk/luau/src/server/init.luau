local engine = {}
engine.__index = engine

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

local constants = require("@src/constants")
local modelCharacter = require("@server/classes/character")
local wrapper = require("@server/wrapper")

local DEFAULT_CHARACTER_CONFIG = require("@server/defaultCharacterConfig")

local activeEngines: { [string]: Engine } = {}

local function deepCopy<T>(t: T): T
	local newTable = {}

	for key, value in t :: any do
		if type(value) == "table" then
			newTable[key] = deepCopy(value)
		else
			newTable[key] = value
		end
	end

	return (newTable :: any) :: T
end

local function mergeConfigs<T>(t1: T, t2: T): T
	local newTable = deepCopy(t1)

	for key, value in t2 :: any do
		if type(value) == "table" and key ~= "personality" then
			if not newTable[key] then
				newTable[key] = {}
			end

			newTable[key] = mergeConfigs(newTable[key], value)
		else
			newTable[key] = value
		end
	end

	return (newTable :: any) :: T
end

function engine.new(config: EngineConfig): Engine
	wrapper.init({
		url = config.url,
		auth = config.auth,
	})

	local self = setmetatable({
		characters = {},
		defaultCharacterConfig = DEFAULT_CHARACTER_CONFIG,
		_updating = false,
	}, engine) :: Engine

	activeEngines[config.url] = self

	return self
end

function engine.registerCharacter(self: Engine, character: modelCharacter.Character): nil
	local mergedConfig = mergeConfigs(self.defaultCharacterConfig, character._fullConfig)
	character.events = mergedConfig.events :: any
	character.config = mergedConfig.characterConfig
	character._fullConfig = mergedConfig

	if character.config.persistent and not character.config.individualInteractions then
		error(
			`{constants.ENGINE_LOG_PREFIX} Character {character.config.name} is persistent but does not have individual interactions enabled.`
		)
	end

	if not character.config.name then
		warn(`{constants.ENGINE_LOG_PREFIX} Character name is required`)
		return nil
	end

	self.characters[character.config.name] = character

	return nil
end

engine.createCharacter = modelCharacter.new

function engine.setDefaultCharacterConfig(self: Engine, config: modelCharacter.Config): nil
	self.defaultCharacterConfig = config
	return nil
end

function engine.loadFolder(self: Engine, folder: Instance): nil
	for _, characterModule in folder:GetChildren() do
		if not characterModule:IsA("ModuleScript") then
			continue
		end

		local character = require(characterModule) :: modelCharacter.Character
		self:registerCharacter(character)
	end

	return nil
end

function engine.start(self: Engine): nil
	if self._updating then
		return nil
	end

	self._updating = true
	return nil
end

function engine.update(self: Engine): nil
	if not self._updating then
		return nil
	end

	for _, character in self.characters do
		character:update()
	end

	return nil
end

local function engineChat(self: Engine, player: Player, message: string): nil
	for _, character: modelCharacter.Character in self.characters do
		local conversation = character:getConversationForPlayer(player, false)
		if conversation then
			character:_chat(player, message)
		end
	end

	return nil
end

local function handlePlayerChatted(player: Player)
	player.Chatted:Connect(function(message)
		for _, activeEngine in activeEngines do
			engineChat(activeEngine, player, message)
		end
	end)
end

local function handlePlayerRemoving(player: Player)
	for _, activeEngine in activeEngines do
		for _, character in activeEngine.characters do
			local conversation = character:getConversationForPlayer(player, false)
			if conversation then
				conversation:removePlayer(player)
			end
		end
	end
end

local function handleGameClose()
	for _, activeEngine in activeEngines do
		activeEngine._updating = false

		for _, character in activeEngine.characters do
			for _, model in character.models do
				for _, conversation in model.conversations do
					if character.config.persistent then
						continue
					end

					if conversation:isEmpty() and character.events.onConversationEmpty then
						character.events.onConversationEmpty(character, conversation)
					end

					character:finishConversation(conversation)
				end
			end
		end
	end
end

local function initializeHeartbeat()
	local lastUpdate = 0
	RunService.Heartbeat:Connect(function(dt)
		lastUpdate += dt

		if lastUpdate < constants.UPDATE_INTERVAL then
			return
		end

		lastUpdate = 0

		for _, activeEngine in activeEngines do
			activeEngine:update()
		end
	end)
end

for _, player in Players:GetPlayers() do
	handlePlayerChatted(player)
end

Players.PlayerAdded:Connect(handlePlayerChatted)
Players.PlayerRemoving:Connect(handlePlayerRemoving)
game:BindToClose(handleGameClose)
initializeHeartbeat()

type EngineConfig = {
	url: string,
	auth: Secret | string,
}

type Engine = typeof(setmetatable(
	{} :: {
		defaultCharacterConfig: modelCharacter.Config,
		characters: { [string]: modelCharacter.Character },
		_updating: boolean,
	},
	engine
))

return engine
