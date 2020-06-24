FROM node:12-alpine AS builder

WORKDIR /home/mocko

COPY package.json .
COPY package-lock.json .
RUN npm set progress=false
RUN npm install

COPY . .
RUN npm run build


FROM nginx:1.16.1-alpine

COPY --from=builder /home/mocko/build /usr/share/nginx/html/build
RUN rm /usr/share/nginx/html/*.html
