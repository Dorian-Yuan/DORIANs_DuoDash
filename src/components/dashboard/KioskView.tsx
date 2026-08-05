import { memo, useMemo } from 'react';
import type { ReactElement, ReactNode } from 'react';
import type { UserData } from '../../types';
import { BigStatTile } from './BigStatTile';
import AreaHistoryChart from '../charts/AreaHistoryChart';
import { HeatmapChart } from '../charts/HeatmapChart';
import { CourseList } from './CourseList';
import { AchievementsSection } from '../achievements/AchievementsSection';
import {
  CourseIcon,
  GemsIcon,
  LeagueIcon,
  StreakIcon,
  TimeIcon,
  TotalXpIcon,
  TrendIcon,
} from '../icons';

interface KioskViewProps {
  userData: UserData | null;
  viewData: UserData;
}

interface KioskTile {
  key: string;
  label: string;
  value: string | number;
  icon: ReactNode;
  accentClass: string;
}

const ICON_CLASS = 'h-8 w-8 sm:h-11 sm:w-11';

function sumBy<K extends string>(list: Array<Record<K, number>> | undefined, key: K): number {
  return (list ?? []).reduce((sum, item) => sum + (item[key] ?? 0), 0);
}

function leagueLabel(league: string): string {
  return league.replace(/\s*\([^)]*\)\s*$/, '').trim() || '—';
}

function KioskPage({
  label,
  children,
  scrollable = false,
}: {
  label: string;
  children: ReactNode;
  scrollable?: boolean;
}): ReactElement {
  return (
    <section
      className="h-[100dvh] w-full shrink-0 snap-center p-2 sm:p-3"
      role="group"
      aria-label={label}
    >
      <div className={`panel-card h-full ${scrollable ? 'overflow-y-auto' : 'overflow-hidden'}`}>
        {children}
      </div>
    </section>
  );
}

export const KioskView = memo(function KioskView({ userData, viewData }: KioskViewProps): ReactElement {
  const hasUserData = userData !== null;
  const displayName = hasUserData
    ? viewData.displayName || viewData.username
    : '正在加载用户';

  const stats = useMemo<KioskTile[]>(() => {
    const unavailable = '—';
    const value = (number: number | undefined): number | string =>
      hasUserData && typeof number === 'number' ? number : unavailable;

    return [
      { key: 'streak', label: '连胜天数', value: value(viewData.streak), icon: <StreakIcon className={ICON_CLASS} />, accentClass: 'text-orange-500' },
      { key: 'xp', label: '总经验', value: value(viewData.totalXp), icon: <TotalXpIcon className={ICON_CLASS} />, accentClass: 'text-yellow-500' },
      { key: 'todayXp', label: '今日经验', value: value(viewData.xpToday ?? 0), icon: <TrendIcon className={ICON_CLASS} />, accentClass: 'text-brand-500' },
      { key: 'weekXp', label: '近 7 天经验', value: value(sumBy(viewData.dailyXpHistory, 'xp')), icon: <TrendIcon className={ICON_CLASS} />, accentClass: 'text-brand-500' },
      { key: 'minutes', label: '近 7 天分钟', value: value(sumBy(viewData.dailyTimeHistory, 'time')), icon: <TimeIcon className={ICON_CLASS} />, accentClass: 'text-status-info' },
      { key: 'gems', label: '宝石', value: value(viewData.gems), icon: <GemsIcon className={ICON_CLASS} />, accentClass: 'text-blue-500' },
      { key: 'league', label: '当前段位', value: hasUserData ? leagueLabel(viewData.league) : unavailable, icon: <LeagueIcon className={ICON_CLASS} />, accentClass: 'text-purple-500' },
      { key: 'courses', label: '语言课程', value: value(viewData.courses.length), icon: <CourseIcon className={ICON_CLASS} />, accentClass: 'text-blue-500' },
    ];
  }, [hasUserData, viewData]);

  const xpSummary = `近 7 天共获得 ${sumBy(viewData.dailyXpHistory, 'xp').toLocaleString()} XP`;
  const totalMinutes = sumBy(viewData.dailyTimeHistory, 'time');
  const timeSummary = `近 7 天学习 ${totalMinutes >= 60 ? `${Math.floor(totalMinutes / 60)} 小时 ${totalMinutes % 60} 分钟` : `${totalMinutes} 分钟`}`;

  return (
    <main
      className="hide-scrollbar flex h-[100dvh] w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain"
      aria-roledescription="carousel"
      aria-label={`${displayName}的学习成绩`}
    >
      <KioskPage label={`${displayName}的核心成绩`}>
        <div className="flex h-full flex-col p-2 sm:p-4">
          <div className="shrink-0 px-2 pb-2 pt-1 text-center sm:pb-4">
            <h1 className="truncate text-[clamp(1.15rem,4vw,2.2rem)] font-black text-neutral-800">
              {displayName}
            </h1>
            {viewData.username && viewData.displayName && viewData.displayName !== viewData.username && (
              <p className="truncate text-xs font-bold text-neutral-500 sm:text-sm">@{viewData.username}</p>
            )}
          </div>
          <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-4 gap-2 sm:grid-cols-4 sm:grid-rows-2 sm:gap-3">
            {stats.map(({ key, ...stat }) => (
              <BigStatTile key={key} {...stat} animated />
            ))}
          </div>
        </div>
      </KioskPage>

      <KioskPage label="年度学习热力图">
        <div className="flex h-full flex-col justify-center p-3 sm:p-6">
          <h2 className="mb-3 text-center text-[clamp(1.1rem,4vw,2rem)] font-black text-neutral-800">年度学习轨迹</h2>
          <HeatmapChart data={viewData.yearlyXpHistory ?? []} />
        </div>
      </KioskPage>

      <KioskPage label="最近 7 天学习趋势">
        <div className="flex h-full flex-col p-3 sm:p-5">
          <h2 className="mb-2 shrink-0 text-center text-[clamp(1.1rem,4vw,2rem)] font-black text-neutral-800 sm:mb-4">
            最近 7 天
          </h2>
          <div className="grid min-h-0 flex-1 grid-rows-2 gap-2 sm:gap-4">
            <div className="panel-card-muted flex min-h-0 items-center px-2 pt-2 sm:px-4">
              <AreaHistoryChart data={viewData.dailyXpHistory} dataKey="xp" color="#58cc02" label="经验" summary={xpSummary} />
            </div>
            <div className="panel-card-muted flex min-h-0 items-center px-2 pt-2 sm:px-4">
              <AreaHistoryChart data={viewData.dailyTimeHistory ?? []} dataKey="time" color="#1cb0f6" label="分钟" summary={timeSummary} />
            </div>
          </div>
        </div>
      </KioskPage>

      <KioskPage label="语言分布" scrollable>
        <div className="min-h-full p-2 sm:p-4">
          <CourseList courses={viewData.courses} />
        </div>
      </KioskPage>

      <KioskPage label="学习奖项" scrollable>
        <div className="min-h-full p-2 sm:p-4">
          <AchievementsSection data={viewData.yearlyXpHistory ?? []} />
        </div>
      </KioskPage>
    </main>
  );
});
