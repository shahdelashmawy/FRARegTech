FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json .npmrc ./
RUN npm install && \
    rm -rf node_modules/terser-webpack-plugin/node_modules/schema-utils && \
    rm -rf node_modules/terser-webpack-plugin/node_modules/ajv-keywords && \
    rm -rf node_modules/fork-ts-checker-webpack-plugin/node_modules/schema-utils && \
    rm -rf node_modules/fork-ts-checker-webpack-plugin/node_modules/ajv-keywords
COPY . .
ARG REACT_APP_API_URL=http://localhost:8000/api
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV CI=false
ENV GENERATE_SOURCEMAP=false
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf.template
CMD ["/bin/sh", "-c", "envsubst '$PORT' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
