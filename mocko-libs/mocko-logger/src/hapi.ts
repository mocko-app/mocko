import * as Hapi from '@hapi/hapi';
import * as colors from 'colors/safe';
import { LogColumn, Logger } from './logger';

const log = new Logger()
    .column(LogColumn.timestamp().color(colors.dim))
    .column(LogColumn.text().size(5).right().color(colors.dim))
    .column(LogColumn.text().size(7).right())
    .column(LogColumn.text().size(48))
    .column(LogColumn.text().size(10).right())
    .column(LogColumn.text())
    .log;

function logRequest(request: Hapi.Request, time: string) {
    const { method, path } = request;
    const status = request.response instanceof Error ?
            request.response.output.statusCode :
            request.response.statusCode;
    const label = request['_label'] || 'req';

    let statusColor = colors.bold;
    switch(true) {
        case status >= 200 && status < 300:
            statusColor = colors.green;
            break;
        case status >= 400 && status < 500:
            statusColor = colors.yellow;
            break;
        case status >= 500:
            statusColor = colors.red;
            break;
    }

    log(label, method.toUpperCase(), path, time + "ms", statusColor(status.toString()));
}

export const hapiRequestLogger = {
    name: 'hapiRequestLogger',
    version: '1.0.0',
    register: async function (server: Hapi.Server, { ignoredRoutes = [] } = {}) {
        const ignoredRoutesSet = new Set(ignoredRoutes);

        server.ext('onRequest', (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
            request['_startAt'] = process.hrtime();
            return h.continue;
        });

        server.ext('onPreResponse', (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
            if(ignoredRoutesSet.has(request.path)) {
                return h.continue;
            }

            const deltaT = process.hrtime(request['_startAt']);
            const deltaMs = (deltaT[0] * 1e3) + (deltaT[1] * 1e-6);

            logRequest(request, deltaMs.toFixed(3));
            return h.continue;
        });
    }
};
