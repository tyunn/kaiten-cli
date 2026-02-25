import { api } from './client.js';

export async function getColumns(boardId) {
  const response = await api.get(`/boards/${boardId}/columns`);
  return response.data;
}

export async function getColumn(columnId) {
  const response = await api.get(`/columns/${columnId}`);
  return response.data;
}

export async function getBoard(boardId) {
  const response = await api.get(`/boards/${boardId}`);
  return response.data;
}

export async function getBoards(spaceId) {
  const response = await api.get(`/spaces/${spaceId}/boards`);
  return response.data;
}
