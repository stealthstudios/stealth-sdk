<div align="center">

# chatbot-sdk-luau

[![CI Luau](https://github.com/VirtualButFake/chatbot-sdk/actions/workflows/ci-luau.yaml/badge.svg)](https://github.com/VirtualButFake/chatbot-sdk/actions)

</div>

## Table of Contents

- [chatbot-sdk-luau](#chatbot-sdk-luau)
    - [Table of Contents](#table-of-contents)
    - [Setup](#setup)
        - [Development](#development)
    - [Character Format](#character-format)
    - [Adding NPCs](#adding-npcs)
        - [Configuring NPCs](#configuring-npcs)

## Setup

This SDK comes with a built-in demo place to test the backend. It consists of a baseplate and a test NPC. Players can interact with this NPC to test the chatbot. It is non-persistent and allows group interactions.

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
        -- Called when a player enters the radius of the character.
        onRadiusEnter = function(self, player)
            self:getConversationForPlayer(player, true)
        end,
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

            -- The player left the radius while the model was processing the message or there was another reason why the chat could not be completed.
            if reply.cancelled then
                model:cancelChat(chatId)
                return
            end

            -- OpenAI's moderation model flagged the message or response.
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
