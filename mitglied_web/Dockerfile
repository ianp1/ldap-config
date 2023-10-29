# example on https://medium.com/@wkrzywiec/build-and-run-angular-application-in-a-docker-container-b65dbbc50be8

### Stage 1: Build angular application ###
FROM node:10.22-stretch AS build
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm install 
COPY . .
RUN npm run build


### Stage 2: Run application ###
FROM nginx:1.17.1-alpine
COPY nginx.conf /etc/nginx/nginx.conf
RUN ls -la /usr/share/nginx/html
COPY --from=build /usr/src/app/dist/mitglied-web /usr/share/nginx/html