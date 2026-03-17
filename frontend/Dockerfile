FROM node:18-alpine
WORKDIR /app
COPY build/ ./build/
RUN npm install -g serve
CMD ["sh", "-c", "serve -s build -l $PORT"]
