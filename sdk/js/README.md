<div align="center">

# stealth-sdk-js

[![CI JS](https://github.com/stealthstudios/stealth-sdk/actions/workflows/ci-js.yaml/badge.svg)](https://github.com/stealthstudios/stealth-sdk/actions)

</div>

## Table of Contents

- [stealth-sdk-js](#stealth-sdk-js)
  - [Table of Contents](#table-of-contents)
  - [Usage](#usage)
  - [Roblox Open Cloud](#roblox-open-cloud)
  - [Functions](#functions)

## Usage

Installation can be done through any preferred package manager (we recommend [pnpm](https://pnpm.io/installation)):

```bash
pnpm install stealthstudios/stealthsdk-js
```

You may then use the SDK as follows:

```javascript
import sdk from "stealthsdk-js";

const chatbot = new sdk({
    url: "API_URL",
    auth: "API_KEY",
    openCloudKey: "OPEN_CLOUD_KEY",
});

// Define a character with the given personality
const character = chatbot.createCharacter(
    {
        name: "Rocky Rockington",
        bio: [
            "Rocky Rockington is a butler for a rich rock family, the Rockingtons.",
            "Will assist the player with their needs in the world of StealthSDK RPG",
            "Answers in a polite and helpful manner.",
            "Does not express opinions or beliefs, stating only facts.",
        ],
        lore: [
            "Is a butler for a rich rock family, the Rockingtons.",
            "Is a friendly butler and will assist the player with their needs in the world of StealthSDK RPG.",
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
                    content:
                        "The king of this world is the Rockingtons' father.",
                },
            ],
        ],
        topics: ["StealthSDK RPG", "Rockingtons"],
        adjectives: ["friendly", "helpful", "polite", "loyal"],
        style: ["speaks in a polite and helpful manner"],
    },
    {
        // Define the function name
        print: {
            // What are alternative names for this function?
            similes: ["log"],
            // What does this function do? When should it be used?
            description:
                "Prints a message to the console. The user must provide a message to print.",
            // What parameters does this function take? What are their types (Only "string", "boolean" and "number" are supported)?
            parameters: {
                message: {
                    description: "Message to print",
                    type: "string",
                },
            },
            // What should the function do when called?
            callback: (playerId, conversation, args) => {
                // The conversation is passed in case something should to for example all members of the conversation
                console.log(playerId, conversation, args.message);
            },
        },
    },
);

const userId = 1;

// Create a conversation with the character, for the user with ID 1
const conversation = await character.createConversation({
    id: userId,
    name: "User",
});

const response = await conversation.send(
    userId,
    "What is my name, and how much gold do I have?",
    {
        // This context will be placed in the prompt, mapped as <name>: <value>.
        gold: 100,
    },
);

if (response && response.calls) {
    // Iterate over all calls made by the AI
    for (const call of response.calls) {
        // If the function exists, call it
        if (character.functions[call.name]) {
            // Call the function, passing in the user ID, conversation, and parameters
            character.functions[call.name].callback(
                userId,
                conversation,
                call.parameters,
            );
        }
    }
}

// Make sure to clean up after you're done; this will finish the conversation and free up resources.
// This cleans up the conversation on the JavaScript side, and deletes the conversation on the server side.
conversation.destroy();
```

## Roblox Open Cloud

This SDK can pull data from your game's datastores through the Roblox Open Cloud API. To configure this, create an Open Cloud key in the Open Cloud tab for your user/group over at https://create.roblox.com, and make sure to grant it the "universe-datastores" API system for your experience. Only the "read" permission is required.

An example of accessing a datastore can be seen below:

```javascript
const response = await conversation.send(
    1,
    "What is my name, and how many wins do I have?",
    {
        datastores: [
            {
                // What type of datastore is this? (standard, ordered)
                type: "standard",
                // The ID of the universe
                universeId: "1",
                // The name of the datastore
                datastoreName: "DataStore",
                // The key of the entry
                entryKey: "1",
                fieldsMutator: (fields) => {
                    // This function is used to mutate the fields, defining what data is passed into the context.
                    // The output of this function is directly injected into the context.
                    // The input is the datastore entry.
                    return {
                        Wins: fields.Wins,
                        Cash: fields.Cash,
                    };
                },
            },
            {
                type: "ordered",
                universeId: "1",
                datastoreName: "DataStore",
                entryKey: "1",
                fieldName: "Wins",
            },
        ],
        // You can still pass in the context.
        gold: 100,
    },
);
```

## Functions

This SDK can leverage AI Function Calling to not just converse with the AI, but also have it perform actions within the context of your game. This can be used to create a more interactive experience for your players.

An example of using functions can be seen below:

```javascript
const character = chatbot.createCharacter(
    {
        name: "Rocky Rockington",
        bio: [],
        lore: [],
        knowledge: [],
        messageExamples: [],
    },
    {
        // Define the function name
        print: {
            // What are alternative names for this function?
            similes: ["log"],
            // What does this function do? When should it be used?
            description:
                "Prints a message to the console. The user must provide a message to print.",
            // What parameters does this function take? What are their types (Only "string", "boolean" and "number" are supported)?
            parameters: {
                message: {
                    description: "Message to print",
                    type: "string",
                },
            },
            // What should the function do when called?
            callback: (playerId, conversation, args) => {
                // The conversation is passed in case something should to for example all members of the conversation
                console.log(playerId, conversation, args.message);
            },
        },
    },
);

const conversation = await character.createConversation({
    id: 1,
    name: "User",
});

const response = await conversation.send(1, "Print 'Hello, world!'");

if (response.calls) {
    for (const call of response.calls) {
        if (character.functions[call.function]) {
            character.functions[call.function].callback(
                1,
                conversation,
                call.parameters,
            );
        }
    }
}
```
