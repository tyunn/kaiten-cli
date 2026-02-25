import * as api from './api/index.js';
import { getConfig } from './utils/config.js';

export class KaitenSDK {
  constructor(config = null) {
    if (config) {
      this.config = config;
    } else {
      this.config = getConfig();
    }
  }

  getCards(spaceId = null, boardId = null) {
    const id = spaceId || this.config.defaultSpaceId;
    if (boardId) {
      return api.getCards(id, boardId);
    }
    return api.getCards(id);
  }

  async getBoardId(boardTitle, spaceId = null) {
    const id = spaceId || this.config.defaultSpaceId;
    const boards = await api.getBoards(id);
    const board = boards.find(b => b.title === boardTitle || b.id === boardTitle);
    if (!board) {
      throw new Error(`Board "${boardTitle}" not found`);
    }
    return board.id;
  }

  getCard(cardId) {
    return api.getCard(cardId);
  }

  async createCard({ title, description, boardId, columnId, laneId, tags, size, plannedStart, plannedEnd, parentId = null }) {
    const data = {
      title,
      board_id: boardId,
      column_id: columnId
    };
    
    if (description) data.description = description;
    if (laneId) data.lane_id = laneId;
    if (tags) data.tags = tags.map(t => typeof t === 'string' ? { name: t } : t);
    if (size) data.size = size;
    if (plannedStart) data.planned_start = plannedStart;
    if (plannedEnd) data.planned_end = plannedEnd;
    if (parentId) data.parent_id = parentId;

    return api.createCard(data);
  }

  updateCard(cardId, data) {
    return api.updateCard(cardId, data);
  }

  deleteCard(cardId) {
    return api.deleteCard(cardId);
  }

  moveToColumn(cardId, columnId, laneId = null) {
    return api.moveCard(cardId, columnId, laneId);
  }

  assignTo(cardId, userId) {
    return api.assignCard(cardId, userId);
  }

  unassignFrom(cardId, userId) {
    return api.unassignCard(cardId, userId);
  }

  archive(cardId) {
    return api.archiveCard(cardId);
  }

  unarchive(cardId) {
    return api.unarchiveCard(cardId);
  }

  addTag(cardId, tagName) {
    return api.addTag(cardId, tagName);
  }

  removeTag(cardId, tagName) {
    return api.removeTag(cardId, tagName);
  }

  setTags(cardId, tagNames) {
    return api.setTags(cardId, tagNames);
  }

  hasTag(card, tagName) {
    return card.tags?.some(t => t.name === tagName) || false;
  }

  getTags(card) {
    return card.tags?.map(t => t.name) || [];
  }

  async getCardsWithTag(tagName, spaceId = null) {
    const cards = await this.getCards(spaceId);
    return cards.filter(card => this.hasTag(card, tagName));
  }

  async getCardsWithoutTag(tagName, spaceId = null) {
    const cards = await this.getCards(spaceId);
    return cards.filter(card => !this.hasTag(card, tagName));
  }

  async createSubtask(parentId, title, position = 0) {
    return api.createSubtask(parentId, title, position);
  }

  getSubtasks(cardId) {
    return api.getSubtasks(cardId);
  }

  async createTaskFlow(parentCard, tasks) {
    const createdTasks = [];
    
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const subtask = await this.createSubtask(parentCard, task.title, i);
      
      if (task.description) {
        await this.updateCard(subtask.id, { description: task.description });
      }
      
      if (task.tags) {
        await this.updateCard(subtask.id, { 
          tags: task.tags.map(t => typeof t === 'string' ? { name: t } : t)
        });
      }

      createdTasks.push({ ...subtask, ...task });
    }

    return createdTasks;
  }

  async addComment(cardId, text, parentId = null) {
    return api.createComment(cardId, text, parentId);
  }

  getComments(cardId) {
    return api.getComments(cardId);
  }

  async updateComment(commentId, text) {
    return api.updateComment(commentId, text);
  }

  deleteComment(commentId) {
    return api.deleteComment(commentId);
  }

  async getBoardId(spaceId, boardTitle) {
    const boards = await api.getBoards(spaceId);
    const board = boards.find(b => b.title === boardTitle);
    if (!board) {
      throw new Error(`Board "${boardTitle}" not found`);
    }
    return board.id;
  }

  async getColumnId(boardId, columnTitle) {
    const columns = await api.getColumns(boardId);
    const column = columns.find(c => c.title === columnTitle);
    if (!column) {
      throw new Error(`Column "${columnTitle}" not found`);
    }
    return column.id;
  }

  async findUser(query) {
    const users = await api.searchUsers(query);
    if (users.length === 0) {
      throw new Error(`User "${query}" not found`);
    }
    return users[0];
  }

  getCurrentUser() {
    return api.getCurrentUser();
  }

  getBoards(spaceId = null) {
    const id = spaceId || this.config.defaultSpaceId;
    return api.getBoards(id);
  }

  getColumns(boardId) {
    return api.getColumns(boardId);
  }

  getUsers() {
    return api.getUsers();
  }
}

export function createSDK(config = null) {
  return new KaitenSDK(config);
}
