#!/usr/bin/env node

/**
 * Original author: 关镇江
 * Private enhanced edition monitor status line.
 */

const { DEFAULT_STATUS_TEXT } = require('./constants');
const {
  formatCompactNumber,
  formatPercent,
  formatUsd,
  normalizeModelName,
  getDisplayWidth,
  truncateDisplayText,
} = require('./formatters');
const { countModelCalls } = require('./transcript-counter');

function readStdin() {
  return new Promise(resolve => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      resolve(data);
    });
    process.stdin.resume();
  });
}

function parseInput(raw) {
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function getUsedPercentage(input) {
  const contextPercent = input?.context?.percent_used;
  if (Number.isFinite(contextPercent)) return contextPercent;

  const used = input?.context_window?.used_percentage;
  if (Number.isFinite(used)) return used;

  const currentUsage = input?.context_window?.current_usage;
  const contextWindowSize = Number(input?.context_window?.context_window_size || 0);
  if (!currentUsage || !contextWindowSize) return 0;

  const total =
    Number(currentUsage.input_tokens || 0)
    + Number(currentUsage.output_tokens || 0)
    + Number(currentUsage.cache_creation_input_tokens || 0)
    + Number(currentUsage.cache_read_input_tokens || 0);

  return contextWindowSize > 0 ? (total / contextWindowSize) * 100 : 0;
}

function getTotalInputTokens(input) {
  const candidates = [
    input?.context_window?.total_input_tokens,
    input?.usage?.input_tokens,
    input?.usage?.total_input_tokens,
  ];

  for (const candidate of candidates) {
    if (Number.isFinite(candidate)) return Number(candidate);
  }

  return 0;
}

function getTotalOutputTokens(input) {
  const candidates = [
    input?.context_window?.total_output_tokens,
    input?.usage?.output_tokens,
    input?.usage?.total_output_tokens,
  ];

  for (const candidate of candidates) {
    if (Number.isFinite(candidate)) return Number(candidate);
  }

  return 0;
}

function getTotalCost(input) {
  const candidates = [
    input?.cost?.total_cost_usd,
    input?.cost?.usd,
    input?.cost_usd,
  ];

  for (const candidate of candidates) {
    if (Number.isFinite(candidate)) return Number(candidate);
  }

  return 0;
}

function parsePositiveInt(value) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? Math.floor(num) : 0;
}

function getPreferredMode() {
  const mode = String(process.env.CLAUDE_HOOKS_STATUSLINE_MODE || 'auto').trim().toLowerCase();
  if (['auto', 'full', 'compact', 'mini'].includes(mode)) return mode;
  return 'auto';
}

function getTargetWidth() {
  const explicitWidth = parsePositiveInt(process.env.CLAUDE_HOOKS_STATUSLINE_WIDTH);
  if (explicitWidth) return explicitWidth;

  const envColumns = parsePositiveInt(process.env.COLUMNS);
  if (envColumns) return envColumns;

  const stdoutColumns = parsePositiveInt(process.stdout?.columns);
  if (stdoutColumns) return stdoutColumns;

  // Claude Code 调 status line 时通常拿不到 tty 宽度。
  // 这里默认按较窄终端处理，避免 PowerShell / CMD 中被右侧提示挤掉。
  return process.platform === 'win32' ? 56 : 64;
}

function wrapSegments(prefix, segments, maxWidth) {
  const width = Math.max(20, Number(maxWidth || 0));
  const lines = [];
  let current = prefix;

  for (const segment of segments) {
    const separator = current && current !== prefix ? ' | ' : ' ';
    const candidate = current ? `${current}${separator}${segment}` : segment;

    if (getDisplayWidth(candidate) <= width) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
    }
    current = segment;
  }

  if (current) {
    lines.push(current);
  }

  return lines.join('\n');
}

function buildStatusVariants(input, callCount) {
  const model = normalizeModelName(input?.model?.display_name, input?.model?.id);
  const totalInputTokens = getTotalInputTokens(input);
  const totalOutputTokens = getTotalOutputTokens(input);
  const totalCost = getTotalCost(input);
  const usedPercentage = getUsedPercentage(input);
  const fullModel = truncateDisplayText(model, 18);
  const compactModel = truncateDisplayText(model, 12);
  const verboseSegments = [
    `调用次数 ${callCount}`,
    `使用模型 ${fullModel}`,
    `输入Token ${formatCompactNumber(totalInputTokens)}`,
    `输出Token ${formatCompactNumber(totalOutputTokens)}`,
    `费用 ${formatUsd(totalCost)}`,
    `上下文 ${formatPercent(usedPercentage)}`,
  ];
  const compactSegments = [
    `调用${callCount}次`,
    `模型${compactModel}`,
    `输入${formatCompactNumber(totalInputTokens)}`,
    `输出${formatCompactNumber(totalOutputTokens)}`,
    `费用${formatUsd(totalCost)}`,
    `上下文${formatPercent(usedPercentage)}`,
  ];

  return [
    {
      singleLine: `Claude 监控: ${verboseSegments.join(' | ')}`,
      wrapped: wrapSegments('Claude 监控:', verboseSegments, getTargetWidth()),
    },
    {
      singleLine: `监控: ${compactSegments.join(' | ')}`,
      wrapped: wrapSegments('监控:', compactSegments, getTargetWidth()),
    },
    {
      singleLine: `监控: ${compactSegments.join(' | ')}`,
      wrapped: wrapSegments('监控:', compactSegments, Math.max(26, getTargetWidth() - 8)),
    },
    {
      singleLine: compactSegments.join(' | '),
      wrapped: wrapSegments('', compactSegments, Math.max(20, getTargetWidth() - 12)),
    },
  ];
}

function buildStatusText(input, callCount) {
  const mode = getPreferredMode();
  const width = getTargetWidth();
  const variants = buildStatusVariants(input, callCount);

  if (mode === 'full') return variants[0].singleLine;
  if (mode === 'compact') return variants[1].wrapped;
  if (mode === 'mini') return variants[3].wrapped;

  for (const variant of variants) {
    if (getDisplayWidth(variant.singleLine) <= width) {
      return variant.singleLine;
    }
  }
  return variants[1].wrapped;
}

async function main() {
  try {
    const raw = await readStdin();
    const input = parseInput(raw);
    if (!input) {
      process.stdout.write(`${DEFAULT_STATUS_TEXT}\n`);
      return;
    }

    const sessionId = input.session_id || '';
    const transcriptPath = input.transcript_path || '';
    const { callCount } = countModelCalls(sessionId, transcriptPath);
    process.stdout.write(`${buildStatusText(input, callCount)}\n`);
  } catch (error) {
    process.stdout.write(`${DEFAULT_STATUS_TEXT}\n`);
  }
}

module.exports = {
  buildStatusText,
  getTotalCost,
  getTotalInputTokens,
  getTotalOutputTokens,
  getUsedPercentage,
  getTargetWidth,
  getPreferredMode,
  buildStatusVariants,
  main,
};

if (require.main === module) {
  main();
}
