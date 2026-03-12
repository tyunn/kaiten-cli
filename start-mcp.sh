#!/bin/bash
cd /home/anton/projects/github.com/tyunn/kaiten-mcp
# Add logging to help debug issues
LOG_DIR="$HOME/.kaiten/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/mcp-server-$(date +%Y%m%d-%H%M%S).log"
exec node mcp-server.js 2>&1 | tee -a "$LOG_FILE"
