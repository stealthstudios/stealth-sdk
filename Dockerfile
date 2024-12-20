ARG DEV_SERVER_PORT=3000

FROM node:20

WORKDIR /app

COPY package.json .

RUN npm install

COPY . .
CMD ["npm", "run", "deploy"]
EXPOSE ${DEV_SERVER_PORT}
