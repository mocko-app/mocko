import { mergeRecords } from "../../utils/utils";
import { Data } from "./data";
import { Host, hostFromConfig } from "./host";
import { Mock, mockFromConfig } from "./mock";

export type MockoDefinition = {
    mocks: Mock[],
    hosts: Host[],
    data?: Data,
};

export const definitionFromConfig = (config: any): MockoDefinition => {
    const mocks = Object.entries(mergeRecords(config.mock || []))
        .flatMap(([req, resList]) => resList.map(res => [req, res]))
        .map(([req, res]) => mockFromConfig(req, res));

    const data = config.data && Object.entries(mergeRecords(config.data))
        .map(([key, values]) => ({key, value: mergeRecords(values)}))
        .reduce((acc, {key, value}) => ({ ...acc, [key]: value}), {});

    const hosts = Object.entries(mergeRecords(config.host || []))
        .map(([name, data]) => hostFromConfig(name, data));

    return { mocks, data, hosts };
};
