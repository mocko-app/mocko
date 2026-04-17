import * as Joi from 'joi';
import { mergeRecords } from "../../utils/utils";
import { Data } from "./data";
import { Host, hostFromConfig, validateHost } from "./host";
import { Mock, mockFromConfig, validateMock } from "./mock";

export type MockoDefinition = {
    mocks: Mock[],
    hosts: Host[],
    data?: Data,
};

const definitionSchema = Joi.object({
    mocks: Joi.array().items(Joi.any()).required(),
    hosts: Joi.array().items(Joi.any()).required(),
    data: Joi.object().pattern(Joi.string(), Joi.string()).optional(),
});

export const definitionFromConfig = (config: any, onMockError?: (error: Error) => void): MockoDefinition => {
    const mocks = Object.entries(mergeRecords(config.mock || []))
        .flatMap(([req, resList]) => resList.map(res => [req, res]))
        .flatMap(([req, res]) => {
            try {
                return [mockFromConfig(req, res)];
            } catch(e) {
                onMockError?.(e);
                return [];
            }
        });

    const data = config.data && Object.entries(mergeRecords(config.data))
        .map(([key, values]) => ({key, value: mergeRecords(values)}))
        .reduce((acc, {key, value}) => ({ ...acc, [key]: value}), {});

    const hosts = Object.entries(mergeRecords(config.host || []))
        .map(([name, data]) => hostFromConfig(name, data));

    return { mocks, data, hosts };
};

export function validateDefinition(definition: unknown): MockoDefinition {
    const validation = definitionSchema.validate(definition);
    if(validation.error) {
        throw new Error(validation.error.message);
    }

    return {
        mocks: validation.value.mocks.map(validateMock),
        hosts: validation.value.hosts.map(validateHost),
        data: validation.value.data,
    };
}
