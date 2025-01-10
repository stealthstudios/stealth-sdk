<div align="center">

# Stealth SDK

<img src="./static/eliza-rblx.png" alt="StealthSDK Banner" width="100%" />

### [![CI Backend](https://github.com/stealthstudios/stealth-sdk/actions/workflows/ci-backend.yaml/badge.svg)](https://github.com/stealthstudios/stealth-sdk/actions) <!-- omit from toc -->

### Supported SDKs <!-- omit from toc -->

![Roblox](https://img.shields.io/badge/Roblox-000000?logo=data:image/svg%2bxml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIiA/Pgo8IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4iICJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQiPgo8c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHZlcnNpb249IjEuMSIgd2lkdGg9IjI2NyIgaGVpZ2h0PSIyNjciIHZpZXdCb3g9IjAgMCAyNjcgMjY3IiB4bWw6c3BhY2U9InByZXNlcnZlIj4KPGRlc2M+Q3JlYXRlZCB3aXRoIEZhYnJpYy5qcyAzLjYuNjwvZGVzYz4KPGRlZnM+CjwvZGVmcz4KPGcgdHJhbnNmb3JtPSJtYXRyaXgoMSAwIDAgMSAtMTg1LjUgMjQ4LjA1KSIgaWQ9ImJhY2tncm91bmRyZWN0IiAgPgo8cmVjdCBzdHlsZT0ic3Ryb2tlOiBub25lOyBzdHJva2Utd2lkdGg6IDE7IHN0cm9rZS1kYXNoYXJyYXk6IG5vbmU7IHN0cm9rZS1saW5lY2FwOiBidXR0OyBzdHJva2UtZGFzaG9mZnNldDogMDsgc3Ryb2tlLWxpbmVqb2luOiBtaXRlcjsgc3Ryb2tlLW1pdGVybGltaXQ6IDQ7IGZpbGw6IG5vbmU7IGZpbGwtcnVsZTogbm9uemVybzsgb3BhY2l0eTogMTsiICB4PSItNTAiIHk9Ii01MCIgcng9IjAiIHJ5PSIwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgLz4KPC9nPgo8ZyB0cmFuc2Zvcm09Im1hdHJpeCgxIDAgMCAxIDM2Ljc2IDQxMy4yOCkiIGlkPSJzdmdfMiIgID4KPHBvbHlsaW5lIHN0eWxlPSJzdHJva2U6IHJnYigyNTUsMjU1LDI1NSk7IHN0cm9rZS13aWR0aDogMDsgc3Ryb2tlLWRhc2hhcnJheTogbm9uZTsgc3Ryb2tlLWxpbmVjYXA6IGJ1dHQ7IHN0cm9rZS1kYXNob2Zmc2V0OiAwOyBzdHJva2UtbGluZWpvaW46IG1pdGVyOyBzdHJva2UtbWl0ZXJsaW1pdDogNDsgZmlsbDogbm9uZTsgZmlsbC1ydWxlOiBub256ZXJvOyBvcGFjaXR5OiAxOyIgIHBvaW50cz0iLTguNywtMTIuNTkgLTEzLjUyLC0yMC43NCAtMTIuNDEsLTIxLjExIC0xMS42NywtMjEuNDggLTEwLjU2LC0yMS40OCAtOC43LC0yMS40OCAtNy4yMiwtMjEuNDggLTUuNzQsLTIxLjQ4IC01LC0yMS4xMSAtMy41MiwtMjAuNzQgLTIuNzgsLTIwLjc0IC0yLjA0LC0yMC4zNyAtMi4wNCwtMjAuMzcgLTAuOTMsLTE5LjI2IDAuMTksLTE4LjUyIDAuOTMsLTE3Ljc4IDEuNjcsLTE2LjY3IDIuNDEsLTE1LjU2IDMuMTUsLTE0LjgxIDMuNTIsLTEzLjcgMy44OSwtMTIuNTkgOC43LDQuODEgOS40NCw3Ljc4IDEwLjkzLDE0LjA3IDExLjY3LDE2LjY3IDEyLjA0LDE3Ljc4IDEyLjQxLDE4Ljg5IDEzLjE1LDIwLjM3IDEzLjE1LDIxLjExIDEzLjUyLDIxLjExIDEzLjUyLDIxLjQ4ICIgLz4KPC9nPgo8ZyB0cmFuc2Zvcm09Im1hdHJpeCg0LjM5IDAgMCA0LjM5IDEzMy41OCAxMzMuNjEpIiAgPgo8cGF0aCBzdHlsZT0ic3Ryb2tlOiBub25lOyBzdHJva2Utd2lkdGg6IDE7IHN0cm9rZS1kYXNoYXJyYXk6IG5vbmU7IHN0cm9rZS1saW5lY2FwOiBidXR0OyBzdHJva2UtZGFzaG9mZnNldDogMDsgc3Ryb2tlLWxpbmVqb2luOiBtaXRlcjsgc3Ryb2tlLW1pdGVybGltaXQ6IDQ7IGZpbGw6IHJnYigyNTUsMjU1LDI1NSk7IGZpbGwtcnVsZTogbm9uemVybzsgb3BhY2l0eTogMTsiICB0cmFuc2Zvcm09IiB0cmFuc2xhdGUoLTczLjEzLCAtMjYuODgpIiBkPSJNIDU3LjYgMCBMIDQ2LjI2IDQyLjQgbCA0Mi40IDExLjM1IEwgMTAwIDExLjM1IFogbSAxMS4yIDE5LjQ3IGwgMTEuODMgMy4xNyBsIC0zLjE3IDExLjgzIGwgLTExLjg0IC0zLjE3IHoiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgLz4KPC9nPgo8L3N2Zz4=)
![JavaScript](https://img.shields.io/badge/JavaScript-E4CF0D?logo=data:image/svg%2bxml;base64,PHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMiAxMiI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNmZmY7fTwvc3R5bGU+PC9kZWZzPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTEzLjczLDMuMzZhMi41LDIuNSwwLDAsMC0xLjA5LTEuMDlBNi4zMSw2LjMxLDAsMCwwLDEwLDJINmE2LjMxLDYuMzEsMCwwLDAtMi42NC4yN0EyLjUsMi41LDAsMCwwLDIuMjcsMy4zNiw2LjMxLDYuMzEsMCwwLDAsMiw2djRhNi4zMSw2LjMxLDAsMCwwLC4yNywyLjY0LDIuNSwyLjUsMCwwLDAsMS4wOSwxLjA5QTYuMzEsNi4zMSwwLDAsMCw2LDE0aDRhNi4zMSw2LjMxLDAsMCwwLDIuNjQtLjI3LDIuNSwyLjUsMCwwLDAsMS4wOS0xLjA5QTYuMzEsNi4zMSwwLDAsMCwxNCwxMFY2QTYuMzEsNi4zMSwwLDAsMCwxMy43MywzLjM2Wk04LDcuNVYxMWEyLDIsMCwwLDEtNCwwdi0uNUg1VjExYTEsMSwwLDAsMCwyLDBWOEg1LjVWN0g4Wm0yLjc1LDJoLjVhMS43NSwxLjc1LDAsMCwxLDAsMy41SDExYTIsMiwwLDAsMS0yLTJoMWExLDEsMCwwLDAsMSwxaC4yNWEuNzUuNzUsMCwwLDAsMC0xLjVoLS41YTEuNzUsMS43NSwwLDAsMSwwLTMuNUgxMWEyLDIsMCwwLDEsMiwySDEyYTEsMSwwLDAsMC0xLTFoLS4yNWEuNzUuNzUsMCwwLDAsMCwxLjVaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMiAtMikiLz48L3N2Zz4=)

</div>

## Table of Contents

- [Stealth SDK](#stealth-sdk)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Usage](#usage)
    - [Installation](#installation)
    - [Environment Variables](#environment-variables)
  - [Running the application](#running-the-application)
    - [Setting up the database](#setting-up-the-database)
    - [Development](#development)
    - [Production](#production)
  - [Endpoint Documentation](#endpoint-documentation)
  - [Contributing](#contributing)

## Features

- Extremely customizable agents, through the use of [ai16z's characterfile format](https://github.com/elizaOS/characterfile)
- Support for multiple AI providers, including Anthropic, DeepSeek and OpenAI
- Extensible behaviour through either a custom framework, or using [Eliza](https://github.com/ai16z/eliza).
- SDK support for multiple languages, including [Luau (Roblox)](./sdk/luau/) and [JavaScript](./sdk/js/)

## Usage

This application consists of a backend that provides the underlying logic for tracking conversations and uses [Eliza](https://github.com/ai16z/eliza) as the agent framework, through a custom client. It is built using Node.js and Fastify, using PostgreSQL as a database.

Developers can then use the SDKs to interact with this backend, and build their own chatbot applications on top of it. The current supported SDKs are:

- [Luau (Roblox)](./sdk/luau/)
- [JavaScript](./sdk/js/)

### Installation

This application was built with Node v23, and using this version of Node is recommended.

```bash
git clone https://github.com/stealthstudios/stealth-sdk.git
cd stealth-sdk
npm install
```

### Environment Variables

When using this application, you need to set the following environment variables in an `.env` file (An example is provided [here](./.env.example)):

- `AGENT_PROVIDER`: The provider to use for the agent. This should be set to `eliza` or left empty.
- `PROVIDER`: `anthropic` (Claude 3.5), `deepseekv3` or `openai` (GPT4).
- `AI_API_KEY`: The API key to pass to the model's API.
- `SERVER_PORT`: The port to run the app on.
- `ENDPOINT_API_KEY`: The authentication key that all incoming requests must provide.
- `ENVIRONMENT`: The environment to run the server in. This should be set to `development` or `production`. In a development environment, certain security features are disabled to make development easier. The Scalar API key (in the API reference) is for example filled in automatically.
- `POSTGRES_USER`: The username to use for the PostgreSQL database.
- `POSTGRES_PASSWORD`: The password to use for the PostgreSQL database.
- `POSTGRES_HOST`: The host to use for the PostgreSQL database.
- `POSTGRES_PORT`: The port to use for the PostgreSQL database.
- `POSTGRES_DB`: The database to use for the PostgreSQL database.
- `DATABASE_URL`: In order to dynamically fill in database details, the database URL should be set. This should generally be `"postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}?schema=public"`. This is then sent to Prisma to connect to the database.

If you are using Eliza (`AGENT_PROVIDER=eliza`), have a look at the [Eliza documentation](https://elizaos.github.io/eliza/docs/quickstart/#installation) to see what environment variables are required.

## Running the application

### Setting up the database

We use [Prisma](https://www.prisma.io/) to manage the database. To start the database and set it up, run the following commands (assuming all environment variables are set and [Docker](https://www.docker.com/) is installed):

```bash
docker compose up -d
npx prisma db push
```

### Development

```bash
npm run dev
```

This starts a development server. The server will automatically reload if you make changes to the code, through the use of [nodemon](https://github.com/remy/nodemon).

### Production

To start the server in production, run the following command:

```bash
npm run deploy
```

A solution like [PM2](https://pm2.keymetrics.io/) is recommended for running the server in production.

## Endpoint Documentation

By defining an OpenAPI scheme for every endpoint, a documentation page is generated automatically at `/reference` when the server is running. This page is generated using Scalar.

## Contributing

If you find any bugs or have any suggestions for the project, please let us know [here](https://github.com/stealthstudios/stealth-sdk/issues)!
