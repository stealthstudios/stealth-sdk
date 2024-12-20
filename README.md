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

### Installation

This application was built with Node v22, and using this version of Node is recommended.

```bash
npm install
```

### Environment Variables

When using this application, you need to set the following environment variables:

- `SERVER_PORT`: The port to run the server on.
- `OPENAI_API_KEY`: The API key to use for the OpenAI API.
- `ENDPOINT_API_KEY`: The authentication key that all incoming requests must provide.
- `ENVIRONMENT`: The environment to run the server in. This should be set to `development` or `production`. In a development environment, certain security features are disabled to make development easier. The Scalar API key is for example filled in automatically.

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

Launch with `start.bat` or `start.sh` depending on your operating system.

## Endpoint Documentation

By defining an OpenAPI scheme for every endpoint, a documentation page is generated automatically at `{server_url}/reference`.
