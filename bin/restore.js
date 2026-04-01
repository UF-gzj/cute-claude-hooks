#!/usr/bin/env node

/**
 * Cute Claude Hooks - 私有增强版恢复脚本
 * 恢复 Claude Code 英文界面并清理 Claude 监控状态栏
 * Original author: 关镇江
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const MAGENTA = '\x1b[38;5;206m';
const GREEN = '\x1b[0;32m';
const YELLOW = '\x1b[0;33m';
const RED = '\x1b[0;31m';
const NC = '\x1b[0m';

console.log(`\n${MAGENTA}恢复 Claude Code 英文界面...${NC}\n`);

const pkgName = '@anthropic-ai/claude-code';
const claudeDir = path.join(os.homedir(), '.claude');
const settingsFile = path.join(claudeDir, 'settings.json');
const monitorDir = path.join(claudeDir, 'monitor');
const monitorStatusPath = '/.claude/monitor/statusline.js';
const localizeBackupDir = path.join(claudeDir, 'localize', 'backups');
const monitorFiles = [
  'constants.js',
  'formatters.js',
  'stats-cache.js',
  'transcript-counter.js',
  'statusline.js',
];

function cleanupMonitorSettings() {
  if (!fs.existsSync(settingsFile)) {
    return;
  }

  try {
    const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
    if (
      settings.statusLine
      && settings.statusLine.type === 'command'
      && typeof settings.statusLine.command === 'string'
      && settings.statusLine.command.includes(monitorStatusPath)
    ) {
      delete settings.statusLine;
      fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2), 'utf8');
      console.log(`${GREEN}已移除 Claude 监控状态栏配置${NC}`);
    }
  } catch (err) {
    console.log(`${YELLOW}清理 statusLine 配置时遇到问题: ${err.message}${NC}`);
  }
}

function cleanupMonitorFiles() {
  if (!fs.existsSync(monitorDir)) {
    return;
  }

  try {
    for (const file of monitorFiles) {
      const filePath = path.join(monitorDir, file);
      if (fs.existsSync(filePath)) {
        fs.rmSync(filePath, { force: true });
      }
    }

    const cacheDir = path.join(monitorDir, 'cache');
    if (fs.existsSync(cacheDir)) {
      fs.rmSync(cacheDir, { recursive: true, force: true });
    }

    const remaining = fs.readdirSync(monitorDir, { withFileTypes: true });
    if (remaining.length === 0) {
      fs.rmSync(monitorDir, { recursive: true, force: true });
      console.log(`${GREEN}已清理监控脚本目录: ${monitorDir}${NC}`);
    } else {
      console.log(`${YELLOW}监控目录中存在其他文件，已仅移除本项目安装内容${NC}`);
    }
  } catch (err) {
    console.log(`${YELLOW}清理监控目录时遇到问题: ${err.message}${NC}`);
  }
}

let claudeCodeFound = true;

try {
  const log = execSync(`npm list -g ${pkgName} --depth=0`, { encoding: 'utf8' });
  if (!log.trim().includes(pkgName)) {
    claudeCodeFound = false;
    console.log(`${YELLOW}未找到 Claude Code，将仅清理本项目配置和监控文件${NC}`);
  }

  if (claudeCodeFound) {
    const npmRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
    const packageJsonPath = path.join(npmRoot, pkgName, 'package.json');
    const cliPath = path.join(npmRoot, pkgName, 'cli.js');
    const cliBak = path.join(npmRoot, pkgName, 'cli.bak.js');
    const packageJson = fs.existsSync(packageJsonPath)
      ? JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
      : null;
    const versionedBackup = packageJson && packageJson.version
      ? path.join(localizeBackupDir, `cli-${packageJson.version}.bak.js`)
      : null;

    if (versionedBackup && fs.existsSync(versionedBackup)) {
      fs.copyFileSync(versionedBackup, cliPath);
      console.log(`${GREEN}已恢复为英文界面${NC}`);
    } else if (fs.existsSync(cliBak)) {
      console.log(`${YELLOW}仅发现旧版通用备份，已跳过恢复以避免覆盖当前升级后的版本${NC}`);
    } else {
      console.log(`${YELLOW}未找到当前版本备份，可能已经是英文版或尚未为该版本执行汉化${NC}`);
    }
  }
} catch (err) {
  claudeCodeFound = false;
  console.log(`${YELLOW}恢复 Claude Code 英文界面时遇到问题，将继续清理本项目配置: ${err.message}${NC}`);
}

cleanupMonitorSettings();
cleanupMonitorFiles();

console.log(`\n${MAGENTA}请重启 Claude Code 使更改生效${NC}\n`);
