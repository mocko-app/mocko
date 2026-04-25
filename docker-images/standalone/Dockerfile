FROM node:24-alpine

ENV MOCKO_URL= \
    MOCKO_TIMEOUT=30000

RUN npm i -g @mocko/cli@2.0.0-beta.1 && \
    adduser -D -u 10001 mocko && \
    mkdir -p /var/mocks && chown -R mocko:mocko /var/mocks

USER mocko
WORKDIR /var/mocks
EXPOSE 8080
EXPOSE 6625
VOLUME ["/var/mocks"]

ENTRYPOINT ["sh", "-c", "mocko --watch --port 8080 --url \"$MOCKO_URL\" --timeout $MOCKO_TIMEOUT /var/mocks"]
