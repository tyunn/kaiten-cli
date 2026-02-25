import { api } from './client.js';

export async function getCards(spaceId, boardId = null) {
  let url = `/spaces/${spaceId}/cards`;
  if (boardId) {
    url += `?board_id=${boardId}`;
  }
  const response = await api.get(url);
  return response.data;
}

export async function getCard(cardId) {
  const response = await api.get(`/cards/${cardId}`);
  return response.data;
}

export async function createCard(data) {
  const response = await api.post('/cards', data);
  return response.data;
}

export async function updateCard(cardId, data) {
  const response = await api.patch(`/cards/${cardId}`, data);
  return response.data;
}

export async function deleteCard(cardId) {
  await api.delete(`/cards/${cardId}`);
}

export async function moveCard(cardId, columnId, laneId = null) {
  const data = { column_id: columnId };
  if (laneId) data.lane_id = laneId;
  const response = await api.patch(`/cards/${cardId}`, data);
  return response.data;
}

export async function assignCard(cardId, userId) {
  const response = await api.patch(`/cards/${cardId}`, {
    members: [{ id: userId }]
  });
  return response.data;
}

export async function unassignCard(cardId, userId) {
  const response = await api.patch(`/cards/${cardId}`, {
    members_remove: [userId]
  });
  return response.data;
}

export async function archiveCard(cardId) {
  const response = await api.patch(`/cards/${cardId}`, {
    condition: 2
  });
  return response.data;
}

export async function unarchiveCard(cardId) {
  const response = await api.patch(`/cards/${cardId}`, {
    condition: 1
  });
  return response.data;
}

export async function addTag(cardId, tagName) {
  const response = await api.patch(`/cards/${cardId}`, {
    tags: [{ name: tagName }]
  });
  return response.data;
}

export async function removeTag(cardId, tagName) {
  const response = await api.patch(`/cards/${cardId}`, {
    tags_remove: [tagName]
  });
  return response.data;
}

export async function setTags(cardId, tagNames) {
  const tags = tagNames.map(name => ({ name }));
  const response = await api.patch(`/cards/${cardId}`, {
    tags
  });
  return response.data;
}
