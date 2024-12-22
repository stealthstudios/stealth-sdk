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
    read -p "The environment is set to \"development\". This will expose API keys on the reference pages. Are you sure you want to do this?" -n 1 -r
    echo # (optional) move to a new line
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo
        echo "Aborting Docker setup process. Set \"ENVIRONMENT\" to \"production\" in .env to get rid of this warning."
        echo
        exit
    fi
fi

echo "Stopping container.."
docker compose down

echo "Removing old volumes.."
docker compose rm -f

echo "Building and starting container.."
docker compose up -d --force-recreate --build
