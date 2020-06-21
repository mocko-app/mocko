import * as axios from 'axios';

export const SPACES = {
    xs:   '0.25rem',
    s:    '0.5rem',
    m:    '1rem',
    l:    '1.5rem',
    xl:   '2rem',
    xxl:  '2.5rem',
    none: '0',
};

export function decodeSpacing(spacing) {
    return Object.entries(spacing)
        .map(([key, value]) => [key, SPACES[value]])
        .reduce((acc, [k, v]) => ({...acc, [k]: v}), {});
}

export const sleep = time => new Promise(resolve => setTimeout(resolve, time));

export const trace = tag => x => console.log(tag, x) || x;

export const client = axios.create({
    baseURL: 'http://localhost:8080/'
});
