ARG NODE_IMAGE=node:22.9.0-alpine

FROM $NODE_IMAGE AS base
RUN apk --no-cache add dumb-init
RUN npm install -g pnpm
RUN mkdir -p /home/node/app && chown node:node /home/node/app
WORKDIR /home/node/app
USER node
RUN mkdir tmp

FROM base AS dependencies

COPY --chown=node:node package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY --chown=node:node . .

FROM dependencies AS build
RUN pnpm run build

FROM base AS production
ENV NODE_ENV=production
ENV PORT=$PORT
ENV HOST=0.0.0.0
COPY --chown=node:node package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --production
COPY --chown=node:node --from=build /home/node/app/build ./
EXPOSE $PORT
CMD [ "dumb-init", "node", "server.js" ]
