#!/usr/bin/env node

/**
 * Original author: 关镇江
 * Private enhanced edition monitor cache helpers.
 */

const fs = require('fs');
const path = require('path');
const { MONITOR_DIR, CACHE_DIR } = require('./constants');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function ensureMonitorDirs() {
  ensureDir(MONITOR_DIR);
  ensureDir(CACHE_DIR);
}

function sanitizeSessionId(sessionId) {
  return String(sessionId || 'unknown-session').replace(/[^a-zA-Z0-9._-]/g, '_');
}

function getSessionCachePath(sessionId) {
  ensureMonitorDirs();
  return path.join(CACHE_DIR, `${sanitizeSessionId(sessionId)}.json`);
}

function createEmptyCache(sessionId, transcriptPath) {
  return {
    sessionId: String(sessionId || ''),
    transcriptPath: transcriptPath || '',
    lastSize: 0,
    lastMtimeMs: 0,
    seenResponseIds: [],
    callCount: 0,
    updatedAt: new Date(0).toISOString(),
  };
}

function normalizeCache(data, sessionId, transcriptPath) {
  const base = createEmptyCache(sessionId, transcriptPath);
  if (!data || typeof data !== 'object') return base;

  return {
    sessionId: typeof data.sessionId === 'string' ? data.sessionId : base.sessionId,
    transcriptPath:
      typeof data.transcriptPath === 'string' ? data.transcriptPath : base.transcriptPath,
    lastSize: Number.isFinite(data.lastSize) ? data.lastSize : 0,
    lastMtimeMs: Number.isFinite(data.lastMtimeMs) ? data.lastMtimeMs : 0,
    seenResponseIds: Array.isArray(data.seenResponseIds)
      ? data.seenResponseIds.filter(id => typeof id === 'string')
      : [],
    callCount: Number.isFinite(data.callCount) ? data.callCount : 0,
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : base.updatedAt,
  };
}

function readSessionCache(sessionId, transcriptPath) {
  const cachePath = getSessionCachePath(sessionId);
  if (!fs.existsSync(cachePath)) {
    return createEmptyCache(sessionId, transcriptPath);
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    return normalizeCache(parsed, sessionId, transcriptPath);
  } catch (error) {
    return createEmptyCache(sessionId, transcriptPath);
  }
}

function writeSessionCache(sessionId, cache) {
  const cachePath = getSessionCachePath(sessionId);
  ensureMonitorDirs();
  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8');
  return cachePath;
}

function resetSessionCache(sessionId, transcriptPath) {
  const cache = createEmptyCache(sessionId, transcriptPath);
  writeSessionCache(sessionId, cache);
  return cache;
}

module.exports = {
  ensureMonitorDirs,
  getSessionCachePath,
  createEmptyCache,
  readSessionCache,
  writeSessionCache,
  resetSessionCache,
};
