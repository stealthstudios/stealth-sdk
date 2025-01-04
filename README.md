<div align="center">

# chatbot-backend

[![CI Backend](https://github.com/VirtualButFake/chatbot-sdk/actions/workflows/ci-backend.yaml/badge.svg)](https://github.com/VirtualButFake/chatbot-sdk/actions)

</div>

## Table of Contents

- [chatbot-backend](#chatbot-backend)
    - [Table of Contents](#table-of-contents)
    - [Usage](#usage)
        - [Installation](#installation)
        - [Environment Variables](#environment-variables)
    - [Running the application](#running-the-application)
        - [Development](#development)
        - [Production](#production)
        - [Docker](#docker)
    - [Endpoint Documentation](#endpoint-documentation)

## Usage

This application consists of a backend that provides the underlying logic for tracking conversations and sending requests to the API of several providers. It is built using Node.js and Fastify, using PostgreSQL as a database.

Developers can then use the SDKs to interact with this backend, and build their own chatbot applications on top of it. The current SDKs are:

- [Luau (Roblox)](./sdk/luau/)
- [JavaScript](./sdk/js/)

### Installation

This application was built with Node v20, and using this version of Node is recommended.

```bash
npm install
```

### Environment Variables

When using this application, you need to set the following environment variables:

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

## Running the application

### Development

```bash
npm run dev
```

This starts a development server. The server will automatically reload if you make changes to the code, through the use of [nodemon](https://github.com/remy/nodemon).

### Production

```bash
npm run start
```

### Docker

Launch with `docker.sh`. This will remove existing containers, build the image and run the container, injecting necessary environment variables.

```bash
./docker.sh
```

## Endpoint Documentation

By defining an OpenAPI scheme for every endpoint, a documentation page is generated automatically at `/reference`. This page is generated using Scalar.
