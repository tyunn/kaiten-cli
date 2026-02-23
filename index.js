#!/usr/bin/env node

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load config from .env
const envPath = path.join(__dirname, '.env');
const envConfig = fs.readFileSync(envPath, 'utf8')
  .split('\n')
  .filter(line => line.trim() && !line.startsWith('#'))
  .reduce((acc, line) => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
      acc[key.trim()] = valueParts.join('=').trim();
    }
    return acc;
  }, {});

const API_URL = envConfig.KAITEN_API_URL;
const API_TOKEN = envConfig.KAITEN_API_TOKEN;
const DEFAULT_SPACE_ID = envConfig.KAITEN_DEFAULT_SPACE_ID;

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Helper functions for optimized data fetching
async function getCards(spaceId = DEFAULT_SPACE_ID) {
  const response = await api.get(`/spaces/${spaceId}/cards`);
  return response.data;
}

async function getCard(cardId) {
  const response = await api.get(`/cards/${cardId}`);
  return response.data;
}

// Optimized card data (only essential fields)
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
        const cards = await getCards();
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
        const card = await getCard(cardId);
        const optimizedCard = optimizeCardDetails(card);
        console.log(JSON.stringify(optimizedCard, null, 2));
        break;

      case 'simple':
        // Simple human-readable format
        const simpleCards = await getCards();
        console.log(`📋 Задачи в пространстве "${DEFAULT_SPACE_ID}":\n`);
        
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
        // Simple format for specific card
        const simpleCardId = args[1];
        if (!simpleCardId) {
          console.error('Error: Card ID required');
          process.exit(1);
        }
        const detailedCard = await getCard(simpleCardId);
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

      case 'help':
      case '--help':
      case '-h':
        console.log(`
Kaiten CLI Optimized - Оптимизированная командная строка для Kaiten API

Использование:
  node kaiten-cli-optimized.js <command> [args]

Команды:
  cards, list-cards          - Список карточек (оптимизированный JSON)
  card, get-card <id>       - Детали карточки (оптимизированный JSON)
  simple                     - Список карточек (человекочитаемый формат)
  card-simple <id>           - Детали карточки (человекочитаемый формат)
  help                       - Эта справка

Оптимизация:
  - Удалены лишние поля и вложенные объекты
  - Сокращены данные о пользователе (только имя)
  - Форматирование времени в часы
  - Обрезка длинных описаний
  - Сокращение дат до формата YYYY-MM-DD

Примеры:
  node kaiten-cli-optimized.js cards
  node kaiten-cli-optimized.js card 45791547
  node kaiten-cli-optimized.js simple
  node kaiten-cli-optimized.js card-simple 45791547
        `);
        break;

      default:
        console.error(`Unknown command: ${command}`);
        console.log('Run "node kaiten-cli-optimized.js help" for usage information');
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

main();
