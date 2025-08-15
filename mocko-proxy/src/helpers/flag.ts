import { FlagService } from "src/api/flag/flag.service";

function validateFlagKey(key: any): void {
    if(typeof key !== 'string') {
        throw new TypeError('Flag keys must be strings');
    }

    if(!key.length) {
        throw new TypeError('Flag keys cannot be empty');
    }

    if(/:(:|$)/.test(key)) {
        throw new TypeError(`The flag '${key}' contains an empty section (either by finishing with or having two consecutive colons)`);
    }
}

function validateFlagExpiration(ttlMillis: number): void {
    if(typeof ttlMillis !== 'number') {
        throw new TypeError('Flag expiration must be a number');
    }

    if(ttlMillis <= 0) {
        throw new TypeError('Flag expiration must be a positive number');
    }
}

export const getFlag = (flagService: FlagService) => async (key: any): Promise<any> => {
    validateFlagKey(key);
    return await flagService.getFlag(key);
};

export const setFlag = (flagService: FlagService) => async function (key: any, value: any, ttlMillis: number): Promise<void> {
    validateFlagKey(key);

    if (ttlMillis) {
        validateFlagExpiration(ttlMillis);
        await flagService.setFlag(key, value ?? null, ttlMillis);
    } else {
        await flagService.setFlag(key, value ?? null);
    }
};

export const delFlag = (flagService: FlagService) => async (key: any): Promise<void> => {
    validateFlagKey(key);

    await flagService.delFlag(key);
};

export const hasFlag = (flagService: FlagService) => async (key: any): Promise<boolean> => {
    validateFlagKey(key);

    return await flagService.hasFlag(key);
};
