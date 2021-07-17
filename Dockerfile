FROM node:lts-alpine

WORKDIR /opt/marvinvr/ombi-mobile

RUN npm install -g serve

EXPOSE 5000

COPY serve.json .
COPY www www

USER 1000

ENTRYPOINT ["serve"]