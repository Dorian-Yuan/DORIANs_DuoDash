import { memo, useEffect, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';

interface BigStatTileProps {
  icon?: ReactNode;
  label: string;
  value: string | number;
  accentClass?: string;
  animated?: boolean;
}

/**
 * 大屏模式的单个大数字瓦片：数字按卡片自身宽度缩放，平板/手机上都醒目且不会溢出。
 * 图标与数字共用 accentClass（图标为 currentColor SVG，自动取色）。
 */
export const BigStatTile = memo(function BigStatTile({
  icon,
  label,
  value,
  accentClass = 'text-neutral-800',
  animated = false,
}: BigStatTileProps): ReactElement {
  const [displayValue, setDisplayValue] = useState<string | number>(animated && typeof value === 'number' ? 0 : value);

  useEffect(() => {
    if (!animated || typeof value !== 'number' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayValue(value);
      return;
    }

    let frame = 0;
    const startedAt = performance.now();
    const duration = 900;
    const tick = (now: number): void => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animated, value]);

  return (
    <div className="big-stat-tile panel-card animate-fade-in-up flex h-full min-w-0 flex-col items-center justify-center gap-2 overflow-hidden p-3 text-center sm:gap-4 sm:p-6">
      {icon && <div className={`${accentClass} opacity-90`}>{icon}</div>}
      <div
        className={`big-stat-value max-w-full whitespace-nowrap font-black tabular-nums leading-none ${accentClass} ${animated ? 'animate-kiosk-number' : ''}`}
      >
        {typeof displayValue === 'number' ? displayValue.toLocaleString() : displayValue}
      </div>
      <div className="text-[10px] sm:text-sm font-bold uppercase tracking-wide text-neutral-500">
        {label}
      </div>
    </div>
  );
});
