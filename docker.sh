#!/bin/bash

echo "Loading environment variables..."
set -a && source .env && set +a

echo "Starting container, relevant settings:"
echo "POSTGRES_PORT: $POSTGRES_PORT"
echo "SERVER_PORT: $SERVER_PORT"

if [ -z "$DEV_SERVER_PORT" ]; then
    echo "DEV_SERVER_PORT is not set, using default value 3000"
    export DEV_SERVER_PORT=3000
fi

if [ "$ENVIRONMENT" = "development" ]; then
    echo "Disabling development mode when deploying to Docker to avoid exposing the API token"
    export ENVIRONMENT=production
fi

echo "Stopping container.."
docker compose down

echo "Removing old volumes.."
docker compose rm -f

echo "Building and starting container.."
docker compose up -d --force-recreate --build
