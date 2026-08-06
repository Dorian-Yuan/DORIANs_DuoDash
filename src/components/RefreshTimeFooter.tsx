import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';

interface SnapshotMeta {
  generatedAt?: string;
  timezone?: string;
}

// 页面底部展示数据快照的刷新时间（由 GitHub Actions 定时生成）
export function RefreshTimeFooter(): ReactElement {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // 与仪表盘请求同一 URL，命中浏览器 HTTP 缓存，不产生额外网络请求
        const response = await fetch(`${import.meta.env.BASE_URL}snapshot.json`, { cache: 'force-cache' });
        if (!response.ok) {
          return;
        }
        const meta = (await response.json()) as SnapshotMeta;
        if (cancelled || !meta.generatedAt) {
          return;
        }
        const timeZone = meta.timezone || 'Asia/Shanghai';
        const formatted = new Intl.DateTimeFormat('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone,
        }).format(new Date(meta.generatedAt));
        setLabel(`数据快照更新于 ${formatted}（${timeZone}）`);
      } catch {
        // 获取失败时不展示刷新时间
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!label) {
    return <></>;
  }

  return (
    <p className="mt-1" aria-live="polite">
      {label}
    </p>
  );
}
