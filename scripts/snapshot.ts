import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { transformDuolingoData } from '../src/services/duolingoService';
import { resolveTimeZone } from '../src/utils/dateUtils';
import type { DuolingoRawUser } from '../src/types';

const DUOLINGO_BASE_URL = 'https://www.duolingo.com';
const DEFAULT_TIMEOUT = 12000;
const SNAPSHOT_FILE = resolve(process.cwd(), 'public', 'snapshot.json');

interface FetchResult {
  data: unknown;
  status: number;
}

async function fetchWithTimeout(url: string, headers: HeadersInit, timeoutMs = DEFAULT_TIMEOUT): Promise<FetchResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    const text = await res.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    return { data, status: res.status };
  } catch {
    return { data: null, status: 0 };
  } finally {
    clearTimeout(timeoutId);
  }
}

const MAX_RETRIES = 3;

function isRetriable(result: FetchResult): boolean {
  return result.status === 0 || result.status === 429 || result.status >= 500;
}

async function fetchWithRetry(url: string, headers: HeadersInit, timeoutMs = DEFAULT_TIMEOUT): Promise<FetchResult> {
  let result: FetchResult = { data: null, status: 0 };
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    result = await fetchWithTimeout(url, headers, timeoutMs);
    if (!isRetriable(result) || attempt === MAX_RETRIES) {
      return result;
    }
    const delayMs = 3000 * attempt;
    console.log(`[snapshot] HTTP ${result.status}（第 ${attempt}/${MAX_RETRIES} 次），${delayMs / 1000} 秒后重试...`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return result;
}

function fail(message: string): never {
  console.error(`[snapshot] ${message}`);
  process.exit(1);
}

async function main(): Promise<void> {
  const username = process.env.DUOLINGO_USERNAME;
  const jwt = process.env.DUOLINGO_JWT;

  if (!username || !jwt || username === 'your_duolingo_username' || jwt === 'your_jwt_token_here') {
    fail('缺少 DUOLINGO_USERNAME 或 DUOLINGO_JWT 环境变量（请检查 GitHub Actions Secrets）');
  }

  const timezone = resolveTimeZone(process.env.SNAPSHOT_TIMEZONE || 'Asia/Shanghai');

  const headers: HeadersInit = {
    'User-Agent': 'Duolingo/7.41.4 (Android; 10; SM-G960F)',
    'Accept': 'application/json',
    'Authorization': `Bearer ${jwt}`,
  };

  // 1) 旧接口查询 userId
  const lookupResult = await fetchWithRetry(
    `${DUOLINGO_BASE_URL}/2017-06-30/users?username=${encodeURIComponent(username)}`,
    headers,
    10000
  );
  if (lookupResult.status === 401 || lookupResult.status === 403) {
    fail('JWT Token 已过期或无效，请重新获取 Duolingo JWT Token 并更新 GitHub Secrets');
  }
  const lookupRaw = lookupResult.data as { users?: unknown[] } | unknown;
  const lookupUser = (lookupRaw as { users?: Array<Record<string, unknown>> })?.users?.[0] ?? lookupRaw;
  const userId = (lookupUser as { id?: string; user_id?: string })?.id ?? (lookupUser as { user_id?: string })?.user_id;
  if (!userId) {
    const message = (lookupResult.data as { message?: string } | null)?.message;
    fail(`无法解析用户 ID（HTTP ${lookupResult.status}${message ? `，Duolingo 返回: ${message}` : ''}）。请检查 DUOLINGO_USERNAME 是否正确`);
  }

  // 2) 新接口获取完整用户数据（课程 / 成就等）
  const mainResult = await fetchWithRetry(
    `${DUOLINGO_BASE_URL}/2023-05-23/users/${userId}`,
    headers,
    10000
  );
  if (mainResult.status === 401 || mainResult.status === 403) {
    fail('JWT Token 已过期或无效，请重新获取 Duolingo JWT Token 并更新 GitHub Secrets');
  }
  const userData = mainResult.data as DuolingoRawUser;
  if (!userData) {
    fail('获取用户数据失败');
  }

  // 3) 获取 xp_summaries 用于构建历史数据
  const xpResult = await fetchWithRetry(
    `${DUOLINGO_BASE_URL}/2017-06-30/users/${userId}/xp_summaries?startDate=1970-01-01`,
    headers,
    12000
  );
  const xpData = xpResult.data as { summaries?: unknown[] } | null;
  if (xpData?.summaries) {
    userData._xpSummaries = xpData.summaries;
  }

  const transformed = transformDuolingoData(userData, timezone);
  const snapshot = {
    data: transformed,
    generatedAt: new Date().toISOString(),
    timezone,
  };

  mkdirSync(resolve(process.cwd(), 'public'), { recursive: true });
  writeFileSync(SNAPSHOT_FILE, JSON.stringify(snapshot), 'utf-8');
  console.log(`[snapshot] 已生成 ${SNAPSHOT_FILE}（用户: ${transformed.username}，时区: ${timezone}）`);
}

main().catch((error: unknown) => {
  console.error('[snapshot] 失败:', error);
  process.exit(1);
});
