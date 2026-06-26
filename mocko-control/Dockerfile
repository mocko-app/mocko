FROM node:24-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build


FROM node:24-alpine

RUN adduser -D -u 10001 mocko
WORKDIR /app
COPY --chown=mocko:mocko --from=builder /app/.next/standalone ./
COPY --chown=mocko:mocko --from=builder /app/.next/static ./.next/static
COPY --chown=mocko:mocko --from=builder /app/public ./public

USER mocko
ENV PORT=6625
ENV HOSTNAME=0.0.0.0
EXPOSE 6625
CMD ["node", "server.js"]
