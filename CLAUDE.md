# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Команды

```bash
npm install              # Установка зависимостей
npm start <command>      # Запуск CLI
npm install -g .         # Глобальная установка (команда `kaiten`)
```

CLI команды:
```bash
kaiten simple                           # Список карточек (человекочитаемый)
kaiten card-simple <id>                 # Детали карточки (человекочитаемый)
kaiten cards                            # Список карточек (JSON)
kaiten card <id>                        # Детали карточки (JSON)
kaiten create '{"title":"...","boardId":123,"columnId":456}'  # Создать
kaiten update <id> '{"title":"..."}'    # Обновить
kaiten delete <id>                     # Удалить
kaiten move <id> <column_id>           # Переместить
kaiten assign <id> <user_id>           # Назначить исполнителя
kaiten subtask create <parent> <title> # Создать подзадачу
kaiten comment add <card_id> <text>    # Добавить комментарий
kaiten board [space_id]                # Список досок
kaiten column <board_id>               # Список колонок
kaiten user [query]                    # Найти пользователя
```

## Архитектура

### SDK для проектов

В других проектах можно использовать SDK:

```javascript
import { createSDK } from 'kaiten-cli';

const sdk = createSDK();

// Получить карточку
const card = await sdk.getCard(12345);

// Создать карточку
const newCard = await sdk.createCard({
  title: 'Новая задача',
  boardId: 123,
  columnId: 456,
  description: 'Описание'
});

// Создать подзадачи
await sdk.createTaskFlow(parentCardId, [
  { title: 'Подзадача 1', description: '...' },
  { title: 'Подзадача 2', description: '...' }
]);

// Переместить карточку
await sdk.moveToColumn(cardId, columnId);

// Добавить комментарий
await sdk.addComment(cardId, 'Текст комментария');
```

### Структура

- `src/sdk.js` - Высокоуровневый SDK для работы с Kaiten
- `src/api/` - Низкоуровневые функции API
  - `cards.js` - CRUD карточек, перемещение, назначение
  - `subtasks.js` - Подзадачи
  - `comments.js` - Комментарии
  - `columns.js` - Доски и колонки
  - `users.js` - Пользователи
- `src/utils/config.js` - Загрузка конфигурации из .env

### Конфигурация

`.env` файл должен содержать:
```
KAITEN_API_URL=https://domain.kaiten.ru/api/latest
KAITEN_API_TOKEN=your_token_here
KAITEN_DEFAULT_SPACE_ID=12345
```

SDK ищет `.env` в текущей директории проекта, затем в директории пакета.

### Оптимизация данных

CLI оптимизирует вывод для экономии токенов:
- Удалены base64 аватары
- Обрезаны описания до 500 символов
- Формат дат YYYY-MM-DD
- Только основные поля карточек

