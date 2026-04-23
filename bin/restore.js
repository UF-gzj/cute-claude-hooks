#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const MAGENTA = '\x1b[38;5;206m';
const GREEN = '\x1b[0;32m';
const YELLOW = '\x1b[0;33m';
const NC = '\x1b[0m';

console.log(`\n${MAGENTA}Restoring Claude Code customizations...${NC}\n`);

const pkgName = '@anthropic-ai/claude-code';
const claudeDir = path.join(os.homedir(), '.claude');
const settingsFile = path.join(claudeDir, 'settings.json');
const monitorDir = path.join(claudeDir, 'monitor');
const monitorStatusPath = '/.claude/monitor/statusline.js';
const localizeBackupDir = path.join(claudeDir, 'localize', 'backups');
const powerShellProfiles = [
  path.join(os.homedir(), 'Documents', 'PowerShell', 'Microsoft.PowerShell_profile.ps1'),
  path.join(os.homedir(), 'Documents', 'WindowsPowerShell', 'Microsoft.PowerShell_profile.ps1'),
];
const profileBlockStart = '# >>> cute-claude-hooks auto-localize >>>';
const profileBlockEnd = '# <<< cute-claude-hooks auto-localize <<<';
const shimBackupDir = path.join(claudeDir, 'localize', 'shims');
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
      console.log(`${GREEN}Removed Claude monitor statusLine from settings${NC}`);
    }
  } catch (err) {
    console.log(`${YELLOW}Could not clean statusLine settings: ${err.message}${NC}`);
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
      console.log(`${GREEN}Removed ${monitorDir}${NC}`);
    }
  } catch (err) {
    console.log(`${YELLOW}Could not clean monitor files: ${err.message}${NC}`);
  }
}

function cleanupPowerShellProfiles() {
  const blockRegex = new RegExp(
    `${profileBlockStart.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${profileBlockEnd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\r?\\n?`,
    'g',
  );

  for (const profilePath of powerShellProfiles) {
    if (!fs.existsSync(profilePath)) {
      continue;
    }

    try {
      const content = fs.readFileSync(profilePath, 'utf8');
      const cleaned = content.replace(blockRegex, '').replace(/\n{3,}/g, '\n\n').trimEnd();
      if (cleaned !== content) {
        const nextContent = cleaned ? `${cleaned}\n` : '';
        fs.writeFileSync(profilePath, nextContent, 'utf8');
        console.log(`${GREEN}Cleaned PowerShell profile: ${profilePath}${NC}`);
      }
    } catch (err) {
      console.log(`${YELLOW}Could not clean PowerShell profile: ${err.message}${NC}`);
    }
  }
}

function getGlobalBinDir() {
  try {
    const prefix = execSync('npm prefix -g', { encoding: 'utf8' }).trim();
    return process.platform === 'win32' ? prefix : path.join(prefix, 'bin');
  } catch {
    return null;
  }
}

function restoreClaudeLaunchShims() {
  const binDir = getGlobalBinDir();
  if (!binDir || !fs.existsSync(shimBackupDir)) {
    return;
  }

  const shimPairs = [
    { backup: path.join(shimBackupDir, 'claude'), target: path.join(binDir, 'claude') },
    { backup: path.join(shimBackupDir, 'claude.cmd'), target: path.join(binDir, 'claude.cmd') },
    { backup: path.join(shimBackupDir, 'claude.ps1'), target: path.join(binDir, 'claude.ps1') },
  ];

  for (const shim of shimPairs) {
    if (!fs.existsSync(shim.backup) || !fs.existsSync(shim.target)) {
      continue;
    }

    try {
      const targetStat = fs.lstatSync(shim.target);
      if (process.platform !== 'win32' && targetStat.isSymbolicLink()) {
        console.log(`${YELLOW}Skip restoring symlinked Claude launcher: ${shim.target}${NC}`);
        continue;
      }

      fs.copyFileSync(shim.backup, shim.target);
      console.log(`${GREEN}Restored Claude launcher shim: ${shim.target}${NC}`);
    } catch (err) {
      console.log(`${YELLOW}Could not restore launcher shim ${shim.target}: ${err.message}${NC}`);
    }
  }
}

function restoreClaudeBinaryOrCli() {
  try {
    const log = execSync(`npm list -g ${pkgName} --depth=0`, { encoding: 'utf8' });
    if (!log.trim().includes(pkgName)) {
      console.log(`${YELLOW}Claude Code is not installed globally${NC}`);
      return;
    }

    const npmRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
    const packageDir = path.join(npmRoot, pkgName);
    const packageJsonPath = path.join(packageDir, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      console.log(`${YELLOW}Claude Code package.json is missing${NC}`);
      return;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const version = packageJson.version || 'unknown';
    const cliPath = path.join(packageDir, 'cli.js');
    const cliBak = path.join(packageDir, 'cli.bak.js');
    const versionedCliBackup = path.join(localizeBackupDir, `cli-${version}.bak.js`);
    const binPath = path.join(packageDir, 'bin', 'claude.exe');
    const versionedBinBackup = path.join(localizeBackupDir, `claude-${version}.bak.exe`);
    const binaryManifest = path.join(localizeBackupDir, `claude-${version}.manifest.json`);

    if (fs.existsSync(cliPath)) {
      if (fs.existsSync(versionedCliBackup)) {
        fs.copyFileSync(versionedCliBackup, cliPath);
        console.log(`${GREEN}Restored legacy cli.js from versioned backup${NC}`);
      } else if (fs.existsSync(cliBak)) {
        fs.copyFileSync(cliBak, cliPath);
        console.log(`${GREEN}Restored legacy cli.js from cli.bak.js${NC}`);
      } else {
        console.log(`${YELLOW}No legacy cli.js backup found${NC}`);
      }
      return;
    }

    if (fs.existsSync(binPath)) {
      if (fs.existsSync(versionedBinBackup)) {
        fs.copyFileSync(versionedBinBackup, binPath);
        if (fs.existsSync(binaryManifest)) {
          fs.rmSync(binaryManifest, { force: true });
        }
        console.log(`${GREEN}Restored native Claude binary from versioned backup${NC}`);
      } else {
        console.log(`${YELLOW}No native binary backup found for this Claude Code version${NC}`);
      }
      return;
    }

    console.log(`${YELLOW}Unsupported Claude Code package layout${NC}`);
  } catch (err) {
    console.log(`${YELLOW}Could not restore Claude Code package: ${err.message}${NC}`);
  }
}

restoreClaudeBinaryOrCli();
cleanupMonitorSettings();
cleanupMonitorFiles();
cleanupPowerShellProfiles();
restoreClaudeLaunchShims();

console.log(`\n${MAGENTA}Claude Code restore complete.${NC}\n`);
