#!/usr/bin/env node

/**
 * Cute Claude Hooks - NPM Install Script
 * Safe localization and tool tips for Claude Code
 * License: MIT
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const MAGENTA = '\x1b[38;5;206m';
const GREEN = '\x1b[0;32m';
const YELLOW = '\x1b[0;33m';
const NC = '\x1b[0m';

console.log(`\n${MAGENTA}==============================================${NC}`);
console.log(`${MAGENTA}     Cute Claude Hooks Installer${NC}`);
console.log(`${MAGENTA}==============================================${NC}\n`);

// Get user home directory
const homeDir = os.homedir();
const claudeDir = path.join(homeDir, '.claude');
const hooksDir = path.join(claudeDir, 'hooks');
const localizeDir = path.join(claudeDir, 'localize');

// Get npm package directory
let npmDir;
try {
  npmDir = path.dirname(require.resolve('cute-claude-hooks/package.json'));
} catch (e) {
  // Fallback: use script's own directory
  npmDir = path.resolve(__dirname, '..');
}

console.log(`${GREEN}Package dir: ${npmDir}${NC}\n`);

// Create directory
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`${GREEN}Created: ${dir}${NC}`);
  }
}

// Copy file
function copyFile(src, dest) {
  try {
    fs.copyFileSync(src, dest);
    console.log(`${GREEN}Copied: ${path.basename(dest)}${NC}`);
    return true;
  } catch (err) {
    console.log(`${YELLOW}Copy failed: ${path.basename(dest)} - ${err.message}${NC}`);
    return false;
  }
}

// ========== Install Hook ==========
function installHook() {
  console.log(`${MAGENTA}Installing tool tips hook...${NC}\n`);

  ensureDir(hooksDir);

  const hookSrc = path.join(npmDir, 'tool-tips-post.sh');
  const hookDest = path.join(hooksDir, 'tool-tips-post.sh');

  if (fs.existsSync(hookSrc)) {
    copyFile(hookSrc, hookDest);

    // Set execute permission (Unix only)
    if (process.platform !== 'win32') {
      try {
        fs.chmodSync(hookDest, '755');
      } catch (err) {}
    }
  }

  // Update settings.json
  const settingsFile = path.join(claudeDir, 'settings.json');
  updateSettings(settingsFile, hookDest);
}

// ========== Update settings.json ==========
function updateSettings(settingsFile, hookPath) {
  let settings = {};

  if (fs.existsSync(settingsFile)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
    } catch (err) {
      console.log(`${YELLOW}Warning: Cannot read settings.json${NC}`);
    }
  }

  if (!settings.hooks) settings.hooks = {};
  if (!settings.hooks.PostToolUse) settings.hooks.PostToolUse = [];

  const matcher = 'Bash|Read|Write|Edit|Glob|Grep|mcp__*';
  const exists = settings.hooks.PostToolUse.some(
    h => h.matcher === matcher
  );

  if (!exists) {
    // Use 'sh' instead of 'bash' for better cross-platform compatibility
    // On Windows, Git Bash provides 'sh'; on Unix, 'sh' is always available
    const normalizedPath = hookPath.replace(/\\/g, '/');
    const hookCommand = process.platform === 'win32'
      ? `sh "${normalizedPath}"`
      : `bash "${normalizedPath}"`;

    settings.hooks.PostToolUse.push({
      matcher: matcher,
      hooks: [{
        type: 'command',
        command: hookCommand
      }]
    });

    try {
      fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
      console.log(`${GREEN}Updated: settings.json${NC}`);
    } catch (err) {
      console.log(`${YELLOW}Warning: Cannot update settings.json - ${err.message}${NC}`);
    }
  } else {
    console.log(`${YELLOW}Info: Hook already configured, skipping${NC}`);
  }
}

// ========== Install Localization ==========
function installLocalize() {
  console.log(`\n${MAGENTA}Installing localization...${NC}\n`);

  ensureDir(localizeDir);

  const localizeSrcDir = path.join(npmDir, 'localize');
  // Include localize.js (the new safe engine) plus all other files
  const files = [
    'keyword.conf',
    'localize.js',    // NEW: Safe Node.js localization engine
    'localize.sh',
    'localize.ps1',
    'localize.py',
    'restore.sh',
    'restore.ps1'
  ];

  files.forEach(file => {
    const src = path.join(localizeSrcDir, file);
    const dest = path.join(localizeDir, file);
    if (fs.existsSync(src)) {
      copyFile(src, dest);

      // Set execute permission (Unix only)
      if (process.platform !== 'win32' && file.endsWith('.sh')) {
        try {
          fs.chmodSync(dest, '755');
        } catch (err) {}
      }
    }
  });

  // Execute localization - prefer Node.js engine (safest)
  console.log(`\n${MAGENTA}Running localization...${NC}`);

  try {
    // Strategy 1: Use Node.js localize.js (safe description-only replacement)
    const jsScript = path.join(localizeDir, 'localize.js');
    if (fs.existsSync(jsScript)) {
      console.log(`${GREEN}Using safe Node.js localization engine${NC}`);
      execSync(`node "${jsScript}"`, { stdio: 'inherit' });
      return;
    }

    // Strategy 2: Fallback to shell scripts
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
    console.log(`${YELLOW}Warning: Localization encountered an issue${NC}`);
    console.log(`${YELLOW}You can run it manually: node ~/.claude/localize/localize.js${NC}`);
  }
}

// ========== Main ==========
function main() {
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

  console.log(`\n${MAGENTA}Installation complete!${NC}`);
  console.log(`${YELLOW}Docs: https://github.com/gugug168/cute-claude-hooks${NC}`);
  console.log(`${YELLOW}Restart Claude Code to take effect${NC}\n`);
}

main();
