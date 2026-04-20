FROM node:24-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build


FROM node:24-alpine

RUN adduser -D -u 10001 mocko
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
RUN chown -R mocko:mocko /app

USER mocko
ENV PORT=6625
ENV HOSTNAME=0.0.0.0
EXPOSE 6625
CMD ["node", "server.js"]
