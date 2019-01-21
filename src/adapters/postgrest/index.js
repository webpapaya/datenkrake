import axios from 'axios';

export const buildConnection = ({ baseURL }) => axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    Prefer: 'return=representation,count=exact',
  },
});

export const setAuthentication = (connection, token) => {
  connection.defaults.headers.Authorization = token // eslint-disable-line no-param-reassign
    ? `Bearer ${token}`
    : null;
};

export const unsetAuthentication = connection => setAuthentication(connection, null);

export { default as buildRepository } from './build-repository';
