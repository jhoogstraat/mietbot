FROM node:16-alpine
RUN apk update && apk upgrade && apk --no-cache add shadow && groupmod -g 1001 node && usermod -u 1001 -g 1001 node
WORKDIR /bot
COPY --chown=node:node . .
RUN npm i && npm run build && rm -r src/ && npm prune --production
USER node
CMD node dist/main.js
