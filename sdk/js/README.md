<div align="center">

# chatbot-sdk-js

[![CI JS](https://github.com/VirtualButFake/chatbot-sdk/actions/workflows/ci-js.yaml/badge.svg)](https://github.com/VirtualButFake/chatbot-sdk/actions)

</div>

## Table of Contents

- [chatbot-sdk-js](#chatbot-sdk-js)
    - [Table of Contents](#table-of-contents)
    - [Usage](#usage)
    - [Open Cloud](#open-cloud)

## Usage

Installation can be done through NPM (**todo: upload**, just clone the repo for now).

```bash
npm install chatbot-sdk
```

You may then use the SDK as follows:

```javascript
import sdk from "chatbot-sdk";

const chatbot = new sdk({
    url: "API_URL",
    auth: "API_KEY",
    openCloudKey: "OPEN_CLOUD_KEY",
});

// Define a character with the given personality
const character = chatbot.createCharacter({
    name: "Rocky Rockington",
    bio: [
        "Rocky Rockington is a butler for a rich rock family, the Rockingtons.",
        "Will assist the player with their needs in the world of Skibidi Sigma RPG.",
        "Answers in a polite and helpful manner.",
        "Does not express opinions or beliefs, stating only facts.",
    ],
    lore: [
        "Is a butler for a rich rock family, the Rockingtons.",
        "Is a friendly butler and will assist the player with their needs in the world of Skibidi Sigma RPG.",
        "Has been with the Rockingtons since his childhood, and is a loyal butler to the family.",
    ],
    knowledge: [
        "The Rockingtons' favorite color is gray. It's their favourite color because it's the color of a rock.",
        "The Rockingtons' mansion is a large and beautiful house, and it is located in the center of the city.",
        "The king of this world is the Rockingtons' father, and he is a kind and generous man.",
        "The queen of this world is the Rockingtons' mother, and she is a kind and generous woman.",
    ],
    messageExamples: [
        [
            { user: "User", content: "Hello" },
            { user: "You", content: "Hello, how may I help you today?" },
        ],
        [
            {
                user: "User",
                content: "What is the Rockingtons' favorite color?",
            },
            {
                user: "You",
                content:
                    "The Rockingtons' favorite color is gray. It's their favourite color because it's the color of a rock.",
            },
        ],
        [
            {
                user: "User",
                content: "What is the Rockingtons' favorite food?",
            },
            {
                user: "You",
                content:
                    "I'm afraid that information is not up to me to share.",
            },
        ],
        [
            {
                user: "User",
                content: "Can I live in the Rockingtons' mansion?",
            },
            {
                user: "You",
                content: "Only the Rockingtons may live in the mansion.",
            },
        ],
        [
            { user: "User", content: "Who is the king of this world?" },
            {
                user: "You",
                content: "The king of this world is the Rockingtons' father.",
            },
        ],
    ],
});

// Create a conversation with the character, for the user with ID 1
const conversation = await character.createConversation({
    id: 1,
    name: "User",
});

const response = await conversation.send(
    1,
    "What is my name, and how much gold do I have?",
    {
        // Context can be provided here. It will be sent as a system message.
        gold: 100,
    },
);

// Make sure to clean up after you're done; this will finish the conversation and free up resources.
// This cleans up the conversation on the JavaScript side, and deletes the conversation on the server side.
conversation.destroy();
```

## Open Cloud

This SDK can pull data from your game's datastores through the Open Cloud API. To configure this, create an Open Cloud key in the Open Cloud tab for your user/group over at https://create.roblox.com, and make sure to grant it the "universe-datastores" API system for your experience. Only the "read" permission is required.

An example of accessing a datastore can be seen below:

```javascript
const response = await conversation.send(
    1,
    "What is my name, and how many wins do I have?",
    {
        datastore: {
            type: "standard",
            universeId: "6895019767",
            datastoreName: "PlayerData1",
            datastoreKey: "1000003693",
            fieldsPredicate: (fields) => {
                // this seems complicated, it's just to account for nested fields
                // defining a schema for the fields would be a better approach in a production scenario
                const allowed = {};
                const traverse = (obj, path = "") => {
                    for (const [key, value] of Object.entries(obj)) {
                        const newPath = path ? `${path}.${key}` : key;
                        if (key === "Win") {
                            allowed[newPath] = value;
                        }
                        if (value && typeof value === "object") {
                            traverse(value, newPath);
                        }
                    }
                };
                traverse(fields);
                return allowed;
            },
        },
        // Context can be provided here. It will be sent as a system message.
        gold: 100,
    },
);
```
