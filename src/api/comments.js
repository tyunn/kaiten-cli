import { api } from './client.js';

export async function getComments(cardId) {
  const response = await api.get(`/cards/${cardId}/comments`);
  return response.data;
}

export async function getComment(commentId) {
  const response = await api.get(`/comments/${commentId}`);
  return response.data;
}

export async function createComment(cardId, text, parentId = null) {
  const response = await api.post('/comments', {
    card_id: cardId,
    text,
    parent_id: parentId
  });
  return response.data;
}

export async function updateComment(commentId, text) {
  const response = await api.patch(`/comments/${commentId}`, {
    text
  });
  return response.data;
}

export async function deleteComment(commentId) {
  await api.delete(`/comments/${commentId}`);
}
