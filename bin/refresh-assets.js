#!/usr/bin/env node

/**
 * refresh-assets.js - 仅刷新命令与技能描述汉化
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const MAGENTA = '\x1b[38;5;206m';
const GREEN = '\x1b[0;32m';
const YELLOW = '\x1b[0;33m';
const RED = '\x1b[0;31m';
const NC = '\x1b[0m';

const packageRoot = path.resolve(__dirname, '..');
const claudeLocalizeDir = path.join(os.homedir(), '.claude', 'localize');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function syncFile(fileName) {
  const src = path.join(packageRoot, 'localize', fileName);
  const dest = path.join(claudeLocalizeDir, fileName);
  if (!fs.existsSync(src)) {
    throw new Error(`缺少文件: ${src}`);
  }
  fs.copyFileSync(src, dest);
  return dest;
}

function main() {
  console.log(`${MAGENTA}==============================================${NC}`);
  console.log(`${MAGENTA}   刷新命令与技能描述汉化${NC}`);
  console.log(`${MAGENTA}==============================================${NC}\n`);

  try {
    ensureDir(claudeLocalizeDir);
    const assetsScript = syncFile('localize-assets.js');
    syncFile('description-map.js');

    execSync(`node "${assetsScript}"`, { stdio: 'inherit' });
    console.log(`\n${GREEN}命令与技能描述汉化刷新完成${NC}`);
    console.log(`${YELLOW}请重启 Claude Code 查看更新${NC}`);
  } catch (error) {
    console.log(`${RED}刷新失败: ${error.message}${NC}`);
    process.exit(1);
  }
}

main();
