#!/usr/bin/env node

/**
 * 🌸 Cute Claude Hooks - NPM 安装脚本
 * 让 Claude Code 拥有完整的中文体验！
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const MAGENTA = '\x1b[38;5;206m';
const GREEN = '\x1b[0;32m';
const YELLOW = '\x1b[0;33m';
const NC = '\x1b[0m';

console.log(`\n${MAGENTA}╔══════════════════════════════════════════╗${NC}`);
console.log(`${MAGENTA}║     🌸 Cute Claude Hooks 安装程序 🌸    ║${NC}`);
console.log(`${MAGENTA}║     让 Claude Code 更可爱、更易用！      ║${NC}`);
console.log(`${MAGENTA}╚══════════════════════════════════════════╝${NC}\n`);

// 获取用户主目录
const homeDir = os.homedir();
const claudeDir = path.join(homeDir, '.claude');
const hooksDir = path.join(claudeDir, 'hooks');
const localizeDir = path.join(claudeDir, 'localize');

// 获取 npm 包目录
const npmDir = path.dirname(require.resolve('cute-claude-hooks/package.json'));

console.log(`${GREEN}📁 安装目录: ${npmDir}${NC}\n`);

// 创建目录
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`${GREEN}✅ 创建目录: ${dir}${NC}`);
  }
}

// 复制文件
function copyFile(src, dest) {
  try {
    fs.copyFileSync(src, dest);
    console.log(`${GREEN}✅ 复制文件: ${path.basename(dest)}${NC}`);
  } catch (err) {
    console.log(`${YELLOW}⚠️ 复制失败: ${path.basename(dest)}${NC}`);
  }
}

// 安装 Hook
function installHook() {
  console.log(`${MAGENTA}📦 安装工具提示 Hook...${NC}\n`);

  ensureDir(hooksDir);

  const hookSrc = path.join(npmDir, 'tool-tips-post.sh');
  const hookDest = path.join(hooksDir, 'tool-tips-post.sh');

  if (fs.existsSync(hookSrc)) {
    copyFile(hookSrc, hookDest);

    // 设置执行权限 (Unix only)
    if (process.platform !== 'win32') {
      try {
        fs.chmodSync(hookDest, '755');
      } catch (err) {}
    }
  }

  // 更新 settings.json
  const settingsFile = path.join(claudeDir, 'settings.json');
  updateSettings(settingsFile, hookDest);
}

// 更新 settings.json
function updateSettings(settingsFile, hookPath) {
  let settings = {};

  if (fs.existsSync(settingsFile)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
    } catch (err) {
      console.log(`${YELLOW}⚠️ 无法读取 settings.json${NC}`);
    }
  }

  if (!settings.hooks) settings.hooks = {};
  if (!settings.hooks.PostToolUse) settings.hooks.PostToolUse = [];

  const matcher = 'Bash|Read|Write|Edit|Glob|Grep|mcp__*';
  const exists = settings.hooks.PostToolUse.some(
    h => h.matcher === matcher
  );

  if (!exists) {
    const hookCommand = process.platform === 'win32'
      ? `bash "${hookPath.replace(/\\/g, '/')}"`
      : `bash ${hookPath}`;

    settings.hooks.PostToolUse.push({
      matcher: matcher,
      hooks: [{
        type: 'command',
        command: hookCommand
      }]
    });

    try {
      fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
      console.log(`${GREEN}✅ 更新配置: settings.json${NC}`);
    } catch (err) {
      console.log(`${YELLOW}⚠️ 无法更新 settings.json${NC}`);
    }
  } else {
    console.log(`${YELLOW}ℹ️ Hook 已配置，跳过${NC}`);
  }
}

// 安装汉化
function installLocalize() {
  console.log(`\n${MAGENTA}📦 安装界面汉化...${NC}\n`);

  ensureDir(localizeDir);

  const localizeSrcDir = path.join(npmDir, 'localize');
  const files = ['keyword.conf', 'localize.sh', 'localize.ps1', 'restore.sh', 'restore.ps1'];

  files.forEach(file => {
    const src = path.join(localizeSrcDir, file);
    const dest = path.join(localizeDir, file);
    if (fs.existsSync(src)) {
      copyFile(src, dest);

      // 设置执行权限 (Unix only)
      if (process.platform !== 'win32' && (file.endsWith('.sh'))) {
        try {
          fs.chmodSync(dest, '755');
        } catch (err) {}
      }
    }
  });

  // 执行汉化
  console.log(`\n${MAGENTA}🌸 执行界面汉化...${NC}`);

  try {
    if (process.platform === 'win32') {
      const psScript = path.join(localizeDir, 'localize.ps1');
      if (fs.existsSync(psScript)) {
        execSync(`powershell -ExecutionPolicy Bypass -File "${psScript}"`, { stdio: 'inherit' });
      }
    } else {
      const shScript = path.join(localizeDir, 'localize.sh');
      if (fs.existsSync(shScript)) {
        execSync(`bash "${shScript}"`, { stdio: 'inherit' });
      }
    }
  } catch (err) {
    console.log(`${YELLOW}⚠️ 汉化执行遇到问题，请手动运行${NC}`);
  }
}

// 主函数
function main() {
  // 选择安装模式
  const args = process.argv.slice(2);
  const mode = args[0] || 'all';

  switch (mode) {
    case 'hook':
    case '1':
      installHook();
      break;
    case 'localize':
    case '2':
      installLocalize();
      break;
    case 'all':
    case '3':
    default:
      installHook();
      installLocalize();
      break;
  }

  console.log(`\n${MAGENTA}🌸 安装完成！${NC}`);
  console.log(`${YELLOW}📖 文档: https://github.com/gugug168/cute-claude-hooks${NC}`);
  console.log(`${YELLOW}💡 重启 Claude Code 即可生效${NC}\n`);
}

main();
