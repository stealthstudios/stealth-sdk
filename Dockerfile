ARG SERVER_PORT=3000

FROM node:20

WORKDIR /app

COPY package.json .

RUN npm install

COPY . .
CMD ["npm", "run", "deploy"]
EXPOSE ${SERVER_PORT}
