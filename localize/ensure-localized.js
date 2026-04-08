#!/usr/bin/env node

/**
 * ensure-localized.js
 * 在 PowerShell 启动 Claude Code 前检查当前 npm 版 cli.js 是否仍为汉化状态。
 * 如果检测到版本升级或文件回到英文版，则自动重放 localize.js。
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const LOCALIZED_MARKER = 'cute-claude-hooks-localized';
const LEGACY_TRANSLATION_MARKERS = [
  '欢迎回来!',
  '自动压缩',
  '最近活动记录',
  '深度思考模式',
  '使用 /theme 更改颜色主题',
];
const PKG_NAME = '@anthropic-ai/claude-code';

function isQuietMode() {
  return process.argv.includes('--quiet');
}

function log(message) {
  if (!isQuietMode()) {
    console.log(message);
  }
}

function safeExec(command) {
  return spawnSync(command, { shell: true, encoding: 'utf8', windowsHide: true });
}

function getClaudeCliInfo() {
  const listResult = safeExec(`npm list -g ${PKG_NAME} --depth=0`);
  if (listResult.status !== 0 || !listResult.stdout.includes(PKG_NAME)) {
    return null;
  }

  const npmRootResult = safeExec('npm root -g');
  if (npmRootResult.status !== 0) {
    return null;
  }

  const npmRoot = (npmRootResult.stdout || '').trim();
  if (!npmRoot) {
    return null;
  }

  const packageDir = path.join(npmRoot, PKG_NAME);
  const cliPath = path.join(packageDir, 'cli.js');
  const packageJsonPath = path.join(packageDir, 'package.json');
  if (!fs.existsSync(cliPath) || !fs.existsSync(packageJsonPath)) {
    return null;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return {
      cliPath,
      version: packageJson.version || 'unknown',
    };
  } catch {
    return null;
  }
}

function isLocalizedContent(content) {
  return content.includes(LOCALIZED_MARKER)
    || LEGACY_TRANSLATION_MARKERS.some(marker => content.includes(marker));
}

function shouldRelocalize(cliPath) {
  try {
    const content = fs.readFileSync(cliPath, 'utf8');
    return !isLocalizedContent(content);
  } catch {
    return false;
  }
}

function runLocalize(localizeScript) {
  const result = spawnSync('node', [localizeScript], {
    encoding: 'utf8',
    windowsHide: true,
  });

  if (result.status !== 0) {
    const stderr = (result.stderr || '').trim();
    const stdout = (result.stdout || '').trim();
    if (!isQuietMode()) {
      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);
    }
    return false;
  }

  return true;
}

function main() {
  const localizeScript = path.join(__dirname, 'localize.js');
  if (!fs.existsSync(localizeScript)) {
    return;
  }

  const cliInfo = getClaudeCliInfo();
  if (!cliInfo) {
    return;
  }

  if (!shouldRelocalize(cliInfo.cliPath)) {
    return;
  }

  const ok = runLocalize(localizeScript);
  if (ok) {
    log(`[cute-claude-hooks] 检测到 Claude Code ${cliInfo.version} 尚未汉化，已自动重新应用汉化。`);
  }
}

main();
