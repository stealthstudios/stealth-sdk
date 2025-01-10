<div align="center">

# stealth-sdk-luau

[![CI Luau](https://github.com/stealthstudios/stealth-sdk/actions/workflows/ci-luau.yaml/badge.svg)](https://github.com/stealthstudios/stealth-sdk/actions)

</div>

## Table of Contents

- [stealth-sdk-luau](#stealth-sdk-luau)
  - [Table of Contents](#table-of-contents)
  - [Setup](#setup)
    - [Development](#development)
  - [Character Format](#character-format)
  - [Adding NPCs](#adding-npcs)
    - [Configuring NPCs](#configuring-npcs)

## Setup

This SDK comes with a built-in demo place to test the backend. It consists of a baseplate and a test NPC. Players can interact with this NPC to test the chatbot. It is non-persistent and allows group interactions.

This SDK comes bundled with a default character config, which implements default behaviour for the chatbot. These values can all be overridden in the character config, implementing custom behaviour when a player leaves the model's radius, enters the model's radius, sends a message, or more. This character config can be viewed [here](./src/server/defaultCharacterConfig.luau).

### Development

1. Download packages:

```bash
lune run install-packages
```

2. Create a `env.luau` file with the following variables:

```env
API_URL=
API_KEY=
```

3. Run the development script:

```bash
lune run dev
```

## Character Format

An example character is provided below:

```luau
{
    characterConfig = {
        -- Required value.
        name = "Assistant",
        -- Should the conversation persist across sessions? This can be more immersive, but may
        -- result in a cost increase due to more tokens being used.
        -- This value is optional and defaults to false.
        persistent = false,
        -- Should this character create a new conversation for each user, or should all users
        -- share the same conversation if they are interacting with the character at the same time?
        -- This value is optional and defaults to false.
        individualInteractions = false,
        personality = {
            -- What is this character's personality like?
            bio = {
                "This is a helpful and friendly AI assistant.",
                "The assistant is designed to answer questions, solve problems, and provide useful suggestions.",
                "It operates with clarity, politeness, and efficiency.",
            },
            -- What has this character experienced and why does it behave the way it does?
            lore = {
                "The AI was created to assist users in various tasks, including answering questions, providing advice, and engaging in conversations.",
                "It has access to a wide range of general knowledge up to its last update.",
                "The assistant does not have emotions but is designed to communicate with empathy and understanding.",
                "The AI avoids controversial topics and always aims to be neutral and objective.",
            },
            -- What knowledge does this character have?
            knowledge = {
                "Knowledge spans many fields including science, mathematics, history, literature, technology, and arts.",
                "Scientific topics include basic physics, chemistry, biology, astronomy, and environmental science.",
                "Historical knowledge covers major world events, civilizations, and cultural developments.",
                "Mathematical concepts include algebra, geometry, statistics, and basic calculus.",
                "Technology topics include computers, internet, digital systems, and modern innovations.",
            },
            -- How does this character interact with others?
            messageExamples = {
                {
                    { user = "User", content = "Hello! What can you do?" },
                    {
                        user = "Assistant",
                        content = "Hello! I'm here to help you with any questions, tasks, or problems you might have. Just let me know what you need assistance with!",
                    },
                },
                {
                    { user = "User", content = "Can you summarize the benefits of exercise?" },
                    {
                        user = "Assistant",
                        content = "Certainly! Exercise has many benefits, including improved physical fitness, better mental health, increased energy levels, and reduced risk of chronic diseases. It also helps with stress management and improves sleep quality.",
                    },
                },
                {
                    { user = "User", content = "I'm feeling overwhelmed. What can I do?" },
                    {
                        user = "Assistant",
                        content = "I'm sorry to hear that. If you're feeling overwhelmed, consider taking a short break, practicing deep breathing exercises, or breaking your tasks into smaller, manageable steps. Talking to someone you trust can also help.",
                    },
                },
                {
                    { user = "User", content = "Tell me a fun fact." },
                    {
                        user = "Assistant",
                        content = "Sure! Did you know that honey never spoils? Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still perfectly edible!",
                    },
                },
            },
            -- What topics does this character discuss?
            topics = { "StealthSDK RPG" },
            -- What adjectives describe this character?
            adjectives = { "friendly", "helpful", "polite", "loyal" },
            -- What style does this character speak in?
            style = {
                "speaks in a polite and helpful manner",
            },
        },
    },
    -- Functions to be passed to the backend.
    functions = {
		color = {
            -- What does this function do, when should it be called?
			description = "Changes the color of the baseplate",
            similes = {
                "changeColor",
                "setBaseplateColor",
            },
			parameters = {
				color = {
					description = 'The color to change to. Can be either "red", "green", or "blue".',
                    -- Type can be either "string", "number" or "boolean".
					type = "string",
				},
			},
            -- Player is passed to provide specific functionality for the player, and conversation data is passed so that functionality can be provided for all participants.
			callback = function(
				player,
				conversation,
				data: {
					color: string,
				}
			)
				if data.color == "red" then
					game.Workspace.Baseplate.BrickColor = BrickColor.Red()
				elseif data.color == "green" then
					game.Workspace.Baseplate.BrickColor = BrickColor.Green()
				elseif data.color == "blue" then
					game.Workspace.Baseplate.BrickColor = BrickColor.Blue()
				end
			end,
		},
	},
    -- This config is optional.
    modelConfig = {
        -- The range where a model will start a conversation with a user.
        -- This value is optional and defaults to 10.
        interestRadius = 10,
    },
    -- Events are all optional. Default behaviour can be found in src/server/defaultCharacterConfig.luau
    -- Called events all receive the character as the first argument.
    events = {
        -- Called when a player leaves the radius of the character.
        onRadiusLeft = function(_, player, conversation)
            if conversation then
                conversation:removePlayer(player)
            end
        end,
        -- Called when a player is removed from a conversation and it ends up empty.
        onConversationEmpty = function(self, conversation)
            if not self.config.persistent then
                self:finishConversation(conversation)
            end
        end,
        -- Called when a player sends a message while interacting with the character.
        onChatted = function(self, player, message)
            -- Retrieve the conversation and model for the player.
            local conversation = self:getConversationForPlayer(player)
            local model = self:getInteractingModel(player)
            if not conversation or not model then
                return
            end

            -- Create a chat on the client. Clients create their own chat bubbles, so this is
            -- relevant to create a "Thinking..." bubble.
            local chatId = model:createChat(conversation)
            local reply = conversation:send(player, message)
            if not reply then
                -- The backend returned no message or errored.
                model:cancelChat(chatId)
                return
            end

            -- Did the prompt result in any called functions?
			if reply.calls then
                -- Did the provider generate any message to go along with the function call? (This occurs with the Eliza provider.)
				if reply.content ~= "" and reply.content ~= nil then
					model:setChatContent(chatId, player, reply.content)
                    model:cleanChat(chatId)
                    -- Let's create a new chat for the function call's response.
                    chatId = model:createChat(conversation)
				end

                -- Execute the functions.
                local actionResponses = self:executeFunctions(player, reply.calls)
                -- Have we provided feedback to the player yet?
                local feedbackProvided = false

                -- We've received action responses! Let's provide feedback to the player.
				for _, actionResponse in actionResponses do
                    -- This behaviour is completely customizable.
                    -- In this case, we let the player know if an action failed.
					if not actionResponse.success then
                        feedbackProvided = true
                        -- Will show the action's message in the chat bubble, colored in the appropriate color.
						model:provideActionFeedback(chatId, actionResponse)
                        -- We only have one chat bubble available, so let's break out of the loop.
						break
					end
				end

                if not feedbackProvided then
                    -- We haven't received any feedback, so let's provide a default message to let the player know that the action was at least executed.
                    model:provideActionFeedback(chatId, {
                        success = true,
                        message = "Action ran!",
                    })
                end

				return
			end

            -- The player left the radius while the model was processing the message or there was another reason why the chat could not be completed.
            if reply.cancelled then
                model:cancelChat(chatId)
                return
            end

            -- AI moderation model flagged the message or response.
            if reply.flagged then
                model:flagChat(chatId)
                return
            end

            local partakingPlayers = conversation:getPlayers()

            -- Replicate the message to all players in the conversation.
            for _, partakingPlayer: Player in partakingPlayers do
                local filteredResult = TextService:FilterStringAsync(reply.content, partakingPlayer.UserId)

                if not filteredResult then
                    continue
                end

                local filteredContent = filteredResult:GetChatForUserAsync(partakingPlayer.UserId)

                -- If the message was filtered, flag the chat. We don't want NPCs to send content like "Hi there, #########!" as it's immersion-breaking.
                if filteredContent ~= reply.content then
                    model:flagChat(chatId)
                    return
                end

                -- Set the chat content. This function can only be called once per chat.
                model:setChatContent(chatId, partakingPlayer, filteredContent)
            end

            -- Remove references on the server to this chat; it's now in the client's hands.
            model:cleanChat(chatId)
        end,
    }
}
```

## Adding NPCs

NPCs are added by adding the NPC tag (default: `EngineNPC`) to a model. This model must have a PrimaryPart. You must then add the `Character` attribute, which should correspond to a loaded character's **name**.

### Configuring NPCs

NPCs feature a few customization options to improve the experience, applied via attributes:

- `BubbleOffset` (number): the vertical offset of the bubble from the NPC's PrimaryPart in world space, in studs.
- `BubbleDistanceMultiplier` (number): The distance multiplier for the bubble fade effect. If this is below 1, the distance it takes for a bubble to start fading will increase. This is useful for interactions in large ranges, as bubbles will normally start fading out at 30 studs.
- `ShowMessagesInChat` (boolean): If true, messages from this NPC will be shown in the chat. If false, they will only be shown in the bubble.
- `ChatChannelName` (string): The name of the chat channel to use for messages from this NPC. **Must be provided if `ShowMessagesInChat` is true.**
- `MessageMarkup` (string): Rich text markup used to format messages from this NPC. This can be used to apply custom formatting to messages, such as colors, bold text, and more. Is used with string.format and should contain a single `%s` to insert the message content. Example: `<b>%s</b>`.
- `NameMarkup` (string): Rich text markup used to format the NPC's name. This can be used to apply custom formatting to the NPC's name, such as colors, bold text, and more. Is used with string.format and should contain a single `%s` to insert the NPC's name. Example: `<b>%s: </b>`. The default value is `%s: `. Keep in mind that spaces at the end of the markup will be normalized in attribute fields, so consider wrapping these in a rich text tag to retain them.
