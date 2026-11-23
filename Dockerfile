# Stage 1: Build the Angular application
FROM node:24.22.3-alpine@sha256:116b800c3754b440ee0aa3ed2f20f5bf3d99a554bfd9adeea09ea8017f6e85f5 AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve the application using "serve"
FROM node:24.22.3-alpine@sha256:116b800c3754b440ee0aa3ed2f20f5bf3d99a554bfd9adeea09ea8017f6e85f5

WORKDIR /app

RUN npm install -g --ignore-scripts serve@14.2.6

COPY --from=build /app/www /app

USER node

EXPOSE 3000

CMD ["serve", "-s", ".", "-l", "3000"]
