FROM python:3 AS builder
RUN pip3 install mkdocs
RUN pip3 install mkdocs-bootstrap4

WORKDIR /home/mocko
COPY . .
RUN mkdocs build


FROM nginx:1.16.1-alpine

RUN rm /usr/share/nginx/html/*
COPY --from=builder /home/mocko/site /usr/share/nginx/html
