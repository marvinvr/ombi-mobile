# Stage 1: Build the Angular application
FROM node:24.22.1-alpine@sha256:06d7adf3e0ef61a13f1d28682726366f97a15aa1888c934d3ecec86c33918b53 AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build --prod

# Stage 2: Serve the application using "serve"
FROM node:24.22.1-alpine@sha256:06d7adf3e0ef61a13f1d28682726366f97a15aa1888c934d3ecec86c33918b53

WORKDIR /app

RUN npm install -g --ignore-scripts serve@14.2.6

COPY --from=build /app/www /app

USER node

EXPOSE 3000

CMD ["serve", "-s", ".", "-l", "3000"]
