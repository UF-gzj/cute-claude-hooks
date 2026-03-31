#!/usr/bin/env node

/**
 * Original author: 关镇江
 * Private enhanced edition monitor formatters.
 */

function stripTrailingZero(value) {
  return value.replace(/\.0$/, '');
}

function formatCompactNumber(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0';

  const abs = Math.abs(num);
  if (abs >= 1_000_000) {
    return `${stripTrailingZero((num / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1))}m`;
  }
  if (abs >= 1_000) {
    return `${stripTrailingZero((num / 1_000).toFixed(abs >= 100_000 ? 0 : 1))}k`;
  }
  return String(Math.round(num));
}

function formatUsd(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '$0.00';
  return `$${num.toFixed(2)}`;
}

function formatPercent(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0%';
  return `${Math.max(0, Math.round(num))}%`;
}

function normalizeModelName(displayName, modelId) {
  const raw = String(displayName || modelId || '').trim();
  if (!raw) return '未知模型';

  return raw
    .replace(/^Claude\s+/i, '')
    .replace(/^Anthropic\s+/i, '')
    .trim();
}

function getDisplayWidth(value) {
  let width = 0;
  for (const char of Array.from(String(value || ''))) {
    width += char.charCodeAt(0) > 255 ? 2 : 1;
  }
  return width;
}

function truncateDisplayText(value, maxWidth) {
  const text = String(value || '');
  const limit = Number(maxWidth || 0);
  if (!limit || getDisplayWidth(text) <= limit) return text;

  let width = 0;
  let output = '';
  for (const char of Array.from(text)) {
    const charWidth = char.charCodeAt(0) > 255 ? 2 : 1;
    if (width + charWidth > Math.max(1, limit - 1)) break;
    output += char;
    width += charWidth;
  }
  return `${output}…`;
}

module.exports = {
  formatCompactNumber,
  formatUsd,
  formatPercent,
  normalizeModelName,
  getDisplayWidth,
  truncateDisplayText,
};
