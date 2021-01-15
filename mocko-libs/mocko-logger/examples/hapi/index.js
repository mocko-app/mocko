const Hapi = require('@hapi/hapi');
const Axios = require('axios');
const { hapiRequestLogger } = require('../../lib');

const server = Hapi.server({
    port: 3000,
    host: 'localhost'
});

server
    .register(hapiRequestLogger)
    .then(() => server.route({
        method: 'GET',
        path: '/hello',
        handler: (_request, _h) => {
            return 'Hey :)';
        },
    }))
    .then(() => server.start());

setInterval(() => {
    Axios.get('http://localhost:3000/hello');
}, 1000);
