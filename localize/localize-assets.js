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

const descriptionMap = require('./description-map.js');
const mappedDescriptions = new Set(Object.keys(descriptionMap));

function uniq(items) {
  return [...new Set(items.filter(Boolean))];
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

function replaceDescriptionLine(content, filePath) {
  if (!content.startsWith('---')) {
    return { changed: false, content };
  }

  const endIndex = content.indexOf('\n---', 3);
  if (endIndex === -1) {
    return { changed: false, content };
  }

  const frontmatter = content.slice(0, endIndex + 4);
  let changed = false;

  const updatedFrontmatter = frontmatter.replace(/^description:\s*(.+)$/m, (line, rawValue) => {
    const trimmed = rawValue.trim();
    if (trimmed === '|' || trimmed === '>') {
      return line;
    }

    const plain = normalizeQuotes(trimmed);
    const translated = descriptionMap[plain];
    if (!translated || translated === plain) {
      return line;
    }

    changed = true;
    return `description: ${JSON.stringify(translated)}`;
  });

  if (!changed) {
    return { changed: false, content };
  }

  return {
    changed: true,
    content: updatedFrontmatter + content.slice(endIndex + 4),
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
      walkMarkdownFiles(fullPath, maxDepth, depth + 1, bucket);
      continue;
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      bucket.push(fullPath);
    }
  }
  return bucket;
}

function detectWorkspaceCommandDirs() {
  const home = os.homedir();
  const candidateRoots = uniq([
    path.join(home, 'Desktop'),
    path.join(home, 'Documents'),
    path.join(home, 'Projects'),
    path.join(home, 'Code'),
    path.join(home, 'workspace'),
    'D:\\Desktop',
    'D:\\Projects',
    'D:\\Code',
    'E:\\Projects',
  ]);

  const commandDirs = [];
  for (const root of candidateRoots) {
    if (!fs.existsSync(root)) {
      continue;
    }

    let entries = [];
    try {
      entries = fs.readdirSync(root, { withFileTypes: true });
    } catch (_) {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }
      const commandDir = path.join(root, entry.name, '.claude', 'commands');
      if (fs.existsSync(commandDir)) {
        commandDirs.push(commandDir);
      }
    }

    const directCommandDir = path.join(root, '.claude', 'commands');
    if (fs.existsSync(directCommandDir)) {
      commandDirs.push(directCommandDir);
    }
  }

  return uniq(commandDirs);
}

function resolveTargetDirs(argv) {
  const explicitTargets = argv.map(arg => path.resolve(arg));
  if (explicitTargets.length > 0) {
    return explicitTargets;
  }

  const pluginCacheDir = path.join(os.homedir(), '.claude', 'plugins', 'cache');
  return uniq([pluginCacheDir, ...detectWorkspaceCommandDirs()]);
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
    const files = walkMarkdownFiles(target);
    for (const file of files) {
      scannedFiles += 1;
      try {
        const content = fs.readFileSync(file, 'utf8');
        const descriptionMatch = content.match(/^description:\s*(.+)$/m);
        if (!descriptionMatch) {
          continue;
        }
        const plain = normalizeQuotes(descriptionMatch[1].trim());
        if (!mappedDescriptions.has(plain)) {
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
