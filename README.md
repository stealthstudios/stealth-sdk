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

This application consists of a backend that provides the underlying logic for tracking conversations and sending requests to the OpenAI API. It is built using Node.js and Fastify, using PostgreSQL as a database.

Developers can then use the SDKs to interact with this backend, and build their own chatbot applications on top of it. The current SDKs are:

- Luau (Roblox)
- [JavaScript](./sdk/js/)

### Installation

This application was built with Node v20, and using this version of Node is recommended.

```bash
npm install
```

### Environment Variables

When using this application, you need to set the following environment variables:

- `SERVER_PORT`: The port to run the server on.
- `OPENAI_API_KEY`: The API key to use for the OpenAI API.
- `ENDPOINT_API_KEY`: The authentication key that all incoming requests must provide.
- `ENVIRONMENT`: The environment to run the server in. This should be set to `development` or `production`. In a development environment, certain security features are disabled to make development easier. The Scalar API key (in the API reference) is for example filled in automatically.

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
