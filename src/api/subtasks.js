import { api } from './client.js';

export async function getSubtasks(cardId) {
  const response = await api.get(`/cards/${cardId}/subtasks`);
  return response.data;
}

export async function createSubtask(cardId, title, position = 0) {
  const response = await api.post('/cards', {
    parent_id: cardId,
    title,
    position
  });
  return response.data;
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
