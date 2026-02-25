import { api } from './client.js';

export async function getUsers() {
  const response = await api.get('/users');
  return response.data;
}

export async function getUser(userId) {
  const response = await api.get(`/users/${userId}`);
  return response.data;
}

export async function getCurrentUser() {
  const response = await api.get('/users/current');
  return response.data;
}

export async function searchUsers(query) {
  const response = await api.get('/users', {
    params: { search: query }
  });
  return response.data;
}
