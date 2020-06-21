import * as dotenv from 'dotenv';
import * as fs from 'fs';
import {CONFIG_PATH, DEFAULT_CONFIG_PATH} from "./config.constants";
import {Provider} from "../utils/decorators/provider";

@Provider()
export class ConfigProvider {
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

}

export const configProvider = new ConfigProvider(CONFIG_PATH, DEFAULT_CONFIG_PATH);
