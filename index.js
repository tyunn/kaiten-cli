#!/usr/bin/env node

import { createSDK } from './src/sdk.js';
import * as api from './src/api/index.js';
import { getConfig } from './src/utils/config.js';

const config = getConfig();
const sdk = createSDK();

function optimizeCard(card) {
  return {
    id: card.id,
    title: card.title,
    status: card.condition === 1 ? 'Активна' : 'Архивная',
    board: card.board?.title || 'Неизвестно',
    column: card.column?.title || 'Неизвестно',
    owner: card.owner?.full_name || 'Не назначен',
    size: card.size || null,
    tags: card.tags?.map(t => t.name) || [],
    planned_start: card.planned_start ? card.planned_start.split('T')[0] : null,
    planned_end: card.planned_end ? card.planned_end.split('T')[0] : null,
    time_spent: card.time_spent_sum ? Math.round(card.time_spent_sum / 60 * 10) / 10 + 'h' : null
  };
}

function optimizeCardMinimal(card) {
  return {
    i: card.id,
    t: card.title,
    c: card.column?.title || '?',
    tg: card.tags?.map(t => t.name) || []
  };
}

function optimizeCardMinimalList(cards) {
  return cards.map(c => ({
    i: c.id,
    t: c.title,
    c: c.column?.title || '?',
    tg: c.tags?.map(t => t.name) || []
  }));
}

// Optimized detailed card data
function optimizeCardDetails(card) {
  return {
    id: card.id,
    title: card.title,
    status: card.condition === 1 ? 'Активна' : 'Архивная',
    state: {
      board: card.board?.title || 'Неизвестно',
      column: card.column?.title || 'Неизвестно',
      lane: card.lane?.title || ''
    },
    owner: card.owner?.full_name || 'Не назначен',
    members: card.members?.map(m => m.full_name) || [],
    size: card.size,
    tags: card.tags?.map(t => ({ name: t.name, color: t.color })) || [],
    planning: {
      start: card.planned_start ? card.planned_start.split('T')[0] : null,
      end: card.planned_end ? card.planned_end.split('T')[0] : null
    },
    time: {
      spent: card.time_spent_sum ? Math.round(card.time_spent_sum / 60 * 10) / 10 + 'h' : null,
      blocked: card.time_blocked_sum || 0
    },
    dependencies: {
      predecessors: card.plannedPredecessors?.map(p => ({
        id: p.id,
        title: p.title,
        status: p.state === 3 ? 'Готово' : p.state === 2 ? 'В работе' : 'Ожидание'
      })) || []
    },
    comments: card.comments_total || 0,
    description: card.description ? card.description.substring(0, 500) + (card.description.length > 500 ? '...' : '') : ''
  };
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];

async function main() {
  try {
    switch(command) {
      case 'cards':
      case 'list-cards':
        const cards = await sdk.getCards();
        const optimizedCards = cards.map(optimizeCard);
        console.log(JSON.stringify(optimizedCards, null, 2));
        break;

      case 'card':
      case 'get-card':
        const cardId = args[1];
        if (!cardId) {
          console.error('Error: Card ID required');
          process.exit(1);
        }
        const card = await sdk.getCard(cardId);
        const optimizedCard = optimizeCardDetails(card);
        console.log(JSON.stringify(optimizedCard, null, 2));
        break;

      case 'simple':
        const simpleCards = await sdk.getCards();
        console.log(`📋 Задачи в пространстве "${config.defaultSpaceId}":\n`);
        
        simpleCards.forEach((card, index) => {
          const status = card.condition === 1 ? '✅' : '🗄️';
          const column = card.column?.title || 'Неизвестно';
          const board = card.board?.title || 'Неизвестно';
          const owner = card.owner?.full_name || 'Не назначен';
          
          console.log(`${index + 1}. ${status} [${card.id}] ${card.title}`);
          console.log(`   📁 ${board} → ${column} | 👤 ${owner}`);
          if (card.size) console.log(`   ⏱️ Размер: ${card.size}`);
          console.log();
        });
        console.log(`Всего задач: ${simpleCards.length}`);
        break;

      case 'card-simple':
        const simpleCardId = args[1];
        if (!simpleCardId) {
          console.error('Error: Card ID required');
          process.exit(1);
        }
        const detailedCard = await sdk.getCard(simpleCardId);
        const optimized = optimizeCardDetails(detailedCard);
        
        console.log(`📋 ${optimized.title}`);
        console.log(`ID: ${optimized.id}`);
        console.log(`Статус: ${optimized.status}`);
        console.log(`📁 ${optimized.state.board} → ${optimized.state.column}`);
        console.log(`👤 Владелец: ${optimized.owner}`);
        if (optimized.size) console.log(`⏱️ Размер: ${optimized.size}`);
        if (optimized.planning.start) {
          console.log(`📅 План: ${optimized.planning.start} - ${optimized.planning.end}`);
        }
        if (optimized.time.spent) console.log(`⏰ Затрачено: ${optimized.time.spent}`);
        if (optimized.tags.length > 0) {
          console.log(`🏷️ Теги: ${optimized.tags.map(t => t.name).join(', ')}`);
        }
        if (optimized.dependencies.predecessors.length > 0) {
          console.log(`🔗 Зависит от: ${optimized.dependencies.predecessors.map(p => p.title).join(', ')}`);
        }
        if (optimized.comments > 0) {
          console.log(`💬 Комментариев: ${optimized.comments}`);
        }
        if (optimized.description) {
          console.log(`\n📝 Описание:\n${optimized.description}`);
        }
        break;

      case 'create':
        const createData = JSON.parse(args[1] || '{}');
        const createdCard = await sdk.createCard(createData);
        console.log(JSON.stringify(createdCard, null, 2));
        break;

      case 'update':
        const updateCardId = args[1];
        const updateData = JSON.parse(args[2] || '{}');
        const updatedCard = await sdk.updateCard(updateCardId, updateData);
        console.log(JSON.stringify(updatedCard, null, 2));
        break;

      case 'delete':
        const deleteCardId = args[1];
        await sdk.deleteCard(deleteCardId);
        console.log('Card deleted successfully');
        break;

      case 'move':
        const moveCardId = args[1];
        const columnId = args[2];
        const laneId = args[3] || null;
        const movedCard = await sdk.moveToColumn(moveCardId, columnId, laneId);
        console.log(JSON.stringify(movedCard, null, 2));
        break;

      case 'assign':
        const assignCardId = args[1];
        const userId = args[2];
        const assignedCard = await sdk.assignTo(assignCardId, userId);
        console.log(JSON.stringify(assignedCard, null, 2));
        break;

      case 'subtask':
        const subTaskCmd = args[1];
        if (subTaskCmd === 'create') {
          const parentCardId = args[2];
          const subtaskTitle = args[3];
          const subtask = await sdk.createSubtask(parentCardId, subtaskTitle);
          console.log(JSON.stringify(subtask, null, 2));
        } else if (subTaskCmd === 'list') {
          const parentCardId = args[2];
          const subtasks = await sdk.getSubtasks(parentCardId);
          console.log(JSON.stringify(subtasks, null, 2));
        }
        break;

      case 'comment':
        const commentCmd = args[1];
        if (commentCmd === 'add') {
          const commentCardId = args[2];
          const commentText = args[3];
          const comment = await sdk.addComment(commentCardId, commentText);
          console.log(JSON.stringify(comment, null, 2));
        } else if (commentCmd === 'list') {
          const commentCardId = args[2];
          const comments = await sdk.getComments(commentCardId);
          console.log(JSON.stringify(comments, null, 2));
        }
        break;

      case 'board':
        const spaceId = args[1] || config.defaultSpaceId;
        const boards = await sdk.getBoards(spaceId);
        console.log(JSON.stringify(boards, null, 2));
        break;

      case 'column':
        const boardId = args[1];
        const columns = await sdk.getColumns(boardId);
        console.log(JSON.stringify(columns, null, 2));
        break;

      case 'user':
        const userQuery = args[1];
        if (userQuery) {
          const user = await sdk.findUser(userQuery);
          console.log(JSON.stringify(user, null, 2));
        } else {
          const users = await sdk.getUsers();
          console.log(JSON.stringify(users, null, 2));
        }
        break;

      case 'tag':
        const tagCmd = args[1];
        if (tagCmd === 'add') {
          const tagCardId = args[2];
          const tagName = args[3];
          const taggedCard = await sdk.addTag(tagCardId, tagName);
          console.log(JSON.stringify(taggedCard, null, 2));
        } else if (tagCmd === 'remove') {
          const tagCardId = args[2];
          const tagName = args[3];
          const untaggedCard = await sdk.removeTag(tagCardId, tagName);
          console.log(JSON.stringify(untaggedCard, null, 2));
        } else if (tagCmd === 'list') {
          const cards = await sdk.getCards();
          cards.forEach(card => {
            const tags = sdk.getTags(card);
            if (tags.length > 0) {
              console.log(`[${card.id}] ${card.title}: ${tags.join(', ')}`);
            }
          });
        } else if (tagCmd === 'filter') {
          const tagName = args[2];
          const filteredCards = await sdk.getCardsWithTag(tagName);
          const useMinimal = args.includes('--minimal') || args.includes('-m');
          if (useMinimal) {
            console.log(JSON.stringify(optimizeCardMinimalList(filteredCards), null, 0));
          } else {
            console.log(JSON.stringify(filteredCards.map(c => ({
              id: c.id,
              title: c.title,
              tags: sdk.getTags(c)
            })), null, 2));
          }
        }
        break;

      case 'find':
        const findTag = args[1];
        const boardFilter = args.find(arg => arg.startsWith('--board='));
        if (findTag) {
          let foundCards;
          if (boardFilter) {
            const boardValue = boardFilter.split('=')[1];
            let boardId;
            if (!isNaN(boardValue)) {
              boardId = parseInt(boardValue);
            } else {
              boardId = await sdk.getBoardId(boardValue);
            }
            foundCards = await sdk.getCards(null, boardId);
            foundCards = foundCards.filter(card => {
              const cardTags = card.tags?.map(t => t.name) || [];
              return cardTags.includes(findTag);
            });
          } else {
            foundCards = await sdk.getCardsWithTag(findTag);
          }
          const useMinimalFind = args.includes('--minimal') || args.includes('-m');
          if (useMinimalFind) {
            console.log(JSON.stringify(optimizeCardMinimalList(foundCards), null, 0));
          } else {
            foundCards.forEach(c => {
              console.log(`[${c.id}] ${c.title}`);
            });
          }
        }
        break;

      case 'help':
      case '--help':
      case '-h':
        console.log(`
Kaiten CLI - Полнофункциональный CLI для Kaiten API

Использование:
  kaiten <command> [args]

Команды для карточек:
  cards                            - Список карточек (JSON)
  card <id>                        - Детали карточки (JSON)
  simple                           - Список карточек (человекочитаемый)
  card-simple <id>                 - Детали карточки (человекочитаемый)
  create '<json>'                  - Создать карточку
  update <id> '<json>'             - Обновить карточку
  delete <id>                      - Удалить карточку
  move <id> <column_id> [lane_id]  - Переместить карточку
  assign <id> <user_id>            - Назначить исполнителя

Команды для подзадач:
  subtask create <parent_id> <title>  - Создать подзадачу
  subtask list <parent_id>            - Список подзадач

Команды для комментариев:
  comment add <card_id> <text>   - Добавить комментарий
  comment list <card_id>          - Список комментариев

Команды для навигации:
  board [space_id]                - Список досок
  column <board_id>               - Список колонок
  user [query]                    - Найти пользователя

Команды для меток:
  tag add <card_id> <tag_name>   - Добавить метку
  tag remove <card_id> <tag_name> - Удалить метку
  tag list                       - Список карточек с метками
  tag filter <tag_name> [-m]     - Фильтр по метке (-m = минимальный JSON)

Команды для поиска:
  find <tag_name> [-m] [--board=<id|name>]  - Поиск по метке (-m = минимальный JSON, --board = фильтр по ID или названию доски)

Флаги оптимизации:
  --minimal, -m                  - Минимальный JSON (без отступов, короткие ключи)

Примеры:
  kaiten cards
  kaiten create '{"title":"Новая задача","boardId":123,"columnId":456}'
  kaiten move 789 456
  kaiten comment add 789 "Текст комментария"
        `);
        break;

      default:
        console.error(`Unknown command: ${command}`);
        console.log('Run "kaiten help" for usage information');
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

main();
