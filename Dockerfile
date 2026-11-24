FROM node:20-alpine

RUN apk add --no-cache python3 make g++ tzdata

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY . .

ENV NODE_ENV=production
EXPOSE 8080

VOLUME ["/app/data"]

CMD ["node", "src/index.js"]
