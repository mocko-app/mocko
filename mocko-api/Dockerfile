FROM node:16-alpine AS builder

WORKDIR /home/mocko
COPY package.json .
COPY package-lock.json .

RUN npm set progress=false
RUN npm install --omit=dev
RUN cp -R node_modules /home/prod_modules
RUN npm install
COPY . .
RUN npm run build


FROM node:16-alpine

WORKDIR /home/mocko
COPY --from=builder /home/prod_modules ./node_modules
COPY --from=builder /home/mocko/dist ./dist
COPY default.env .

CMD ["node", "dist/main"]
