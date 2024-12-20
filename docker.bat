@echo off

setlocal
echo Loading environment variables...
FOR /F "tokens=*" %%i in ('type .env') do SET %%i

echo Starting container, relevant settings:
echo POSTGRES_PORT: %POSTGRES_PORT%
echo SERVER_PORT: %SERVER_PORT%

if "%DEV_SERVER_PORT%" == "" (
    echo DEV_SERVER_PORT is not set, using default value 3000
    set DEV_SERVER_PORT=3000
)

if "%ENVIRONMENT%" == "development" (
    echo Disabling development mode when deploying to Docker to avoid exposing the API token
    set ENVIRONMENT=production
)

echo Stopping container..
docker compose down

echo Removing old volumes..
docker compose rm -f

echo Building and starting container..
docker compose up -d --force-recreate --build

endlocal
