#!/usr/bin/env node
// localize.js - supports both legacy cli.js and Claude Code 2.1.113+ native binaries

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
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
  '!',
  '',
  '',
  '',
  ' /theme ',
];

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function sha256Buffer(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function execText(command) {
  return execSync(command, { encoding: 'utf8' }).trim();
}

function getClaudeInstallInfo() {
  let npmRoot;

  try {
    const log = execSync(`npm list -g ${PKG_NAME} --depth=0`, { encoding: 'utf8' });
    if (!log.trim().includes(PKG_NAME)) {
      throw new Error('npm package not found');
    }
    npmRoot = execText('npm root -g');
  } catch (error) {
    console.log(`${RED}Could not find Claude Code npm package${NC}`);
    console.log(`${YELLOW}Install with: npm install -g ${PKG_NAME}${NC}`);
    process.exit(1);
  }

  const packageDir = path.join(npmRoot, PKG_NAME);
  const packageJsonPath = path.join(packageDir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.log(`${RED}Claude Code package.json is missing${NC}`);
    process.exit(1);
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const version = packageJson.version || 'unknown';
  const cliPath = path.join(packageDir, 'cli.js');
  const binPath = path.join(packageDir, 'bin', 'claude.exe');
  const backupRoot = path.join(os.homedir(), '.claude', 'localize', 'backups');
  ensureDir(backupRoot);

  if (fs.existsSync(cliPath)) {
    return {
      mode: 'legacy',
      version,
      packageDir,
      packageJsonPath,
      cliPath,
      legacyBackupPath: path.join(packageDir, 'cli.bak.js'),
      versionedBackupPath: path.join(backupRoot, `cli-${version}.bak.js`),
      manifestPath: path.join(backupRoot, `cli-${version}.manifest.json`),
    };
  }

  if (fs.existsSync(binPath)) {
    return {
      mode: 'native',
      version,
      packageDir,
      packageJsonPath,
      binPath,
      versionedBackupPath: path.join(backupRoot, `claude-${version}.bak.exe`),
      manifestPath: path.join(backupRoot, `claude-${version}.manifest.json`),
    };
  }

  console.log(`${RED}Unsupported Claude Code package layout${NC}`);
  process.exit(1);
}

function isLegacyLocalized(content) {
  return content.includes(LOCALIZED_MARKER)
    || LEGACY_TRANSLATION_MARKERS.some((marker) => content.includes(marker));
}

function ensureLegacyBackup(info) {
  const { cliPath, legacyBackupPath, versionedBackupPath, version } = info;
  if (fs.existsSync(versionedBackupPath)) {
    const versionedContent = fs.readFileSync(versionedBackupPath, 'utf8');
    if (!isLegacyLocalized(versionedContent)) {
      return versionedBackupPath;
    }

    if (fs.existsSync(legacyBackupPath)) {
      const legacyContent = fs.readFileSync(legacyBackupPath, 'utf8');
      if (!isLegacyLocalized(legacyContent)) {
        fs.copyFileSync(legacyBackupPath, versionedBackupPath);
        console.log(`${GREEN}Backed up cli-${version}.bak.js${NC}`);
        return versionedBackupPath;
      }
    }

    return versionedBackupPath;
  }

  const currentContent = fs.readFileSync(cliPath, 'utf8');
  if (!isLegacyLocalized(currentContent)) {
    fs.copyFileSync(cliPath, versionedBackupPath);
    console.log(`${GREEN}Backed up cli-${version}.bak.js${NC}`);
    return versionedBackupPath;
  }

  if (fs.existsSync(legacyBackupPath)) {
    const legacyContent = fs.readFileSync(legacyBackupPath, 'utf8');
    if (!isLegacyLocalized(legacyContent)) {
      fs.copyFileSync(legacyBackupPath, versionedBackupPath);
      console.log(`${GREEN}Backed up cli-${version}.bak.js${NC}`);
      return versionedBackupPath;
    }
  }

  console.log(`${RED}Could not find an unlocalized cli.js backup${NC}`);
  process.exit(1);
}

function ensureNativeBackup(info) {
  const { binPath, versionedBackupPath, version } = info;
  if (!fs.existsSync(versionedBackupPath)) {
    fs.copyFileSync(binPath, versionedBackupPath);
    console.log(`${GREEN}Backed up claude-${version}.bak.exe${NC}`);
  }
  return versionedBackupPath;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildLegacyLocalizedContent(originalContent, keyword) {
  let content = originalContent;
  const entries = Object.entries(keyword);
  let totalReplacements = 0;
  let processedCount = 0;

  for (const [key, value] of entries) {
    if (!value) continue;

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

function fitUtf8(text, maxBytes) {
  const candidates = [];
  const seen = new Set();

  function addCandidate(value) {
    const normalized = (value || '').replace(/\r\n/g, '\n').trim();
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    candidates.push(normalized);
  }

  addCandidate(text);
  addCandidate(String(text).replace(/\r?\n/g, ' '));
  addCandidate(String(text).replace(/[ \t]+/g, ''));
  addCandidate(String(text).replace(/[\r\n]+/g, ' ').replace(/[ \t]{2,}/g, ' ').trim());
  addCandidate(String(text).replace(/[“”‘’`]/g, '').replace(/[ \t]+/g, ' ').trim());
  addCandidate(String(text).replace(/[，。！？；：]/g, '').replace(/[ \t]+/g, '').trim());

  for (const candidate of candidates) {
    if (Buffer.byteLength(candidate, 'utf8') <= maxBytes) {
      return candidate;
    }
  }

  const base = candidates[0] || '';
  const ellipsis = Buffer.byteLength('…', 'utf8') <= maxBytes ? '…' : '';
  const reserved = Buffer.byteLength(ellipsis, 'utf8');
  let out = '';
  for (const ch of Array.from(base)) {
    const next = out + ch;
    if (Buffer.byteLength(next, 'utf8') + reserved > maxBytes) {
      break;
    }
    out = next;
  }
  if (!out) {
    return '';
  }
  return ellipsis && Buffer.byteLength(out + ellipsis, 'utf8') <= maxBytes ? out + ellipsis : out;
}

function padBuffer(buf, size) {
  if (buf.length === size) {
    return buf;
  }
  if (buf.length > size) {
    return buf.slice(0, size);
  }
  return Buffer.concat([buf, Buffer.alloc(size - buf.length, 0x20)]);
}

function loadBinaryOverrides() {
  const overrideFile = path.join(__dirname, 'binary-overrides.js');
  if (!fs.existsSync(overrideFile)) {
    return {};
  }
  return require(overrideFile);
}

function buildBinaryEntries(keyword, overrides) {
  const entries = [];
  const sources = Object.keys(overrides || {});

  for (const source of sources) {
    const desired = overrides[source];
    if (!desired || !source) continue;

    const sourceBytes = Buffer.byteLength(source, 'utf8');
    if (!sourceBytes) continue;

    const fitted = fitUtf8(desired, sourceBytes);
    if (!fitted) continue;

    entries.push({
      source,
      desired,
      fitted,
      truncated: fitted !== desired,
      sourceBytes,
    });
  }

  return entries;
}

function buildBinaryLocalizedBuffer(originalBuffer, keyword, overrides) {
  const working = Buffer.from(originalBuffer);
  const entries = buildBinaryEntries(keyword, overrides);
  let processedCount = 0;
  let totalReplacements = 0;
  let truncatedCount = 0;
  let skippedCount = 0;

  for (const entry of entries) {
    const sourceBuf = Buffer.from(entry.source, 'utf8');
    const replacementBuf = padBuffer(Buffer.from(entry.fitted, 'utf8'), sourceBuf.length);
    let index = working.indexOf(sourceBuf);
    let count = 0;

    while (index !== -1) {
      replacementBuf.copy(working, index);
      count += 1;
      index = working.indexOf(sourceBuf, index + sourceBuf.length);
    }

    if (count > 0) {
      processedCount += 1;
      totalReplacements += count;
      if (entry.truncated) {
        truncatedCount += 1;
      }
    } else {
      skippedCount += 1;
    }
  }

  return {
    buffer: working,
    processedCount,
    totalReplacements,
    truncatedCount,
    skippedCount,
    totalEntries: entries.length,
  };
}

function localizeLegacy(info, keyword) {
  const backupPath = ensureLegacyBackup(info);
  const originalContent = fs.readFileSync(backupPath, 'utf8');
  const result = buildLegacyLocalizedContent(originalContent, keyword);
  fs.writeFileSync(info.cliPath, result.content, 'utf8');
  return result;
}

function localizeNative(info, keyword) {
  const backupPath = ensureNativeBackup(info);
  const originalBuffer = fs.readFileSync(backupPath);
  const overrides = loadBinaryOverrides();
  const result = buildBinaryLocalizedBuffer(originalBuffer, keyword, overrides);
  const originalHash = sha256Buffer(originalBuffer);
  const patchedHash = sha256Buffer(result.buffer);

  const currentStat = fs.statSync(info.binPath);
  const tempPath = `${info.binPath}.cute-claude-hooks.tmp`;
  fs.writeFileSync(tempPath, result.buffer);
  fs.chmodSync(tempPath, currentStat.mode);
  fs.renameSync(tempPath, info.binPath);
  fs.writeFileSync(info.manifestPath, JSON.stringify({
    mode: 'native',
    version: info.version,
    targetPath: info.binPath,
    backupPath,
    originalSha256: originalHash,
    patchedSha256: patchedHash,
    patchedAt: new Date().toISOString(),
    processedCount: result.processedCount,
    totalReplacements: result.totalReplacements,
    truncatedCount: result.truncatedCount,
    skippedCount: result.skippedCount,
  }, null, 2) + '\n', 'utf8');

  return result;
}

function main() {
  console.log(`${MAGENTA}==============================================${NC}`);
  console.log(`${MAGENTA}     Claude Code localization${NC}`);
  console.log(`${MAGENTA}==============================================${NC}`);
  console.log('');

  const info = getClaudeInstallInfo();
  const keyword = require(path.join(__dirname, 'keyword.js'));

  console.log(`${CYAN}Mode: ${info.mode}${NC}`);
  console.log(`${CYAN}Version: ${info.version}${NC}`);
  console.log(`${GREEN}Target: ${info.mode === 'legacy' ? info.cliPath : info.binPath}${NC}`);
  console.log(`${GREEN}Backup: ${info.versionedBackupPath}${NC}`);
  console.log('');
  console.log(`${MAGENTA}Applying localization...${NC}`);
  console.log('');

  const result = info.mode === 'legacy'
    ? localizeLegacy(info, keyword)
    : localizeNative(info, keyword);

  console.log('');
  console.log(`${MAGENTA}Localized ${result.processedCount}/${result.totalEntries} entries, ${result.totalReplacements} replacements${NC}`);
  if (info.mode === 'native') {
    console.log(`${YELLOW}Binary mode truncated ${result.truncatedCount} entries to fit fixed byte lengths${NC}`);
    console.log(`${YELLOW}Binary mode skipped ${result.skippedCount} entries that were not found in the current binary${NC}`);
  }
  console.log(`${YELLOW}Claude Code localization complete${NC}`);
}

main();
