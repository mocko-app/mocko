import 'reflect-metadata';
import { Container } from 'inversify';
import * as Hapi from '@hapi/hapi';
import { parse } from 'bigodon';
import { ILogger, Logger, logger } from './utils/logger';
import { ConfigProvider, configProvider } from './config/config.service';
import { DefinitionProvider } from './definitions/definition.provider';
import { isReservedPath, MockService } from './api/mock/mock.service';
import { RouteRegistrar } from './route-registrar';
import { Diagnostic, DiagnosticsCollector } from './definitions/diagnostics';
import { Mock } from './definitions/data/mock';
import { Host } from './definitions/data/host';

export { Diagnostic, DiagnosticSeverity } from './definitions/diagnostics';

export type ValidationResult = {
    diagnostics: Diagnostic[],
    mockCount: number,
    fileCount: number,
};

export type ValidationOptions = {
    silent?: boolean,
};

const silentLogger: ILogger = {
    info: () => {},
    warn: () => {},
    error: () => {},
};

export async function validate(options: ValidationOptions = {}): Promise<ValidationResult> {
    const container = new Container({
        autoBindInjectable: true,
        defaultScope: 'Singleton',
    });

    container.bind<ILogger>(Logger).toConstantValue(options.silent ? silentLogger : logger);
    container.bind<ConfigProvider>(ConfigProvider).toConstantValue(configProvider);

    const collector = container.get(DiagnosticsCollector);
    collector.enable();

    const { mocks, hosts } = await container.get(DefinitionProvider).getDefinitions();

    if(mocks.length === 0) {
        collector.push({
            code: 'no-mocks',
            severity: 'error',
            message: `no mocks found in '${process.env['MOCKS_FOLDER']}'`,
        });
    }

    for(const mock of mocks) {
        validateReservedPath(mock, collector);
        validateTemplate(mock, collector);
        validateHostReference(mock, hosts, collector);
    }

    reportConflicts(mocks, hosts, collector);
    await registerRoutes(container);

    const diagnostics = withoutRedundantConflicts(collector.diagnostics);
    attachFiles(diagnostics, mocks);

    return {
        diagnostics,
        mockCount: mocks.length,
        fileCount: countFiles(diagnostics, mocks),
    };
}

function validateReservedPath(mock: Mock, collector: DiagnosticsCollector): void {
    if(isReservedPath(mock.path)) {
        collector.push({
            code: 'reserved-path',
            severity: 'error',
            file: mock.filePath,
            mock: `${mock.method} ${mock.path}`,
            message: "the path '/__mocko__' is reserved for Mocko's internal endpoints",
        });
    }
}

function validateTemplate(mock: Mock, collector: DiagnosticsCollector): void {
    try {
        parse(mock.response.body);
    } catch(e) {
        collector.push({
            code: 'template-parse-error',
            severity: 'error',
            file: mock.filePath,
            mock: `${mock.method} ${mock.path}`,
            message: `invalid template body: ${e instanceof Error ? e.message : String(e)}`,
        });
    }
}

function validateHostReference(mock: Mock, hosts: Host[], collector: DiagnosticsCollector): void {
    if(!mock.host) {
        return;
    }

    const exists = hosts.some((host) =>
        host.slug === mock.host || host.source === mock.host);
    if(!exists) {
        collector.push({
            code: 'host-not-found',
            severity: 'warning',
            file: mock.filePath,
            mock: `${mock.method} ${mock.path}`,
            message: `references host '${mock.host}' but no host block with that name or source exists, '${mock.host}' will be matched as a literal hostname`,
        });
    }
}

function reportConflicts(mocks: Mock[], hosts: Host[], collector: DiagnosticsCollector): void {
    const groups = new Map<string, Mock[]>();

    for(const mock of mocks) {
        if(!mock.isEnabled || isReservedPath(mock.path)) {
            continue;
        }

        const vhost = resolveVhost(mock.host, hosts);
        const key = `${mock.method} ${mock.path}${vhost ? ` @${vhost}` : ''}`;
        const group = groups.get(key) || [];
        group.push(mock);
        groups.set(key, group);
    }

    for(const group of groups.values()) {
        const [first, ...duplicates] = group;

        for(const duplicate of duplicates) {
            const message = duplicate.filePath === first.filePath
                ? `is defined more than once in '${first.filePath}'`
                : `conflicts with mock '${first.method} ${first.path}' in '${first.filePath}'`;

            collector.push({
                code: 'route-conflict',
                severity: 'error',
                file: duplicate.filePath,
                mock: `${duplicate.method} ${duplicate.path}`,
                message,
            });
        }
    }
}

function resolveVhost(hostName: string | undefined, hosts: Host[]): string | undefined {
    if(!hostName) {
        return undefined;
    }

    const host = hosts.find((item) =>
        item.slug === hostName || item.source === hostName);
    return host?.source || hostName;
}

async function registerRoutes(container: Container): Promise<void> {
    const app = new Hapi.Server();
    const registrar = container.get(RouteRegistrar);
    const routes = await container.get(MockService).getMockRoutes();
    routes.forEach(route => registrar.register(app, route));
}

function withoutRedundantConflicts(diagnostics: Diagnostic[]): Diagnostic[] {
    const conflictMocks = new Set(diagnostics
        .filter(d => d.code === 'route-conflict')
        .map(d => d.mock));

    return diagnostics.filter(d =>
        !(d.code === 'route-mapping-failed'
            && d.message.includes('conflicts with existing')
            && conflictMocks.has(d.mock)));
}

function attachFiles(diagnostics: Diagnostic[], mocks: Mock[]): void {
    const files = new Map<string, string>();
    for(const mock of mocks) {
        const key = `${mock.method} ${mock.path}`;
        if(mock.filePath && !files.has(key)) {
            files.set(key, mock.filePath);
        }
    }

    for(const diagnostic of diagnostics) {
        if(!diagnostic.file && diagnostic.mock) {
            diagnostic.file = files.get(diagnostic.mock);
        }
    }
}

function countFiles(diagnostics: Diagnostic[], mocks: Mock[]): number {
    const files = new Set<string>();
    mocks.forEach(mock => mock.filePath && files.add(mock.filePath));
    diagnostics.forEach(diagnostic => diagnostic.file && files.add(diagnostic.file));
    return files.size;
}
