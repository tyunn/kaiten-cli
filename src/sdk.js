import * as api from './api/index.js';
import * as gitApi from './api/git.js';
import { getConfig } from './utils/config.js';

export class KaitenSDK {
  constructor(config = null) {
    if (config) {
      this.config = config;
    } else {
      this.config = getConfig();
    }
  }

  _validateSpaceId(spaceId) {
    if (!this.config.allowedSpaceIds || !spaceId) return true;
    if (!this.config.allowedSpaceIds.includes(spaceId)) {
      throw new Error(`Space ID ${spaceId} is not in allowed list`);
    }
    return true;
  }

  _validateBoardId(boardId) {
    if (!this.config.allowedBoardIds || !boardId) return true;
    if (!this.config.allowedBoardIds.includes(boardId)) {
      throw new Error(`Board ID ${boardId} is not in allowed list`);
    }
    return true;
  }

  async _validateCardId(cardId) {
    if (!this.config.allowedBoardIds || !cardId) return true;
    try {
      const card = await api.getCard(cardId);
      if (card?.board_id && !this.config.allowedBoardIds.includes(card.board_id)) {
        throw new Error(`Card ${cardId} belongs to board ${card.board_id} which is not in allowed list`);
      }
    } catch (error) {
      if (error.message.includes('not in allowed list')) {
        throw error;
      }
    }
    return true;
  }

  getCards(spaceId = null, boardId = null) {
    const id = spaceId || this.config.defaultSpaceId;
    this._validateSpaceId(id);
    if (boardId) {
      this._validateBoardId(boardId);
      return api.getCards(id, boardId);
    }
    return api.getCards(id);
  }

  async getSpaces() {
    const spaces = await api.getSpaces();
    if (!this.config.allowedSpaceIds) return spaces;
    return spaces.filter(s => this.config.allowedSpaceIds.includes(s.id));
  }

  async getSpaceId(spaceTitle) {
    const spaces = await api.getSpaces();
    const space = spaces.find(s => s.title === spaceTitle || s.id === spaceTitle);
    if (!space) {
      throw new Error(`Space "${spaceTitle}" not found`);
    }
    return space.id;
  }

  async getBoardId(boardTitle, spaceId = null) {
    const id = spaceId || this.config.defaultSpaceId;
    this._validateSpaceId(id);
    const boards = await api.getBoards(id);
    const board = boards.find(b => b.title === boardTitle || b.id === boardTitle);
    if (!board) {
      throw new Error(`Board "${boardTitle}" not found`);
    }
    return board.id;
  }

  async getCard(cardId) {
    await this._validateCardId(cardId);
    return api.getCard(cardId);
  }

  async createCard({ title, description, boardId, columnId, laneId, tags, size, plannedStart, plannedEnd, parentId = null }) {
    this._validateBoardId(boardId);
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

  async updateCard(cardId, data) {
    await this._validateCardId(cardId);
    return api.updateCard(cardId, data);
  }

  async deleteCard(cardId) {
    await this._validateCardId(cardId);
    return api.deleteCard(cardId);
  }

  async moveToColumn(cardId, columnId, laneId = null) {
    await this._validateCardId(cardId);
    return api.moveCard(cardId, columnId, laneId);
  }

  async assignTo(cardId, userId) {
    await this._validateCardId(cardId);
    return api.assignCard(cardId, userId);
  }

  async unassignFrom(cardId, userId) {
    await this._validateCardId(cardId);
    return api.unassignCard(cardId, userId);
  }

  async archive(cardId) {
    await this._validateCardId(cardId);
    return api.archiveCard(cardId);
  }

  async unarchive(cardId) {
    await this._validateCardId(cardId);
    return api.unarchiveCard(cardId);
  }

  async addTag(cardId, tagName) {
    await this._validateCardId(cardId);
    return api.addTag(cardId, tagName);
  }

  async removeTag(cardId, tagName) {
    await this._validateCardId(cardId);
    return api.removeTag(cardId, tagName);
  }

  async setTags(cardId, tagNames) {
    await this._validateCardId(cardId);
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
    await this._validateCardId(parentId);
    return api.createSubtask(parentId, title, position);
  }

  async getSubtasks(cardId) {
    await this._validateCardId(cardId);
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
    await this._validateCardId(cardId);
    return api.createComment(cardId, text, parentId);
  }

  async getComments(cardId) {
    await this._validateCardId(cardId);
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
    this._validateBoardId(boardId);
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
    if (!id) {
      throw new Error('Space ID is required. Set KAITEN_DEFAULT_SPACE_ID or pass spaceId parameter.');
    }
    this._validateSpaceId(id);
    return api.getBoards(id);
  }

  getColumns(boardId) {
    this._validateBoardId(boardId);
    return api.getColumns(boardId);
  }

  getUsers() {
    return api.getUsers();
  }

  async getCurrentBranch() {
    return gitApi.getCurrentBranch();
  }

  async createGitBranch(cardId, title) {
    const isRepo = await gitApi.isGitRepo();
    if (!isRepo) {
      throw new Error('Not a git repository');
    }
    return gitApi.createBranch(cardId, title);
  }

  async checkoutGitBranch(cardId, title) {
    const isRepo = await gitApi.isGitRepo();
    if (!isRepo) {
      throw new Error('Not a git repository');
    }
    return gitApi.checkoutBranch(cardId, title);
  }

  async commitGit(cardId, message) {
    return gitApi.commitChanges(cardId, message);
  }

  async getGitChanges() {
    return gitApi.getCurrentChanges();
  }

  async getGitStatus() {
    return gitApi.getCurrentChanges();
  }

  async gitAddAll() {
    return gitApi.addAllFiles();
  }

  async gitPush(cardId, title) {
    const isRepo = await gitApi.isGitRepo();
    if (!isRepo) {
      throw new Error('Not a git repository');
    }
    const branchName = await this.createGitBranch(cardId, title);
    return gitApi.pushBranch(branchName);
  }

  async createPullRequest(cardId, title) {
    return gitApi.createPR(cardId, title);
  }
}

export function createSDK(config = null) {
  return new KaitenSDK(config);
}
