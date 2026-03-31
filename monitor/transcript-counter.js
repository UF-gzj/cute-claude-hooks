#!/usr/bin/env node

/**
 * Original author: 关镇江
 * Private enhanced edition transcript counter.
 */

const fs = require('fs');
const { StringDecoder } = require('string_decoder');
const { createEmptyCache, readSessionCache, writeSessionCache } = require('./stats-cache');

const CHUNK_SIZE = 64 * 1024;

function hasMeaningfulUsage(usage) {
  if (!usage || typeof usage !== 'object') return false;

  const numericFields = [
    'input_tokens',
    'output_tokens',
    'cache_creation_input_tokens',
    'cache_read_input_tokens',
  ];

  return numericFields.some(field => Number(usage[field] || 0) > 0)
    || Number(usage?.server_tool_use?.web_search_requests || 0) > 0
    || Number(usage?.server_tool_use?.web_fetch_requests || 0) > 0;
}

function extractResponseId(entry) {
  if (!entry || entry.type !== 'assistant') return null;
  if (!entry.message || typeof entry.message !== 'object') return null;
  if (typeof entry.message.id !== 'string' || !entry.message.id.trim()) return null;
  if (!hasMeaningfulUsage(entry.message.usage)) return null;
  return entry.message.id;
}

function parseChunkForResponseIds(chunk) {
  const ids = [];
  const lines = String(chunk || '').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    try {
      const parsed = JSON.parse(trimmed);
      const responseId = extractResponseId(parsed);
      if (responseId) ids.push(responseId);
    } catch (error) {
      // Ignore incomplete trailing lines or non-JSON entries.
    }
  }

  return ids;
}

function readFileSliceUtf8(filePath, start, end) {
  const length = Math.max(0, end - start);
  if (length === 0) return '';

  const fd = fs.openSync(filePath, 'r');
  try {
    const buffer = Buffer.alloc(length);
    const bytesRead = fs.readSync(fd, buffer, 0, length, start);
    return buffer.subarray(0, bytesRead).toString('utf8');
  } finally {
    fs.closeSync(fd);
  }
}

function scanFileForResponseIds(filePath, start, end) {
  const ids = [];
  const fd = fs.openSync(filePath, 'r');
  const decoder = new StringDecoder('utf8');
  let offset = Math.max(0, start || 0);
  let leftover = '';

  try {
    while (offset < end) {
      const size = Math.min(CHUNK_SIZE, end - offset);
      const buffer = Buffer.alloc(size);
      const bytesRead = fs.readSync(fd, buffer, 0, size, offset);
      if (bytesRead <= 0) {
        break;
      }

      offset += bytesRead;
      const chunk = leftover + decoder.write(buffer.subarray(0, bytesRead));
      const lines = chunk.split(/\r?\n/);
      leftover = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          const parsed = JSON.parse(trimmed);
          const responseId = extractResponseId(parsed);
          if (responseId) ids.push(responseId);
        } catch (error) {
          // Ignore malformed lines while scanning large transcripts.
        }
      }
    }

    const tail = leftover + decoder.end();
    if (tail.trim()) {
      try {
        const parsed = JSON.parse(tail.trim());
        const responseId = extractResponseId(parsed);
        if (responseId) ids.push(responseId);
      } catch (error) {
        // Ignore incomplete trailing content.
      }
    }
  } finally {
    fs.closeSync(fd);
  }

  return ids;
}

function rebuildCache(sessionId, transcriptPath, stat) {
  const seenSet = new Set(scanFileForResponseIds(transcriptPath, 0, stat.size));

  return {
    sessionId,
    transcriptPath,
    lastSize: stat.size,
    lastMtimeMs: stat.mtimeMs,
    seenResponseIds: Array.from(seenSet),
    callCount: seenSet.size,
    updatedAt: new Date().toISOString(),
  };
}

function countModelCalls(sessionId, transcriptPath) {
  if (!sessionId || !transcriptPath) {
    return { callCount: 0, cache: createEmptyCache(sessionId, transcriptPath) };
  }

  if (!fs.existsSync(transcriptPath)) {
    const empty = createEmptyCache(sessionId, transcriptPath);
    writeSessionCache(sessionId, empty);
    return { callCount: 0, cache: empty };
  }

  const stat = fs.statSync(transcriptPath);
  let cache = readSessionCache(sessionId, transcriptPath);

  const shouldRebuild =
    cache.transcriptPath !== transcriptPath
    || cache.lastSize > stat.size
    || !Array.isArray(cache.seenResponseIds);

  if (shouldRebuild) {
    cache = rebuildCache(sessionId, transcriptPath, stat);
    writeSessionCache(sessionId, cache);
    return { callCount: cache.callCount, cache };
  }

  if (cache.lastSize === stat.size && cache.lastMtimeMs === stat.mtimeMs) {
    return { callCount: cache.callCount, cache };
  }

  const seenSet = new Set(cache.seenResponseIds);
  const newIds = scanFileForResponseIds(transcriptPath, cache.lastSize || 0, stat.size);

  for (const id of newIds) {
    seenSet.add(id);
  }

  cache = {
    sessionId,
    transcriptPath,
    lastSize: stat.size,
    lastMtimeMs: stat.mtimeMs,
    seenResponseIds: Array.from(seenSet),
    callCount: seenSet.size,
    updatedAt: new Date().toISOString(),
  };

  writeSessionCache(sessionId, cache);
  return { callCount: cache.callCount, cache };
}

module.exports = {
  countModelCalls,
  hasMeaningfulUsage,
  extractResponseId,
  parseChunkForResponseIds,
  scanFileForResponseIds,
};
