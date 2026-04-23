#!/usr/bin/env node
/**
 * localize-assets.js - 工作区命令描述与插件技能描述汉化
 * 优先处理 markdown frontmatter 中的 description 字段。
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const GREEN = '\x1b[0;32m';
const YELLOW = '\x1b[0;33m';
const CYAN = '\x1b[0;36m';
const NC = '\x1b[0m';
const IGNORED_DIR_NAMES = new Set([
  '$RECYCLE.BIN',
  'System Volume Information',
  'Windows',
  'Program Files',
  'Program Files (x86)',
  'ProgramData',
  'AppData',
  'node_modules',
  '.git',
]);

const descriptionMap = require('./description-map.js');
const normalizedDescriptionMap = new Map(
  Object.entries(descriptionMap).map(([key, value]) => [normalizeText(key), value]),
);

function uniq(items) {
  return [...new Set(items.filter(Boolean))];
}

function normalizeText(value) {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function normalizeQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function indentMultilineBlock(lines) {
  const nonEmpty = lines.filter(line => line.trim().length > 0);
  if (nonEmpty.length === 0) {
    return '';
  }

  const minIndent = Math.min(...nonEmpty.map(line => line.match(/^ */)[0].length));
  return lines.map(line => line.slice(minIndent)).join('\n').trim();
}

function translateDescription(rawValue) {
  const normalized = normalizeText(rawValue);
  if (!normalized || !/[A-Za-z]/.test(normalized)) {
    return null;
  }

  const direct = normalizedDescriptionMap.get(normalized);
  if (direct) {
    return direct;
  }

  let match = normalized.match(/^Short alias for (\/[\w:-]+)$/);
  if (match) {
    return `${match[1]} 的简写别名`;
  }

  match = normalized.match(/^Deprecated - use the (.+) skill instead$/);
  if (match) {
    return `已弃用，请改用 ${match[1]} 技能`;
  }

  return null;
}

function replaceDescriptionLine(content, filePath) {
  if (!content.startsWith('---')) {
    return { changed: false, content };
  }

  const endIndex = content.indexOf('\n---', 3);
  if (endIndex === -1) {
    return { changed: false, content };
  }

  const frontmatter = content.slice(0, endIndex + 4);
  const lines = frontmatter.split('\n');
  let changed = false;
  const rewritten = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const match = line.match(/^description:\s*(.*)$/);
    if (!match) {
      rewritten.push(line);
      continue;
    }

    const trimmed = match[1].trim();
    if (trimmed === '|' || trimmed === '>') {
      const blockLines = [];
      let lookahead = index + 1;
      while (lookahead < lines.length) {
        const candidate = lines[lookahead];
        if (candidate.startsWith('  ') || candidate.startsWith('\t') || candidate === '') {
          blockLines.push(candidate);
          lookahead += 1;
          continue;
        }
        break;
      }

      const translated = translateDescription(indentMultilineBlock(blockLines));
      if (translated) {
        rewritten.push(`description: ${JSON.stringify(translated)}`);
        changed = true;
      } else {
        rewritten.push(line);
        rewritten.push(...blockLines);
      }

      index = lookahead - 1;
      continue;
    }

    const plain = normalizeQuotes(trimmed);
    const translated = translateDescription(plain);
    if (translated && translated !== plain) {
      rewritten.push(`description: ${JSON.stringify(translated)}`);
      changed = true;
    } else {
      rewritten.push(line);
    }
  }

  if (!changed) {
    return { changed: false, content };
  }

  return {
    changed: true,
    content: rewritten.join('\n') + content.slice(endIndex + 4),
    filePath,
  };
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const result = replaceDescriptionLine(content, filePath);
  if (!result.changed) {
    return false;
  }
  fs.writeFileSync(filePath, result.content, 'utf8');
  console.log(`${GREEN}已汉化描述:${NC} ${filePath}`);
  return true;
}

function walkMarkdownFiles(rootDir, maxDepth = 5, depth = 0, bucket = []) {
  if (!fs.existsSync(rootDir) || depth > maxDepth) {
    return bucket;
  }

  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      if (IGNORED_DIR_NAMES.has(entry.name)) {
        continue;
      }
      walkMarkdownFiles(fullPath, maxDepth, depth + 1, bucket);
      continue;
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      bucket.push(fullPath);
    }
  }
  return bucket;
}

function isRelevantPluginMarkdown(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  return (
    /\/commands\/.+\.md$/i.test(normalized) ||
    /\/agents\/.+\.md$/i.test(normalized) ||
    /\/skills\/[^/]+\/SKILL\.md$/i.test(normalized)
  );
}

function getDriveRoots() {
  if (process.platform !== 'win32') {
    return ['/'];
  }

  const roots = [];
  for (let code = 67; code <= 90; code += 1) {
    const drive = `${String.fromCharCode(code)}:\\`;
    if (fs.existsSync(drive)) {
      roots.push(drive);
    }
  }
  return roots;
}

function findClaudeCommandDirs(rootDir, maxDepth = 4, depth = 0, bucket = []) {
  if (!fs.existsSync(rootDir) || depth > maxDepth) {
    return bucket;
  }

  let entries = [];
  try {
    entries = fs.readdirSync(rootDir, { withFileTypes: true });
  } catch (_) {
    return bucket;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    if (IGNORED_DIR_NAMES.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(rootDir, entry.name);
    if (entry.name === '.claude') {
      const commandDir = path.join(fullPath, 'commands');
      if (fs.existsSync(commandDir)) {
        bucket.push(commandDir);
      }
      continue;
    }

    findClaudeCommandDirs(fullPath, maxDepth, depth + 1, bucket);
  }

  return bucket;
}

function detectWorkspaceCommandDirs() {
  const home = os.homedir();
  const candidateRoots = uniq([
    process.cwd(),
    path.join(home, 'Desktop'),
    path.join(home, 'Documents'),
    path.join(home, 'Projects'),
    path.join(home, 'Code'),
    path.join(home, 'workspace'),
    'D:\\Desktop',
    'D:\\Projects',
    'D:\\Code',
    'E:\\Projects',
    ...getDriveRoots(),
  ]);

  const commandDirs = [];
  for (const root of candidateRoots) {
    if (!fs.existsSync(root)) {
      continue;
    }

    const directCommandDir = path.join(root, '.claude', 'commands');
    if (fs.existsSync(directCommandDir)) {
      commandDirs.push(directCommandDir);
    }

    findClaudeCommandDirs(root, 4, 0, commandDirs);
  }

  return uniq(commandDirs);
}

function resolveTargetDirs(argv) {
  const explicitTargets = argv.map(arg => path.resolve(arg));
  if (explicitTargets.length > 0) {
    return explicitTargets;
  }

  const pluginRootDir = path.join(os.homedir(), '.claude', 'plugins');
  const pluginCacheDir = path.join(pluginRootDir, 'cache');
  const pluginMarketplacesDir = path.join(pluginRootDir, 'marketplaces');
  return uniq([pluginCacheDir, pluginMarketplacesDir, ...detectWorkspaceCommandDirs()]);
}

function main() {
  const targets = resolveTargetDirs(process.argv.slice(2));
  if (targets.length === 0) {
    console.log(`${YELLOW}未发现可处理的命令或技能描述目录${NC}`);
    return;
  }

  console.log(`${CYAN}开始汉化命令与技能描述...${NC}`);
  let changedFiles = 0;
  let scannedFiles = 0;

  for (const target of targets) {
    if (!fs.existsSync(target)) {
      continue;
    }
    console.log(`${CYAN}扫描目录:${NC} ${target}`);
    let files = walkMarkdownFiles(target);
    const normalizedTarget = target.replace(/\\/g, '/');
    if (normalizedTarget.includes('/.claude/plugins/')) {
      files = files.filter(isRelevantPluginMarkdown);
    }
    for (const file of files) {
      scannedFiles += 1;
      try {
        const content = fs.readFileSync(file, 'utf8');
        if (!/^description:\s*(.+)$/m.test(content)) {
          continue;
        }
        if (processFile(file)) {
          changedFiles += 1;
        }
      } catch (err) {
        console.log(`${YELLOW}跳过文件: ${file} (${err.message})${NC}`);
      }
    }
  }

  console.log(`${CYAN}命令与技能描述汉化完成: 扫描 ${scannedFiles} 个文件，更新 ${changedFiles} 个文件${NC}`);
}

main();
