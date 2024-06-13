# Stage 1: Build the Angular application
FROM node:lts-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build --prod

# Stage 2: Serve the application using "serve"
FROM node:lts-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=build /app/www /app

EXPOSE 3000

CMD ["serve", "-s", ".", "-l", "3000"]
