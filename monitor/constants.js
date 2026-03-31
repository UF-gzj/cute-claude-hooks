#!/usr/bin/env node

/**
 * Original author: 关镇江
 * Private enhanced edition monitor constants.
 */

const os = require('os');
const path = require('path');

const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const MONITOR_DIR_NAME = 'monitor';
const CACHE_DIR_NAME = 'cache';
const MONITOR_DIR = path.join(CLAUDE_DIR, MONITOR_DIR_NAME);
const CACHE_DIR = path.join(MONITOR_DIR, CACHE_DIR_NAME);
const STATUSLINE_SCRIPT_NAME = 'statusline.js';
const DEFAULT_STATUS_TEXT = 'Claude 监控: 统计暂不可用';

module.exports = {
  CLAUDE_DIR,
  MONITOR_DIR_NAME,
  CACHE_DIR_NAME,
  MONITOR_DIR,
  CACHE_DIR,
  STATUSLINE_SCRIPT_NAME,
  DEFAULT_STATUS_TEXT,
};
