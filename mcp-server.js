#!/usr/bin/env node

import { createSDK } from './src/sdk.js';
import { getConfig } from './src/utils/config.js';

const sdk = createSDK();

class MCPServer {
  constructor() {
    this.requestId = 0;
    this.tools = this.registerTools();
  }

  registerTools() {
    return [
      {
        name: 'kaiten_spaces',
        description: 'Get list of available Kaiten spaces',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'kaiten_boards',
        description: 'Get list of boards in a space',
        inputSchema: {
          type: 'object',
          properties: {
            spaceId: {
              type: 'number',
              description: 'Space ID (optional, uses default if not specified)'
            }
          }
        }
      },
      {
        name: 'kaiten_columns',
        description: 'Get list of columns in a board',
        inputSchema: {
          type: 'object',
          properties: {
            boardId: {
              type: 'number',
              description: 'Board ID'
            }
          },
          required: ['boardId']
        }
      },
      {
        name: 'kaiten_cards',
        description: 'Get list of cards (optimized format)',
        inputSchema: {
          type: 'object',
          properties: {
            spaceId: {
              type: 'number',
              description: 'Space ID (optional, uses default if not specified)'
            },
            boardId: {
              type: 'number',
              description: 'Board ID (optional)'
            },
            minimal: {
              type: 'boolean',
              description: 'Return minimal JSON format (token optimized)'
            }
          }
        }
      },
      {
        name: 'kaiten_card',
        description: 'Get card details',
        inputSchema: {
          type: 'object',
          properties: {
            cardId: {
              type: 'number',
              description: 'Card ID'
            },
            simple: {
              type: 'boolean',
              description: 'Return human-readable format'
            }
          },
          required: ['cardId']
        }
      },
      {
        name: 'kaiten_create_card',
        description: 'Create a new card',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Card title'
            },
            boardId: {
              type: 'number',
              description: 'Board ID'
            },
            columnId: {
              type: 'number',
              description: 'Column ID'
            },
            description: {
              type: 'string',
              description: 'Card description (optional)'
            }
          },
          required: ['title', 'boardId', 'columnId']
        }
      },
      {
        name: 'kaiten_update_card',
        description: 'Update a card',
        inputSchema: {
          type: 'object',
          properties: {
            cardId: {
              type: 'number',
              description: 'Card ID'
            },
            data: {
              type: 'string',
              description: 'JSON string with card data to update'
            }
          },
          required: ['cardId', 'data']
        }
      },
      {
        name: 'kaiten_delete_card',
        description: 'Delete a card',
        inputSchema: {
          type: 'object',
          properties: {
            cardId: {
              type: 'number',
              description: 'Card ID'
            }
          },
          required: ['cardId']
        }
      },
      {
        name: 'kaiten_move_card',
        description: 'Move a card to different column',
        inputSchema: {
          type: 'object',
          properties: {
            cardId: {
              type: 'number',
              description: 'Card ID'
            },
            columnId: {
              type: 'number',
              description: 'Target column ID'
            }
          },
          required: ['cardId', 'columnId']
        }
      },
      {
        name: 'kaiten_assign_card',
        description: 'Assign user to card',
        inputSchema: {
          type: 'object',
          properties: {
            cardId: {
              type: 'number',
              description: 'Card ID'
            },
            userId: {
              type: 'number',
              description: 'User ID to assign'
            }
          },
          required: ['cardId', 'userId']
        }
      },
      {
        name: 'kaiten_find_cards',
        description: 'Find cards by tag (token optimized)',
        inputSchema: {
          type: 'object',
          properties: {
            tagName: {
              type: 'string',
              description: 'Tag name to filter by'
            },
            boardId: {
              type: 'number',
              description: 'Board ID (optional)'
            },
            minimal: {
              type: 'boolean',
              description: 'Return minimal JSON format'
            }
          },
          required: ['tagName']
        }
      },
      {
        name: 'kaiten_add_comment',
        description: 'Add comment to card',
        inputSchema: {
          type: 'object',
          properties: {
            cardId: {
              type: 'number',
              description: 'Card ID'
            },
            text: {
              type: 'string',
              description: 'Comment text'
            }
          },
          required: ['cardId', 'text']
        }
      },
      {
        name: 'kaiten_get_comments',
        description: 'Get comments for card',
        inputSchema: {
          type: 'object',
          properties: {
            cardId: {
              type: 'number',
              description: 'Card ID'
            }
          },
          required: ['cardId']
        }
      },
      {
        name: 'kaiten_create_subtask',
        description: 'Create subtask',
        inputSchema: {
          type: 'object',
          properties: {
            parentId: {
              type: 'number',
              description: 'Parent card ID'
            },
            title: {
              type: 'string',
              description: 'Subtask title'
            }
          },
          required: ['parentId', 'title']
        }
      },
      {
        name: 'kaiten_get_subtasks',
        description: 'Get subtasks for card',
        inputSchema: {
          type: 'object',
          properties: {
            cardId: {
              type: 'number',
              description: 'Card ID'
            }
          },
          required: ['cardId']
        }
      },
      {
        name: 'kaiten_add_tag',
        description: 'Add tag to card',
        inputSchema: {
          type: 'object',
          properties: {
            cardId: {
              type: 'number',
              description: 'Card ID'
            },
            tagName: {
              type: 'string',
              description: 'Tag name'
            }
          },
          required: ['cardId', 'tagName']
        }
      },
      {
        name: 'kaiten_remove_tag',
        description: 'Remove tag from card',
        inputSchema: {
          type: 'object',
          properties: {
            cardId: {
              type: 'number',
              description: 'Card ID'
            },
            tagName: {
              type: 'string',
              description: 'Tag name'
            }
          },
          required: ['cardId', 'tagName']
        }
      },
      {
        name: 'kaiten_git_branch',
        description: 'Create git branch for card',
        inputSchema: {
          type: 'object',
          properties: {
            cardId: {
              type: 'number',
              description: 'Card ID'
            }
          },
          required: ['cardId']
        }
      },
      {
        name: 'kaiten_git_checkout',
        description: 'Checkout git branch for card',
        inputSchema: {
          type: 'object',
          properties: {
            cardId: {
              type: 'number',
              description: 'Card ID'
            }
          },
          required: ['cardId']
        }
      },
      {
        name: 'kaiten_git_commit',
        description: 'Commit changes with card reference',
        inputSchema: {
          type: 'object',
          properties: {
            cardId: {
              type: 'number',
              description: 'Card ID'
            },
            message: {
              type: 'string',
              description: 'Commit message (optional)'
            }
          },
          required: ['cardId']
        }
      },
      {
        name: 'kaiten_git_status',
        description: 'Get git status',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'kaiten_git_push',
        description: 'Push git branch for card',
        inputSchema: {
          type: 'object',
          properties: {
            cardId: {
              type: 'number',
              description: 'Card ID'
            }
          },
          required: ['cardId']
        }
      },
      {
        name: 'kaiten_users',
        description: 'Get list of users',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'kaiten_search_users',
        description: 'Search users by query',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query'
            }
          },
          required: ['query']
        }
      }
    ];
  }

  async handleToolCall(toolName, args) {
    try {
      switch (toolName) {
        case 'kaiten_spaces':
          return await sdk.getSpaces();

        case 'kaiten_boards':
          return await sdk.getBoards(args.spaceId);

        case 'kaiten_columns':
          return await sdk.getColumns(args.boardId);

        case 'kaiten_cards':
          return await sdk.getCards(args.spaceId, args.boardId);

        case 'kaiten_card':
          return await sdk.getCard(args.cardId);

        case 'kaiten_create_card':
          return await sdk.createCard({
            title: args.title,
            boardId: args.boardId,
            columnId: args.columnId,
            description: args.description
          });

        case 'kaiten_update_card':
          return await sdk.updateCard(args.cardId, JSON.parse(args.data));

        case 'kaiten_delete_card':
          return await sdk.deleteCard(args.cardId);

        case 'kaiten_move_card':
          return await sdk.moveToColumn(args.cardId, args.columnId);

        case 'kaiten_assign_card':
          return await sdk.assignTo(args.cardId, args.userId);

        case 'kaiten_find_cards':
          const cards = await sdk.getCards(null, args.boardId);
          const filtered = cards.filter(c => 
            c.tags?.some(t => t.name === args.tagName)
          );
          return filtered;

        case 'kaiten_add_comment':
          return await sdk.addComment(args.cardId, args.text);

        case 'kaiten_get_comments':
          return await sdk.getComments(args.cardId);

        case 'kaiten_create_subtask':
          return await sdk.createSubtask(args.parentId, args.title);

        case 'kaiten_get_subtasks':
          return await sdk.getSubtasks(args.cardId);

        case 'kaiten_add_tag':
          return await sdk.addTag(args.cardId, args.tagName);

        case 'kaiten_remove_tag':
          return await sdk.removeTag(args.cardId, args.tagName);

        case 'kaiten_git_branch':
          return await sdk.createGitBranch(args.cardId);

        case 'kaiten_git_checkout':
          return await sdk.checkoutGitBranch(args.cardId);

        case 'kaiten_git_commit':
          return await sdk.commitGit(args.cardId, args.message);

        case 'kaiten_git_status':
          return await sdk.getGitStatus();

        case 'kaiten_git_push':
          return await sdk.gitPush(args.cardId);

        case 'kaiten_users':
          return await sdk.getUsers();

        case 'kaiten_search_users':
          return await sdk.findUser(args.query);

        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      throw new Error(`Tool ${toolName} failed: ${error.message}`);
    }
  }

  sendResponse(response) {
    process.stdout.write(JSON.stringify(response) + '\n');
  }

  async handleMessage(message) {
    try {
      if (message.method === 'initialize') {
        this.sendResponse({
          jsonrpc: '2.0',
          id: message.id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {}
            },
            serverInfo: {
              name: 'kaiten-mcp',
              version: '2.0.0'
            }
          }
        });
      } else if (message.method === 'tools/list') {
        this.sendResponse({
          jsonrpc: '2.0',
          id: message.id,
          result: {
            tools: this.tools
          }
        });
      } else if (message.method === 'tools/call') {
        const result = await this.handleToolCall(
          message.params.name,
          message.params.arguments || {}
        );
        this.sendResponse({
          jsonrpc: '2.0',
          id: message.id,
          result: {
            content: [{
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }]
          }
        });
      } else if (message.method === 'shutdown') {
        this.sendResponse({
          jsonrpc: '2.0',
          id: message.id,
          result: null
        });
        process.exit(0);
      }
    } catch (error) {
      this.sendResponse({
        jsonrpc: '2.0',
        id: message.id,
        error: {
          code: -32603,
          message: error.message
        }
      });
    }
  }

  start() {
    let buffer = '';

    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const message = JSON.parse(line);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse message:', error.message);
          }
        }
      }
    });

    process.stdin.on('end', () => {
      if (buffer.trim()) {
        try {
          const message = JSON.parse(buffer);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse final message:', error.message);
        }
      }
    });
  }
}

const server = new MCPServer();
server.start();
