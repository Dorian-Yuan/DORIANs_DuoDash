import { memo } from 'react';
import type { ReactElement } from 'react';
import { ShareIcon } from '../icons';
import { CACHE_TTL_MS } from '../../constants/config';

interface NavbarProps {
  lastUpdated: number | null;
  onShare?: () => void;
}

function getUpdateStatusText(loading: boolean, lastUpdated: number | null, now: number): string {
  if (loading) return '正在更新…';
  if (lastUpdated) {
    const timeStr = new Date(lastUpdated).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    const isOld = now - lastUpdated > CACHE_TTL_MS;
    if (isOld) {
      return `缓存数据 (${timeStr})`;
    }
    return `更新于 ${timeStr}`;
  }
  return '尚未更新';
}

export const Navbar = memo(function Navbar({ lastUpdated, onShare }: NavbarProps): ReactElement {
  const now = Date.now();
  const isStale = Boolean(lastUpdated && now - lastUpdated > CACHE_TTL_MS);

  return (
    <nav className="bg-surface border-b border-neutral-100 sticky top-0 z-50" aria-label="主导航">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between h-14 sm:h-16">
          <div className="flex items-center gap-2">
            <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="Duo Owl" className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg" />
            <span className="font-extrabold text-xl sm:text-2xl text-[#58cc02] tracking-tight hidden xs:block">DuoDash</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex flex-col items-end leading-tight">
              <span className={`text-xs font-semibold ${isStale ? 'text-amber-500' : 'text-neutral-500'}`} aria-live="polite">
                {getUpdateStatusText(false, lastUpdated, now)}
              </span>
            </div>
            {onShare && (
              <button
                onClick={onShare}
                className="surface-button w-9 h-9 md:w-auto md:h-auto md:px-3 md:py-2"
                aria-label="打开分享卡片对话框"
              >
                <ShareIcon className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-800" aria-hidden="true" />
                <span className="hidden md:inline font-semibold text-neutral-800 text-sm">分享</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
});
