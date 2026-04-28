FROM node:24-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build


FROM node:24-alpine

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --omit=dev && \
    adduser -D -u 10001 mocko && \
    mkdir -p /var/mocks && \
    chown -R mocko:mocko /app /var/mocks

COPY --from=builder /app/dist ./dist
COPY default.env .

USER mocko
EXPOSE 8080
VOLUME ["/var/mocks"]
CMD ["node", "--expose-gc", "dist/main"]
