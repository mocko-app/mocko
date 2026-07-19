import * as Joi from 'joi';
import { mergeRecords } from "../../utils/utils";
import { Callback, callbackFromConfig, validateCallback } from "./callback";
import { Data, DataEntry } from "./data";
import { Host, hostFromConfig, validateHost } from "./host";
import { Mock, mockFromConfig, validateMock } from "./mock";

export type MockoDefinition = {
    mocks: Mock[],
    hosts: Host[],
    callbacks: Callback[],
    data?: Data,
};

const definitionSchema = Joi.object({
    mocks: Joi.array().items(Joi.any()).required(),
    hosts: Joi.array().items(Joi.any()).required(),
    callbacks: Joi.array().items(Joi.any()).optional().default([]),
    data: Joi.object()
        .pattern(
            Joi.string(),
            Joi.object().pattern(Joi.string(), Joi.any()),
        )
        .optional(),
});

export const definitionFromConfig = (
    config: any,
    onMockError?: (error: Error) => void,
    onHostError?: (error: Error) => void,
    onCallbackError?: (error: Error) => void,
): MockoDefinition => {
    const mergedMocks = mergeRecords<any>(config.mock || []);
    const mocks = Object.entries(mergedMocks)
        .flatMap(([req, resList]) => resList.map(res => [req, res]))
        .flatMap(([req, res]) => {
            try {
                return [mockFromConfig(req, res)];
            } catch(e) {
                onMockError?.(e);
                return [];
            }
        });

    const mergedDataBlocks = mergeRecords<DataEntry[]>(config.data || []);
    const data = config.data && Object.fromEntries(
        Object.entries(mergedDataBlocks)
            .map(([key, values]) => [key, mergeRecords(values)]),
    ) as Data;

    const hosts = Object.entries(mergeRecords(config.host || []))
        .flatMap(([name, data]) => {
            try {
                return [hostFromConfig(name, data)];
            } catch(e) {
                if(!onHostError) {
                    throw e;
                }

                onHostError(e);
                return [];
            }
        });

    const callbacks = Object.entries(mergeRecords(config.callback || []))
        .flatMap(([slug, data]) => {
            try {
                return [callbackFromConfig(slug, data)];
            } catch(e) {
                if(!onCallbackError) {
                    throw e;
                }

                onCallbackError(e);
                return [];
            }
        });

    return { mocks, data, hosts, callbacks };
};

export function validateDefinition(definition: unknown): MockoDefinition {
    const validation = definitionSchema.validate(definition);
    if(validation.error) {
        throw new Error(validation.error.message);
    }

    return {
        mocks: validation.value.mocks.map(validateMock),
        hosts: validation.value.hosts.map(validateHost),
        callbacks: validation.value.callbacks.map(validateCallback),
        data: validation.value.data,
    };
}
