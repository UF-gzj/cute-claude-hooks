#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const LOCALIZED_MARKER = 'cute-claude-hooks-localized';
const LEGACY_TRANSLATION_MARKERS = [
  '!',
  '',
  '',
  '',
  ' /theme ',
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

function sha256File(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function getClaudeInstallInfo() {
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
  const packageJsonPath = path.join(packageDir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    return null;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const version = packageJson.version || 'unknown';
    const backupRoot = path.join(os.homedir(), '.claude', 'localize', 'backups');
    const cliPath = path.join(packageDir, 'cli.js');
    const binPath = path.join(packageDir, 'bin', 'claude.exe');

    if (fs.existsSync(cliPath)) {
      return {
        mode: 'legacy',
        version,
        cliPath,
      };
    }

    if (fs.existsSync(binPath)) {
      return {
        mode: 'native',
        version,
        binPath,
        manifestPath: path.join(backupRoot, `claude-${version}.manifest.json`),
      };
    }
  } catch {
    return null;
  }

  return null;
}

function isLocalizedLegacyContent(content) {
  return content.includes(LOCALIZED_MARKER)
    || LEGACY_TRANSLATION_MARKERS.some((marker) => content.includes(marker));
}

function shouldRelocalize(info) {
  try {
    if (info.mode === 'legacy') {
      const content = fs.readFileSync(info.cliPath, 'utf8');
      return !isLocalizedLegacyContent(content);
    }

    if (info.mode === 'native') {
      if (!fs.existsSync(info.manifestPath)) {
        return true;
      }
      const manifest = JSON.parse(fs.readFileSync(info.manifestPath, 'utf8'));
      if (!manifest || !manifest.patchedSha256) {
        return true;
      }
      const currentHash = sha256File(info.binPath);
      return currentHash !== manifest.patchedSha256;
    }
  } catch {
    return true;
  }

  return false;
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

  const info = getClaudeInstallInfo();
  if (!info) {
    return;
  }

  if (!shouldRelocalize(info)) {
    return;
  }

  const ok = runLocalize(localizeScript);
  if (ok) {
    log(`[cute-claude-hooks] refreshed localization for Claude Code ${info.version} (${info.mode})`);
  }
}

main();
