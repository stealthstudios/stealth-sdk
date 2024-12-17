local engine = require("../../src/init").server()
local client = engine.new({
	url = _G.API_URL,
	auth = _G.API_KEY,
})

client:loadFolder(script.Parent.characters)
client:start()
