# BUILD STAGE
FROM node:10.15.3-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM keymetrics/pm2:latest-alpine as production-stage
COPY --from=build-stage /app/dist ./dist
COPY package*.json ./
COPY pm2.config.js ./

RUN npm install --production

EXPOSE 3000
CMD ["pm2-runtime", "start", "pm2.config.js", "--env", "production"]