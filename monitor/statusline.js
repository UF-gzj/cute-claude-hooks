#!/usr/bin/env node

/**
 * Original author: 关镇江
 * Private enhanced edition monitor status line.
 */

const { DEFAULT_STATUS_TEXT } = require('./constants');
const { formatCompactNumber, formatPercent, formatUsd, normalizeModelName } = require('./formatters');
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

function buildStatusText(input, callCount) {
  const model = normalizeModelName(input?.model?.display_name, input?.model?.id);
  const totalInputTokens = getTotalInputTokens(input);
  const totalOutputTokens = getTotalOutputTokens(input);
  const totalCost = getTotalCost(input);
  const usedPercentage = getUsedPercentage(input);

  return `Claude 监控: ${
    [
      `调用 ${callCount} 次`,
      `模型 ${model}`,
      `输入 ${formatCompactNumber(totalInputTokens)}`,
      `输出 ${formatCompactNumber(totalOutputTokens)}`,
      formatUsd(totalCost),
      `上下文 ${formatPercent(usedPercentage)}`,
    ].join(' | ')
  }`;
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
  main,
};

if (require.main === module) {
  main();
}
