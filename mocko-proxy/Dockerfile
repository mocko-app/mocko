FROM node:12-alpine AS builder

WORKDIR /home/mocko
COPY package.json .
COPY package-lock.json .

RUN npm set progress=false
RUN npm install --only=production
RUN cp -R node_modules /home/prod_modules
RUN npm install
COPY . .
RUN npm run build


FROM node:12-alpine

WORKDIR /home/mocko
COPY --from=builder /home/prod_modules ./node_modules
COPY --from=builder /home/mocko/dist ./dist
COPY default.env .
COPY mocks.hcl .

CMD ["node", "dist/main"]
