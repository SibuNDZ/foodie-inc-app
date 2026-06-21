FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --no-audit --no-fund

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV API_URL=http://localhost:8080

COPY --from=build /app/dist/foodie-app ./dist/foodie-app

EXPOSE 4000

CMD ["node", "dist/foodie-app/server/server.mjs"]
