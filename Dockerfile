# build stage
FROM node:lts-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
RUN npm install spam-detection
COPY . .
RUN npm run build

# dev stage
FROM build-stage as dev-stage
RUN apk update && apk add bash
EXPOSE 3000
CMD [ "npm", "run", "dev" ]

# production stage
FROM nginx:stable-alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]