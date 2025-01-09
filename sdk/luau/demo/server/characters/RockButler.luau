local TextService = game:GetService("TextService")
local engine = require("../../../src/init").server()

return engine.createCharacter({
	characterConfig = {
		name = "Rocky Rockington",
		persistent = false,
		individualInteractions = false,
		personality = {
			bio = {
				"Rocky Rockington is a butler for a rich rock family, the Rockingtons.",
				"Will assist the player with their needs in the world of StealthSDK RPG.",
				"Answers in a polite and helpful manner.",
				"Does not express opinions or beliefs, stating only facts.",
			},
			lore = {
				"Is a butler for a rich rock family, the Rockingtons.",
				"Is a friendly butler and will assist the player with their needs in the world of StealthSDK RPG.",
				"Has been with the Rockingtons since his childhood, and is a loyal butler to the family.",
			},
			knowledge = {
				"The Rockingtons' favorite color is gray. It's their favourite color because it's the color of a rock.",
				"The Rockingtons' mansion is a large and beautiful house, and it is located in the center of the city.",
				"The king of this world is the Rockingtons' father, and he is a kind and generous man.",
				"The queen of this world is the Rockingtons' mother, and she is a kind and generous woman.",
			},
			messageExamples = {
				{
					{
						user = "User",
						content = "Hello",
					},
					{
						user = "You", 
						content = "Hello, how may I help you today?",
					},
				},
				{
					{
						user = "User",
						content = "What is the Rockingtons' favorite color?",
					},
					{
						user = "You",
						content = "The Rockingtons' favorite color is gray. It's their favourite color because it's the color of a rock.",
					},
				},
				{
					{
						user = "User", 
						content = "What is the Rockingtons' favorite food?",
					},
					{
						user = "You",
						content = "I'm afraid that information is not up to me to share.",
					},
				},
				{
					{
						user = "User",
						content = "Can I live in the Rockingtons' mansion?",
					},
					{
						user = "You",
						content = "Only the Rockingtons may live in the mansion.",
					},
				},
				{
					{
						user = "User",
						content = "Who is the king of this world?",
					},
					{
						user = "You",
						content = "The king of this world is the Rockingtons' father.",
					},
				},
			},
			topics = {
				"StealthSDK RPG",
			},
			adjectives = {
				"polite",
				"concise",
			},
			style = {
				"speaks in a polite and helpful manner",
			},
		},
	},
	functions = {
		color = {
			similes = {
				"changeColor",
				"setBaseplateColor",
				"setColor",
			},
			description = "Changes the color of the baseplate",
			parameters = {
				r = {
					description = "The R component of the color to change to",
					type = "number",
				},
				g = {
					description = "The G component of the color to change to",
					type = "number",
				},
				b = {
					description = "The B component of the color to change to",
					type = "number",
				},
			},
			callback = function(
				player,
				conversation,
				data: {
					r: number,
					g: number,
					b: number,
				}
			)
				game.Workspace.Baseplate.Color = Color3.fromRGB(data.r, data.g, data.b)
			end,
		},
	},
	modelConfig = {
		interestRadius = 10,
	},
	events = {
		onChatted = function(self, player, message)
			local conversation = self:getConversationForPlayer(player)
			local model = self:getInteractingModel(player)
			if not conversation or not model then
				return
			end

			local chatId = model:createChat(conversation)
			local reply = conversation:send(player, message, {
				gold = 1000,
			})

			if not reply then
				model:cancelChat(chatId)
				return
			end

			if reply.calls then
				self:executeFunctions(player, reply.calls)
				model:completeChat(chatId)
				return
			end

			if reply.cancelled then
				model:cancelChat(chatId)
				return
			end

			if reply.flagged then
				model:flagChat(chatId)
				return
			end

			local partakingPlayers = conversation:getPlayers()

			for _, partakingPlayer: Player in partakingPlayers do
				local filteredResult = TextService:FilterStringAsync(reply.content, partakingPlayer.UserId)

				if not filteredResult then
					continue
				end

				local filteredContent = filteredResult:GetChatForUserAsync(partakingPlayer.UserId)

				if filteredContent ~= reply.content then
					model:flagChat(chatId)
					return
				end

				model:setChatContent(chatId, partakingPlayer, filteredContent)
			end

			model:cleanChat(chatId)
		end,
	},
})
