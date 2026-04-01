#!/usr/bin/env node
// localize.js - Claude Code npm 版汉化脚本
// 仅处理 npm 全局安装的 @anthropic-ai/claude-code，不修改原生安装通道。
// License: MIT

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const MAGENTA = '\x1b[38;5;206m';
const GREEN = '\x1b[0;32m';
const YELLOW = '\x1b[0;33m';
const RED = '\x1b[0;31m';
const CYAN = '\x1b[0;36m';
const NC = '\x1b[0m';

const PKG_NAME = '@anthropic-ai/claude-code';
const LOCALIZED_MARKER = 'cute-claude-hooks-localized';
const LEGACY_TRANSLATION_MARKERS = [
  '欢迎回来!',
  '自动压缩',
  '最近活动记录',
  '深度思考模式',
  '使用 /theme 更改颜色主题',
];

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getCliInfo() {
  let npmRoot;

  try {
    const log = execSync(`npm list -g ${PKG_NAME} --depth=0`, { encoding: 'utf8' });
    if (!log.trim().includes(PKG_NAME)) {
      throw new Error('npm package not found');
    }
    npmRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
  } catch (error) {
    console.log(`${RED}未检测到 npm 全局安装的 Claude Code${NC}`);
    console.log(`${YELLOW}界面汉化当前仅支持 npm 版，请先执行: npm install -g ${PKG_NAME}${NC}`);
    process.exit(1);
  }

  const packageDir = path.join(npmRoot, PKG_NAME);
  const cliPath = path.join(packageDir, 'cli.js');
  const packageJsonPath = path.join(packageDir, 'package.json');
  const legacyBackupPath = path.join(packageDir, 'cli.bak.js');

  if (!fs.existsSync(cliPath) || !fs.existsSync(packageJsonPath)) {
    console.log(`${RED}找不到 npm 版 Claude Code 的 cli.js 或 package.json${NC}`);
    process.exit(1);
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const version = packageJson.version || 'unknown';

  const backupRoot = path.join(os.homedir(), '.claude', 'localize', 'backups');
  ensureDir(backupRoot);
  const versionedBackupPath = path.join(backupRoot, `cli-${version}.bak.js`);

  return {
    cliPath,
    version,
    legacyBackupPath,
    versionedBackupPath,
  };
}

function isLocalized(content) {
  return content.includes(LOCALIZED_MARKER) || LEGACY_TRANSLATION_MARKERS.some(marker => content.includes(marker));
}

function ensureVersionedBackup(cliInfo) {
  const { cliPath, version, legacyBackupPath, versionedBackupPath } = cliInfo;
  if (fs.existsSync(versionedBackupPath)) {
    const versionedContent = fs.readFileSync(versionedBackupPath, 'utf8');
    if (!isLocalized(versionedContent)) {
      return versionedBackupPath;
    }

    if (fs.existsSync(legacyBackupPath)) {
      const legacyContent = fs.readFileSync(legacyBackupPath, 'utf8');
      if (!isLocalized(legacyContent)) {
        fs.copyFileSync(legacyBackupPath, versionedBackupPath);
        console.log(`${GREEN}已用旧版英文备份修复当前版本备份: cli-${version}.bak.js${NC}`);
        return versionedBackupPath;
      }
    }

    return versionedBackupPath;
  }

  const currentContent = fs.readFileSync(cliPath, 'utf8');

  if (!isLocalized(currentContent)) {
    fs.copyFileSync(cliPath, versionedBackupPath);
    console.log(`${GREEN}已创建当前版本备份: cli-${version}.bak.js${NC}`);
    return versionedBackupPath;
  }

  if (fs.existsSync(legacyBackupPath)) {
    const legacyContent = fs.readFileSync(legacyBackupPath, 'utf8');
    if (!isLocalized(legacyContent)) {
      fs.copyFileSync(legacyBackupPath, versionedBackupPath);
      console.log(`${GREEN}已迁移旧备份为版本备份: cli-${version}.bak.js${NC}`);
      return versionedBackupPath;
    }
  }

  console.log(`${RED}当前版本缺少原始英文备份，无法安全重建汉化${NC}`);
  console.log(`${YELLOW}建议先重新安装当前 npm 版 Claude Code，再执行汉化${NC}`);
  process.exit(1);
}

function buildLocalizedContent(originalContent, keyword) {
  let content = originalContent;
  const entries = Object.entries(keyword);
  let totalReplacements = 0;
  let processedCount = 0;

  for (const [key, value] of entries) {
    let replaced = false;
    let count = 0;

    if (key.startsWith('RAW::')) {
      const rawKey = key.slice(5);
      if (rawKey && content.includes(rawKey)) {
        count = content.split(rawKey).length - 1;
        content = content.split(rawKey).join(value);
        replaced = true;
      }
    } else {
      const escapedKey = escapeRegex(key).replace(/\\n/g, '\\\\n');
      const newValue = value.replace(/\n/g, '\\n');

      if (escapedKey.startsWith('`') || escapedKey.startsWith('\\')) {
        const regex = new RegExp(escapedKey, 'g');
        const matches = content.match(regex);
        if (matches) {
          content = content.replace(regex, value);
          replaced = true;
          count = matches.length;
        }
      } else {
        const doubleRegex = new RegExp(`"${escapedKey}"`, 'g');
        const doubleMatches = content.match(doubleRegex);
        if (doubleMatches) {
          content = content.replace(doubleRegex, `"${newValue}"`);
          replaced = true;
          count += doubleMatches.length;
        }

        const singleRegex = new RegExp(`'${escapedKey}'`, 'g');
        const singleMatches = content.match(singleRegex);
        if (singleMatches) {
          content = content.replace(singleRegex, `'${newValue}'`);
          replaced = true;
          count += singleMatches.length;
        }
      }
    }

    if (replaced) {
      processedCount += 1;
      totalReplacements += count;
      console.log(
        `  ${GREEN}+${NC} ${key.substring(0, 50)}${key.length > 50 ? '...' : ''} ${YELLOW}->${NC} ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`,
      );
    }
  }

  const header = `/* ${LOCALIZED_MARKER} */`;
  if (!content.includes(header)) {
    if (content.startsWith('#!')) {
      const firstNewline = content.indexOf('\n');
      if (firstNewline !== -1) {
        content = `${content.slice(0, firstNewline + 1)}${header}\n${content.slice(firstNewline + 1)}`;
      } else {
        content = `${content}\n${header}\n`;
      }
    } else {
      content = `${header}\n${content}`;
    }
  }

  return { content, processedCount, totalReplacements, totalEntries: entries.length };
}

function localize(cliInfo) {
  const keywordFile = path.join(__dirname, 'keyword.js');
  const keyword = require(keywordFile);
  const backupPath = ensureVersionedBackup(cliInfo);
  const originalContent = fs.readFileSync(backupPath, 'utf8');

  const result = buildLocalizedContent(originalContent, keyword);
  fs.writeFileSync(cliInfo.cliPath, result.content, 'utf8');

  console.log('');
  console.log(
    `${MAGENTA}汉化完成! ${result.processedCount}/${result.totalEntries} 条匹配, ${result.totalReplacements} 处替换${NC}`,
  );
}

function main() {
  console.log(`${MAGENTA}==============================================${NC}`);
  console.log(`${MAGENTA}     Claude Code npm 版汉化工具${NC}`);
  console.log(`${MAGENTA}==============================================${NC}`);
  console.log('');

  const cliInfo = getCliInfo();
  console.log(`${CYAN}已安装版本: ${cliInfo.version}${NC}`);
  console.log(`${GREEN}CLI 路径: ${cliInfo.cliPath}${NC}`);
  console.log(`${GREEN}版本备份: ${cliInfo.versionedBackupPath}${NC}`);
  console.log(`${YELLOW}说明: 仅汉化 npm 版，不修改 Claude Code 的自动升级通道${NC}`);
  console.log('');

  console.log(`${MAGENTA}开始汉化...${NC}`);
  console.log('');

  localize(cliInfo);

  console.log(`${YELLOW}请重启 Claude Code 使汉化生效${NC}`);
}

main();
