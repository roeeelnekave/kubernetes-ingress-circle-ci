FROM node:20 as base

COPY . /app

WORKDIR /app

RUN npm install --no-interaction
RUN npm run build


FROM nginx

COPY --from=base /app/public /app/public

COPY docker/nginx/proxy.conf /etc/nginx/conf.d/default.conf


