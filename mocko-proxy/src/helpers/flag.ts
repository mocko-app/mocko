import { wait } from "@mocko/resync";
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

export const getFlag = (flagService: FlagService) => (key: any): any => {
    validateFlagKey(key);
    return wait(() => flagService.getFlag(key));
};

export const setFlag = (flagService: FlagService) => (key: any, value: any): void => {
    validateFlagKey(key);

    wait(() => flagService.setFlag(key, value === void 0 ? null : value));
};

export const delFlag = (flagService: FlagService) => (key: any): void => {
    validateFlagKey(key);

    wait(() => flagService.delFlag(key));
};

export const hasFlag = (flagService: FlagService) => function (key: any, options): void {
    validateFlagKey(key);

    const hasFlag = wait(() => flagService.hasFlag(key));
    if(hasFlag) {
        return options.fn(this);
    } else if(typeof options.inverse === 'function') {
        return options.inverse(this);
    }
};
