import * as dotenv from 'dotenv';
import * as fs from 'fs';
import {CONFIG_PATH, DEFAULT_CONFIG_PATH} from "./config.constants";
import {Provider} from "../utils/decorators/provider";
import {RedisOptions} from "ioredis";

const debug = require('debug')('mocko:proxy:config');

@Provider()
export class ConfigProvider {
    private readonly config: Record<string, string>;

    constructor(configPath: string, defaultConfigPath: string) {
        const path = this.assertConfig(configPath, defaultConfigPath);
        this.config = { ...this.fromFile(path), ...process.env };
    }

    get(key: string): string {
        const value = this.getOptional(key);
        if (typeof value === 'undefined') {
            throw new Error(`Missing ${key} config`);
        }

        return value;
    }

    getNumber(key: string): number {
        const value = Number(this.get(key));
        if (isNaN(value)) {
            throw new TypeError(`The config ${key} isn't a number`);
        }

        return value;
    }

    getBoolean(key: string): boolean {
        return this.get(key).toLowerCase() === 'true';
    }

    getRedisConfig(): RedisOptions {
        return {
            port: this.getNumber('REDIS_PORT'),
            host: this.get('REDIS_HOST'),
            password: this.get('REDIS_PASSWORD'),
            db: this.getNumber('REDIS_DATABASE'),
            keyPrefix: this.get('REDIS_PREFIX'),
        };
    }

    private getOptional(key: string): string | undefined {
        return this.config[key];
    }

    private fromFile(path: string): Record<string, string> {
        return dotenv.parse(fs.readFileSync(path));
    }

    private assertConfig(configPath: string, defaultConfigPath: string): string {
        if (fs.existsSync(configPath)) {
            return configPath;
        }

        try {
            fs.copyFileSync(defaultConfigPath, configPath);
            return configPath;
        } catch(e) {
            debug('Failed to copy default config to .env, using the default file');
            return defaultConfigPath;
        }
    }

}

export const configProvider = new ConfigProvider(CONFIG_PATH, DEFAULT_CONFIG_PATH);
