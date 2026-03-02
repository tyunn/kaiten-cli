import { api } from './client.js';
import { getCard } from './cards.js';

export async function getSubtasks(cardId) {
  const response = await api.get(`/cards/${cardId}/children`);
  return response.data;
}

export async function getAllSubtasks(cardId) {
  const response = await api.get(`/cards/${cardId}/children?all=true`);
  return response.data;
}

export async function getParent(cardId) {
  const card = await getCard(cardId);
  if (card.parent_link_ids && card.parent_link_ids.length > 0) {
    return await getCard(card.parent_link_ids[0]);
  }
  if (card.parents && card.parents.length > 0) {
    return card.parents[0];
  }
  return null;
}

export async function createSubtask(cardId, title, position = 0) {
  const parentCard = await getCard(cardId);
  const response = await api.post(`/cards`, {
    title,
    board_id: parentCard.board_id,
    column_id: parentCard.column_id,
    position
  });
  const newCard = response.data;
  await attachToParent(newCard.id, cardId, position);
  return newCard;
}

export async function updateSubtask(subtaskId, data) {
  const response = await api.patch(`/cards/${subtaskId}`, data);
  return response.data;
}

export async function deleteSubtask(subtaskId) {
  await api.delete(`/cards/${subtaskId}`);
}

export async function toggleSubtaskComplete(subtaskId, isComplete = true) {
  const response = await api.patch(`/cards/${subtaskId}`, {
    condition: isComplete ? 3 : 1
  });
  return response.data;
}

export async function attachToParent(cardId, parentId, position = 0) {
  const response = await api.post(`/cards/${parentId}/children`, {
    card_id: cardId
  });
  return response.data;
}

export async function detachFromParent(cardId) {
  const parent = await getParent(cardId);
  if (!parent) {
    throw new Error('Card has no parent');
  }
  const response = await api.delete(`/cards/${parent.id}/children/${cardId}`);
  return response.data;
}
