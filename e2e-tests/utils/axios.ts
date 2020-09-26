import axios from 'axios';

export const content = axios.create({
    baseURL: 'http://localhost:8082'
});

export const proxy = axios.create({
    baseURL: 'http://localhost:8081'
});

export const api = axios.create({
    baseURL: 'http://localhost:8080'
});
