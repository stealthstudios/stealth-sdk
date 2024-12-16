local engine = {}

local constants = require("./constants")
local wrapper = require("@api/wrapper")

function engine.new(config: EngineConfig): Engine
	local self = {
		url = config.url,
		auth = config.auth,
		characters = config.characters,
		_watchingCharacters = {},
	}

	return setmetatable(self, engine)
end

function engine.start(self: Engine)
	local tagged = workspace:GetTagged(constants.NPC_TAG)

	for _, npc in tagged do
		local character = npc:GetAttribute(constants.NPC_CHARACTER_ATTRIBUTE)

		if not self.characters[character] then
			warn(`{constants.ENGINE_LOG_PREFIX} Character {character} not found in engine config`)
			continue
		end

		self._watchingCharacters[npc] = {
			character = self.characters[character],
			activeConversations = {},
		}
	end
end

type EngineConfig = {
	url: string,
	auth: Secret | string,
	characters: {
		[string]: Character,
	},
}

type Events = {
	onRadiusEnter: (self: Character, player: Player) -> (),
	onRadiusLeave: (self: Character, player: Player) -> (),
	onChatted: (self: Character, player: Player, message: string) -> (),
}

type Character = {
	prompt: string,
	individualInteractions: boolean,
	persistent: boolean,
	interestRadius: number,
	events: Events,
}

type Engine = typeof(setmetatable(
	{} :: {
		url: string,
		auth: Secret | string,
		characters: {
			[string]: Character,
		},
		_watchingCharacters: {
			[Instance]: {
				character: Character,
				activeConversations: { wrapper.Conversation },
			},
		},
	},
	engine
))

return engine
