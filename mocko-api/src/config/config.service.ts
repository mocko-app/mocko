import * as dotenv from 'dotenv';
import * as fs from 'fs';
import {CONFIG_PATH, DEFAULT_CONFIG_PATH} from "./config.constants";
import {RedisOptions} from "ioredis";

export class ConfigService {
    private readonly config: Record<string, string>;

    constructor(configPath: string, defaultConfigPath: string) {
        this.assertConfig(configPath, defaultConfigPath);
        this.config = { ...this.fromFile(configPath), ...process.env };
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

    getArray(key: string): string[] {
        const value = this.get(key);
        const obj = this.optionalParse(value);

        if (!Array.isArray(obj)) {
            throw new TypeError(`The config ${key} isn't a valid JSON array`);
        }

        return obj;
    }

    getRedisConfig(): RedisOptions {
        return {
            port: this.getNumber('REDIS_PORT'),
            host: this.get('REDIS_HOST'),
            password: this.get('REDIS_PASSWORD'),
            db: this.getNumber('REDIS_DATABASE'),
            keyPrefix: this.get('REDIS_PREFIX'),
            lazyConnect: true,
        };
    }

    private getOptional(key: string): string | undefined {
        return this.config[key];
    }

    private fromFile(path: string): Record<string, string> {
        return dotenv.parse(fs.readFileSync(path));
    }

    private assertConfig(configPath: string, defaultConfigPath: string) {
        if (fs.existsSync(configPath)) {
            return;
        }

        fs.copyFileSync(defaultConfigPath, configPath);
    }

    private optionalParse(str: string): any {
        try {
            return JSON.parse(str);
        } catch (e) {
            return null;
        }
    }

}

export const configService = new ConfigService(CONFIG_PATH, DEFAULT_CONFIG_PATH);
