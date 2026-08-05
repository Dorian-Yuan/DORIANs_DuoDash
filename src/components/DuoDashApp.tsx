import { useState, useMemo, Suspense, lazy } from 'react';
import type { ReactElement } from 'react';
import { useDashboardData } from '../hooks/useDashboardData';
import { buildDemoData } from '../utils/demo-data';
import { LoginScreen, Navbar, LoadingScreen, ErrorScreen, DashboardView } from './dashboard';
import { ShareModal } from './share';
import { MESSAGES } from '../constants/messages';
import type { UserData, DisplayMode } from '../types';

// Kiosk（/kiosk）是独立路由，静态引入会把其图表链打进标准仪表盘主包；
// 懒加载让 / 页不再拉取 kiosk 分块，两个视图各自成块。
const LazyKioskView = lazy(() => import('./dashboard/KioskView').then((m) => ({ default: m.KioskView })));

const PLACEHOLDER_DATA: UserData = {
  username: 'Duolingo 用户',
  displayName: 'Duolingo 用户',
  streak: 0,
  totalXp: 0,
  gems: 0,
  league: MESSAGES.PLACEHOLDER.LOADING,
  leagueTier: -1,
  learningLanguage: '—',
  creationDate: '—',
  accountAgeDays: 0,
  isPlus: false,
  dailyGoal: 0,
  estimatedLearningTime: '—',
  courses: [],
  dailyXpHistory: [],
  dailyTimeHistory: [],
  yearlyXpHistory: [],
};

function DuoDashApp({ displayMode = 'standard' }: { displayMode?: DisplayMode }): ReactElement {
  const { userData, loading, error, showLogin, lastUpdated, isDemo, setIsDemo, refresh, resetToLogin, setUserData } = useDashboardData();
  const [showShareModal, setShowShareModal] = useState(false);

  function handleDemo(): void {
    localStorage.setItem('duodash:isDemo', 'true');
    setIsDemo(true);
    setUserData(buildDemoData());
  }

  function handleExitDemo(): void {
    resetToLogin();
  }

  const viewData = userData ?? PLACEHOLDER_DATA;
  const hasUserData = userData !== null;

  const xpSummary = useMemo(() => {
    const total = viewData.dailyXpHistory.reduce((sum, d) => sum + d.xp, 0);
    return `近 7 天共获得 ${total} XP`;
  }, [viewData.dailyXpHistory]);

  const timeSummary = useMemo(() => {
    const total = (viewData.dailyTimeHistory ?? []).reduce((sum, d) => sum + d.time, 0);
    const hours = Math.floor(total / 60);
    const mins = total % 60;
    return `近 7 天学习 ${hours > 0 ? `${hours}小时${mins}分钟` : `${mins}分钟`}`;
  }, [viewData.dailyTimeHistory]);

  if (loading && !hasUserData) {
    return <LoadingScreen />;
  }

  if (!hasUserData && !showLogin && Boolean(error)) {
    return <ErrorScreen error={error!} onRetry={refresh} />;
  }

  if (!hasUserData && showLogin) {
    return (
      <LoginScreen
        onDemo={handleDemo}
        error={error}
      />
    );
  }

  if (displayMode === 'kiosk') {
    return (
      <div className="h-[100dvh] overflow-hidden bg-surface-background">
        <Suspense fallback={<div className="h-[100dvh] w-full animate-pulse bg-surface-background" />}>
          <LazyKioskView userData={userData} viewData={viewData} />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-surface-background">
      {isDemo && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-500/25 py-2.5 px-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center">
            <span className="text-amber-800 dark:text-amber-300 text-xs font-bold">
              当前正在浏览演示数据。
            </span>
            <button
              onClick={handleExitDemo}
              className="text-xs font-extrabold text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-500/15 hover:bg-amber-200 dark:hover:bg-amber-500/25 border border-amber-300 dark:border-amber-500/30 px-3 py-1 rounded-button transition-colors cursor-pointer"
            >
              配置真实数据
            </button>
          </div>
        </div>
      )}

      <Navbar loading={loading} lastUpdated={lastUpdated} onRefresh={refresh} onShare={() => setShowShareModal(true)} />

      <DashboardView
        userData={userData}
        viewData={viewData}
        xpSummary={xpSummary}
        timeSummary={timeSummary}
      />

      {userData && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          userData={userData}
        />
      )}
    </div>
  );
}

export default DuoDashApp;
