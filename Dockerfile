FROM node:lts-alpine

WORKDIR /opt/marvinvr/ombi-mobile

RUN npm install -g serve

EXPOSE 3000

COPY serve.json .
COPY www www
COPY scripts scripts

RUN chown -R 1000:1000 www/

USER 1000

ENTRYPOINT ["/bin/sh", "-c", "scripts/set-predefined-host.sh && serve"]