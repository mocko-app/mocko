export const sleep = (time: number) => new Promise(resolve => setTimeout(resolve, time));

export const ignoreErrors = () => (_ignored: any): void => {
    // noop: Errors will be ignored
};
