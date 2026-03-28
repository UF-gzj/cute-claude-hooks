#!/usr/bin/env node

/**
 * 🌸 Cute Claude Hooks - 恢复脚本
 * 恢复 Claude Code 英文界面
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const MAGENTA = '\x1b[38;5;206m';
const GREEN = '\x1b[0;32m';
const YELLOW = '\x1b[0;33m';
const NC = '\x1b[0m';

console.log(`\n${MAGENTA}🌸 恢复 Claude Code 英文界面...${NC}\n`);

const homeDir = os.homedir();
const localizeDir = path.join(homeDir, '.claude', 'localize');

// 执行恢复脚本
function restore() {
  try {
    if (process.platform === 'win32') {
      const psScript = path.join(localizeDir, 'restore.ps1');
      if (fs.existsSync(psScript)) {
        const { execSync } = require('child_process');
        execSync(`powershell -ExecutionPolicy Bypass -File "${psScript}"`, { stdio: 'inherit' });
        console.log(`${GREEN}✅ 界面已恢复为英文${NC}`);
      } else {
        console.log(`${YELLOW}⚠️ 未找到恢复脚本${NC}`);
      }
    } else {
      const shScript = path.join(localizeDir, 'restore.sh');
      if (fs.existsSync(shScript)) {
        const { execSync } = require('child_process');
        execSync(`bash "${shScript}"`, { stdio: 'inherit' });
        console.log(`${GREEN}✅ 界面已恢复为英文${NC}`);
      } else {
        console.log(`${YELLOW}⚠️ 未找到恢复脚本${NC}`);
      }
    }
  } catch (err) {
    console.log(`${YELLOW}⚠️ 恢复失败: ${err.message}${NC}`);
  }
}

restore();

console.log(`\n${MAGENTA}🌸 完成！重启 Claude Code 即可生效${NC}\n`);
