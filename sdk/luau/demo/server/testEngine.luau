local engine = require("@src/init")
local client = engine.new({
	url = _G.API_URL,
	auth = _G.API_KEY,
	characters = {
		["RockButler"] = {
			prompt = "You are a rock butler. Answer questions about yourself and have a chat with the player. Make sure to act posh and act like a butler, but also be friendly and fun.",
			individualInteractions = false,
			persistent = false,
			interestRadius = 10,
		},
	},
})

-- Start watching NPCs that have a character we know for nearby chats
client.start()
