# NetOps Toolkit: build the static site, then serve it with tools/serve.mjs.
#
#   docker build -t netops-toolkit .
#   docker run -d -p 8080:8080 netops-toolkit
#
# The site is built once, here. To customize it, create toolkit.config.local.ts
# next to this file before building (see the README); it is copied in.

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN sh tools/build /out

FROM node:22-alpine
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8080
WORKDIR /srv
COPY --from=build /out ./dist
COPY tools/serve.mjs ./serve.mjs
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1
CMD ["node", "serve.mjs", "dist"]
