import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  Boxes,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  Download,
  FileCheck2,
  FileText,
  Gauge,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  UserRound,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const API_BASE_URL = "http://127.0.0.1:8000";

type ComponentItem = {
  id: number;
  name: string;
  version: string;
  owner: string;
  license: string;
  risk_level: "Low" | "Medium" | "High" | string;
  review_status: "Approved" | "Pending" | "Needs Review" | string;
  last_updated: string;
  notes?: string | null;
};

type Summary = {
  total_components: number;
  high_risk_components: number;
  medium_risk_components: number;
  low_risk_components: number;
  pending_reviews: number;
  approved_components: number;
  needs_review: number;
};

type NavigationItem = {
  label: string;
  icon: typeof LayoutDashboard;
  badge?: number;
};

type ToastMessage = {
  type: "success" | "error";
  text: string;
};

const navigationItems: NavigationItem[] = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Components", icon: Boxes },
  { label: "Risks", icon: TriangleAlert },
  { label: "Reports", icon: FileText },
  { label: "Activity", icon: Activity },
];

const readinessTrend = [
  { month: "Jan", score: 58 },
  { month: "Feb", score: 63 },
  { month: "Mar", score: 66 },
  { month: "Apr", score: 72 },
  { month: "May", score: 76 },
  { month: "Jun", score: 82 },
];

function formatDate(dateValue: string): string {
  if (!dateValue) return "Not available";

  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function isOutdated(lastUpdated: string): boolean {
  const date = new Date(`${lastUpdated}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

  return date < twelveMonthsAgo;
}

function riskBadgeClasses(risk: string): string {
  switch (risk.toLowerCase()) {
    case "high":
      return "border-red-200 bg-red-50 text-red-700";
    case "medium":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "low":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function statusBadgeClasses(status: string): string {
  switch (status.toLowerCase()) {
    case "approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "needs review":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function App() {
  const [components, setComponents] = useState<ComponentItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [activeNavigation, setActiveNavigation] = useState("Overview");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<ToastMessage | null>(null);

  async function loadDashboardData(showRefreshState = false) {
    if (showRefreshState) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError("");

    try {
      const [componentsResponse, summaryResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/components`),
        fetch(`${API_BASE_URL}/summary`),
      ]);

      if (!componentsResponse.ok || !summaryResponse.ok) {
        throw new Error("The server returned an unsuccessful response.");
      }

      const componentsData: ComponentItem[] =
        await componentsResponse.json();

      const summaryData: Summary = await summaryResponse.json();

      setComponents(componentsData);
      setSummary(summaryData);

      if (showRefreshState) {
        showToast("success", "Compliance data refreshed.");
      }
    } catch (requestError) {
      console.error(requestError);

      setError(
        "The dashboard could not connect to the local compliance service. Make sure the FastAPI backend is running on port 8000.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  function showToast(type: ToastMessage["type"], text: string) {
    setToast({ type, text });

    window.setTimeout(() => {
      setToast(null);
    }, 3200);
  }

  function exportCsv() {
    window.open(`${API_BASE_URL}/export/csv`, "_blank");
    showToast("success", "Compliance report export started.");
  }

  useEffect(() => {
    void loadDashboardData();
  }, []);

  const outdatedComponents = useMemo(
    () => components.filter((component) => isOutdated(component.last_updated)),
    [components],
  );

  const componentsRequiringAttention = useMemo(
    () =>
      components.filter(
        (component) =>
          component.risk_level === "High" ||
          component.review_status !== "Approved" ||
          isOutdated(component.last_updated),
      ),
    [components],
  );

  const readinessScore = useMemo(() => {
    if (!summary || summary.total_components === 0) {
      return 0;
    }

    const approvedWeight =
      (summary.approved_components / summary.total_components) * 60;

    const lowRiskWeight =
      (summary.low_risk_components / summary.total_components) * 25;

    const freshnessWeight =
      ((summary.total_components - outdatedComponents.length) /
        summary.total_components) *
      15;

    return Math.round(
      Math.min(100, approvedWeight + lowRiskWeight + freshnessWeight),
    );
  }, [summary, outdatedComponents.length]);

  const topRiskComponents = useMemo(
    () =>
      [...components]
        .sort((first, second) => {
          const riskRank: Record<string, number> = {
            High: 3,
            Medium: 2,
            Low: 1,
          };

          return (
            (riskRank[second.risk_level] ?? 0) -
            (riskRank[first.risk_level] ?? 0)
          );
        })
        .slice(0, 5),
    [components],
  );

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#172033]">
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 hidden border-r border-[#e5e9f0] bg-[#111827] text-white transition-all duration-300 lg:flex lg:flex-col ${
            isSidebarCollapsed ? "w-[86px]" : "w-[248px]"
          }`}
        >
          <SidebarContent
            collapsed={isSidebarCollapsed}
            activeNavigation={activeNavigation}
            onNavigate={setActiveNavigation}
            onToggleCollapse={() =>
              setIsSidebarCollapsed((current) => !current)
            }
          />
        </aside>

        {/* Mobile backdrop */}
        {isMobileSidebarOpen && (
          <button
            aria-label="Close navigation"
            className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Mobile sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-[276px] flex-col bg-[#111827] text-white shadow-2xl transition-transform duration-300 lg:hidden ${
            isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <button
            aria-label="Close navigation"
            className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <X size={20} />
          </button>

          <SidebarContent
            collapsed={false}
            activeNavigation={activeNavigation}
            onNavigate={(item) => {
              setActiveNavigation(item);
              setIsMobileSidebarOpen(false);
            }}
          />
        </aside>

        {/* Main content */}
        <main
          className={`min-w-0 flex-1 transition-all duration-300 ${
            isSidebarCollapsed
              ? "lg:ml-[86px]"
              : "lg:ml-[248px]"
          }`}
        >
          <TopBar
            onOpenMobileNavigation={() => setIsMobileSidebarOpen(true)}
            onRefresh={() => void loadDashboardData(true)}
            isRefreshing={isRefreshing}
            isProfileMenuOpen={isProfileMenuOpen}
            onToggleProfileMenu={() =>
              setIsProfileMenuOpen((current) => !current)
            }
          />

          <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {activeNavigation === "Overview" ? (
              <OverviewPage
                components={components}
                summary={summary}
                readinessScore={readinessScore}
                outdatedComponents={outdatedComponents}
                componentsRequiringAttention={componentsRequiringAttention}
                topRiskComponents={topRiskComponents}
                isLoading={isLoading}
                error={error}
                onRetry={() => void loadDashboardData()}
                onExport={exportCsv}
                onNavigate={setActiveNavigation}
              />
            ) : (
              <PlaceholderPage
                title={activeNavigation}
                onReturn={() => setActiveNavigation("Overview")}
              />
            )}
          </div>
        </main>
      </div>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[100] flex max-w-sm items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-xl ${
            toast.type === "success"
              ? "border-emerald-200 bg-white text-emerald-800"
              : "border-red-200 bg-white text-red-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertTriangle size={18} />
          )}

          {toast.text}
        </div>
      )}
    </div>
  );
}

type SidebarContentProps = {
  collapsed: boolean;
  activeNavigation: string;
  onNavigate: (item: string) => void;
  onToggleCollapse?: () => void;
};

function SidebarContent({
  collapsed,
  activeNavigation,
  onNavigate,
  onToggleCollapse,
}: SidebarContentProps) {
  return (
    <>
      <div
        className={`flex h-[76px] items-center border-b border-white/10 ${
          collapsed ? "justify-center px-3" : "px-5"
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#6565e8] shadow-[0_8px_24px_rgba(101,101,232,0.35)]">
            <ShieldCheck size={23} strokeWidth={2.2} />
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold tracking-tight">
                ClearTrace
              </p>
              <p className="truncate text-[11px] font-medium text-slate-400">
                Compliance workspace
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-5">
        {!collapsed && (
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Workspace
          </p>
        )}

        <nav className="space-y-1.5">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNavigation === item.label;

            return (
              <button
                key={item.label}
                title={collapsed ? item.label : undefined}
                className={`group relative flex w-full items-center rounded-xl text-sm font-medium transition ${
                  collapsed
                    ? "h-11 justify-center px-2"
                    : "h-11 gap-3 px-3"
                } ${
                  isActive
                    ? "bg-white/[0.12] text-white shadow-inner shadow-white/[0.03]"
                    : "text-slate-400 hover:bg-white/[0.07] hover:text-white"
                }`}
                onClick={() => onNavigate(item.label)}
              >
                {isActive && (
                  <span className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-[#8b8bff]" />
                )}

                <Icon
                  size={19}
                  strokeWidth={isActive ? 2.2 : 1.9}
                  className={isActive ? "text-[#aaaaff]" : ""}
                />

                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>

                    {item.badge && (
                      <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] text-red-300">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-white/10 p-3">
        <button
          title={collapsed ? "Settings" : undefined}
          className={`mb-2 flex h-11 w-full items-center rounded-xl text-sm font-medium text-slate-400 transition hover:bg-white/[0.07] hover:text-white ${
            collapsed ? "justify-center px-2" : "gap-3 px-3"
          }`}
        >
          <Settings size={19} />

          {!collapsed && <span>Settings</span>}
        </button>

        {!collapsed && (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.05] p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Sparkles size={15} className="text-[#a7a7ff]" />
              Local workspace
            </div>

            <p className="text-[11px] leading-5 text-slate-400">
              All records are stored locally in your SQLite database.
            </p>
          </div>
        )}

        {onToggleCollapse && (
          <button
            className={`mt-3 hidden h-10 w-full items-center rounded-xl text-xs font-medium text-slate-400 transition hover:bg-white/[0.07] hover:text-white lg:flex ${
              collapsed ? "justify-center" : "gap-3 px-3"
            }`}
            onClick={onToggleCollapse}
          >
            {collapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <>
                <PanelLeftClose size={18} />
                Collapse sidebar
              </>
            )}
          </button>
        )}
      </div>
    </>
  );
}

type TopBarProps = {
  onOpenMobileNavigation: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  isProfileMenuOpen: boolean;
  onToggleProfileMenu: () => void;
};

function TopBar({
  onOpenMobileNavigation,
  onRefresh,
  isRefreshing,
  isProfileMenuOpen,
  onToggleProfileMenu,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-[#e5e9f0] bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          aria-label="Open navigation"
          className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 lg:hidden"
          onClick={onOpenMobileNavigation}
        >
          <Menu size={20} />
        </button>

        <div className="hidden items-center gap-2 text-sm text-slate-500 sm:flex">
          <span>Compliance workspace</span>
          <span className="text-slate-300">/</span>
          <span className="font-medium text-slate-800">Overview</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="hidden h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 sm:flex"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw
            size={16}
            className={isRefreshing ? "animate-spin" : ""}
          />
          Refresh
        </button>

        <button className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        <button className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">
          <CircleHelp size={18} />
        </button>

        <div className="relative">
          <button
            className="ml-1 flex h-11 items-center gap-2 rounded-xl border border-transparent px-1.5 transition hover:border-slate-200 hover:bg-slate-50"
            onClick={onToggleProfileMenu}
          >
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#e7e7ff] text-sm font-bold text-[#5656ca]">
              MA
            </div>

            <div className="hidden text-left md:block">
              <p className="text-xs font-semibold text-slate-800">
                Muhammad Ali
              </p>
              <p className="text-[11px] text-slate-500">Workspace admin</p>
            </div>

            <ChevronDown size={15} className="hidden text-slate-400 md:block" />
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 top-[52px] w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-[0_20px_60px_rgba(15,23,42,0.16)]">
              <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50">
                <UserRound size={17} />
                Profile
              </button>

              <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50">
                <Settings size={17} />
                Application settings
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

type OverviewPageProps = {
  components: ComponentItem[];
  summary: Summary | null;
  readinessScore: number;
  outdatedComponents: ComponentItem[];
  componentsRequiringAttention: ComponentItem[];
  topRiskComponents: ComponentItem[];
  isLoading: boolean;
  error: string;
  onRetry: () => void;
  onExport: () => void;
  onNavigate: (item: string) => void;
};

function OverviewPage({
  components,
  summary,
  readinessScore,
  outdatedComponents,
  componentsRequiringAttention,
  topRiskComponents,
  isLoading,
  error,
  onRetry,
  onExport,
  onNavigate,
}: OverviewPageProps) {
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  return (
    <>
      <section className="mb-7 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#5b5bd6]">
            <ShieldCheck size={17} />
            Compliance overview
          </div>

          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#172033] sm:text-[30px]">
            Good morning, Muhammad
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Review your software component posture, outstanding risks and
            records that require attention.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-500 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.11)]" />
            Local service connected
          </div>

          <button
            className="flex h-10 items-center gap-2 rounded-xl bg-[#5b5bd6] px-4 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(91,91,214,0.24)] transition hover:bg-[#4d4dc4]"
            onClick={onExport}
          >
            <Download size={17} />
            Generate report
          </button>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <ReadinessCard
          score={readinessScore}
          summary={summary}
          totalComponents={components.length}
        />

        <AttentionCard
          highRisk={summary?.high_risk_components ?? 0}
          pendingReviews={summary?.pending_reviews ?? 0}
          outdated={outdatedComponents.length}
          requiringAttention={componentsRequiringAttention.length}
          onViewRisks={() => onNavigate("Risks")}
        />
      </section>

      <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Components tracked"
          value={summary?.total_components ?? 0}
          subtitle="Local software inventory"
          icon={Boxes}
          iconClasses="bg-indigo-50 text-indigo-600"
          change="+3 this month"
        />

        <MetricCard
          title="Approved records"
          value={summary?.approved_components ?? 0}
          subtitle="Compliance review complete"
          icon={FileCheck2}
          iconClasses="bg-emerald-50 text-emerald-600"
          change={`${readinessPercentage(
            summary?.approved_components ?? 0,
            summary?.total_components ?? 0,
          )}% coverage`}
        />

        <MetricCard
          title="Open risks"
          value={
            (summary?.high_risk_components ?? 0) +
            (summary?.medium_risk_components ?? 0)
          }
          subtitle="Medium and high severity"
          icon={AlertTriangle}
          iconClasses="bg-red-50 text-red-600"
          change="Requires review"
        />

        <MetricCard
          title="Outdated records"
          value={outdatedComponents.length}
          subtitle="Not updated in 12 months"
          icon={Clock3}
          iconClasses="bg-amber-50 text-amber-600"
          change={
            outdatedComponents.length === 0
              ? "All records current"
              : "Action recommended"
          }
        />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <ReadinessTrendCard />
        <ReviewBreakdownCard summary={summary} />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <ComponentTablePreview
          components={topRiskComponents}
          onViewAll={() => onNavigate("Components")}
        />

        <RecentActivityCard
          components={components}
          onViewAll={() => onNavigate("Activity")}
        />
      </section>
    </>
  );
}

function ReadinessCard({
  score,
  summary,
  totalComponents,
}: {
  score: number;
  summary: Summary | null;
  totalComponents: number;
}) {
  const circumference = 2 * Math.PI * 54;
  const progressOffset = circumference - (score / 100) * circumference;

  return (
    <article className="relative overflow-hidden rounded-2xl border border-[#e4e8ef] bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.045)] sm:p-7">
      <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-indigo-100/50 blur-3xl" />

      <div className="relative grid gap-7 md:grid-cols-[190px_1fr] md:items-center">
        <div className="mx-auto">
          <div className="relative grid h-[158px] w-[158px] place-items-center">
            <svg
              className="-rotate-90"
              width="158"
              height="158"
              viewBox="0 0 128 128"
              aria-label={`Readiness score ${score} percent`}
            >
              <circle
                cx="64"
                cy="64"
                r="54"
                fill="none"
                stroke="#eef0f5"
                strokeWidth="10"
              />

              <circle
                cx="64"
                cy="64"
                r="54"
                fill="none"
                stroke="url(#readinessGradient)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={progressOffset}
              />

              <defs>
                <linearGradient
                  id="readinessGradient"
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#8585f4" />
                  <stop offset="100%" stopColor="#4f46c9" />
                </linearGradient>
              </defs>
            </svg>

            <div className="absolute text-center">
              <p className="text-[34px] font-semibold tracking-[-0.05em] text-slate-900">
                {score}%
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Ready
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-5">
            <div className="mb-1.5 flex items-center gap-2">
              <Gauge size={18} className="text-[#5b5bd6]" />
              <h2 className="font-semibold text-slate-900">
                Overall readiness
              </h2>
            </div>

            <p className="max-w-xl text-sm leading-6 text-slate-500">
              Your readiness score combines component approvals, risk levels
              and record freshness.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <ReadinessDetail
              label="Approved"
              value={summary?.approved_components ?? 0}
              total={totalComponents}
              status="good"
            />

            <ReadinessDetail
              label="Pending"
              value={summary?.pending_reviews ?? 0}
              total={totalComponents}
              status="warning"
            />

            <ReadinessDetail
              label="Needs review"
              value={summary?.needs_review ?? 0}
              total={totalComponents}
              status="danger"
            />
          </div>
        </div>
      </div>
    </article>
  );
}

function ReadinessDetail({
  label,
  value,
  total,
  status,
}: {
  label: string;
  value: number;
  total: number;
  status: "good" | "warning" | "danger";
}) {
  const styles = {
    good: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-red-500",
  };

  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
      <div className="mb-2 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${styles[status]}`} />
        <p className="text-xs font-medium text-slate-500">{label}</p>
      </div>

      <p className="text-xl font-semibold tracking-tight text-slate-900">
        {value}
        <span className="ml-1 text-xs font-medium text-slate-400">
          / {total}
        </span>
      </p>
    </div>
  );
}

function AttentionCard({
  highRisk,
  pendingReviews,
  outdated,
  requiringAttention,
  onViewRisks,
}: {
  highRisk: number;
  pendingReviews: number;
  outdated: number;
  requiringAttention: number;
  onViewRisks: () => void;
}) {
  const attentionRows = [
    {
      label: "High-risk components",
      value: highRisk,
      icon: AlertTriangle,
      iconClasses: "bg-red-50 text-red-600",
    },
    {
      label: "Pending reviews",
      value: pendingReviews,
      icon: Clock3,
      iconClasses: "bg-amber-50 text-amber-600",
    },
    {
      label: "Outdated records",
      value: outdated,
      icon: RefreshCw,
      iconClasses: "bg-indigo-50 text-indigo-600",
    },
  ];

  return (
    <article className="rounded-2xl border border-[#e4e8ef] bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.045)]">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            Priority
          </p>

          <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
            Needs your attention
          </h2>
        </div>

        <div className="grid h-10 min-w-10 place-items-center rounded-xl bg-red-50 text-sm font-bold text-red-600">
          {requiringAttention}
        </div>
      </div>

      <div className="space-y-2">
        {attentionRows.map((row) => {
          const Icon = row.icon;

          return (
            <div
              key={row.label}
              className="flex items-center gap-3 rounded-xl border border-transparent px-2 py-2.5 transition hover:border-slate-200 hover:bg-slate-50"
            >
              <div
                className={`grid h-9 w-9 place-items-center rounded-xl ${row.iconClasses}`}
              >
                <Icon size={17} />
              </div>

              <p className="flex-1 text-sm font-medium text-slate-700">
                {row.label}
              </p>

              <span className="text-sm font-semibold text-slate-900">
                {row.value}
              </span>
            </div>
          );
        })}
      </div>

      <button
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        onClick={onViewRisks}
      >
        Review attention items
        <ArrowRight size={16} />
      </button>
    </article>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClasses,
  change,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: typeof Boxes;
  iconClasses: string;
  change: string;
}) {
  return (
    <article className="rounded-2xl border border-[#e4e8ef] bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,0.035)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_34px_rgba(15,23,42,0.065)]">
      <div className="mb-5 flex items-start justify-between">
        <div className={`grid h-10 w-10 place-items-center rounded-xl ${iconClasses}`}>
          <Icon size={19} />
        </div>

        <button className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
          <MoreHorizontal size={18} />
        </button>
      </div>

      <p className="text-[13px] font-medium text-slate-500">{title}</p>

      <p className="mt-1 text-[30px] font-semibold tracking-[-0.045em] text-slate-900">
        {value}
      </p>

      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="truncate text-xs text-slate-400">{subtitle}</p>
        <p className="shrink-0 text-[11px] font-semibold text-slate-500">
          {change}
        </p>
      </div>
    </article>
  );
}

function ReadinessTrendCard() {
  return (
    <article className="rounded-2xl border border-[#e4e8ef] bg-white p-6 shadow-[0_8px_28px_rgba(15,23,42,0.035)]">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Readiness trend
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Overall compliance posture over the last six months
          </p>
        </div>

        <button className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
          Last 6 months
          <ChevronDown size={14} />
        </button>
      </div>

      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={readinessTrend}
            margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id="readinessArea"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#6868e8" stopOpacity={0.24} />
                <stop offset="100%" stopColor="#6868e8" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              vertical={false}
              stroke="#edf0f4"
              strokeDasharray="3 3"
            />

            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              dy={8}
            />

            <YAxis
              domain={[40, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
            />

            <Tooltip
              cursor={{ stroke: "#c7c7fb", strokeDasharray: "4 4" }}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                boxShadow: "0 12px 30px rgba(15, 23, 42, 0.1)",
                fontSize: 12,
              }}
              formatter={(value) => [`${value}%`, "Readiness"]}
            />

            <Area
              type="monotone"
              dataKey="score"
              stroke="#5b5bd6"
              strokeWidth={2.5}
              fill="url(#readinessArea)"
              activeDot={{
                r: 5,
                fill: "#5b5bd6",
                stroke: "#ffffff",
                strokeWidth: 3,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

function ReviewBreakdownCard({ summary }: { summary: Summary | null }) {
  const total = Math.max(summary?.total_components ?? 0, 1);

  const rows = [
    {
      label: "Approved",
      value: summary?.approved_components ?? 0,
      color: "bg-emerald-500",
    },
    {
      label: "Pending",
      value: summary?.pending_reviews ?? 0,
      color: "bg-amber-500",
    },
    {
      label: "Needs review",
      value: summary?.needs_review ?? 0,
      color: "bg-red-500",
    },
  ];

  return (
    <article className="rounded-2xl border border-[#e4e8ef] bg-white p-6 shadow-[0_8px_28px_rgba(15,23,42,0.035)]">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-slate-900">
          Review coverage
        </h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Current status of tracked component records
        </p>
      </div>

      <div className="mb-7 flex h-3 overflow-hidden rounded-full bg-slate-100">
        {rows.map((row) => (
          <div
            key={row.label}
            className={row.color}
            style={{ width: `${(row.value / total) * 100}%` }}
          />
        ))}
      </div>

      <div className="space-y-5">
        {rows.map((row) => {
          const percentage = Math.round((row.value / total) * 100);

          return (
            <div key={row.label}>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${row.color}`} />
                  <span className="text-sm font-medium text-slate-600">
                    {row.label}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-sm font-semibold text-slate-900">
                    {row.value}
                  </span>
                  <span className="ml-1 text-xs text-slate-400">
                    {percentage}%
                  </span>
                </div>
              </div>

              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${row.color}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function ComponentTablePreview({
  components,
  onViewAll,
}: {
  components: ComponentItem[];
  onViewAll: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-[#e4e8ef] bg-white shadow-[0_8px_28px_rgba(15,23,42,0.035)]">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Component inventory
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Records ordered by current risk priority
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              className="h-9 w-44 rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-700 transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white"
              placeholder="Search components"
            />
          </div>

          <button
            className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            onClick={onViewAll}
          >
            View all
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 text-left">
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                Component
              </th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                Owner
              </th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                License
              </th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                Risk
              </th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                Status
              </th>
              <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                Updated
              </th>
            </tr>
          </thead>

          <tbody>
            {components.map((component) => (
              <tr
                key={component.id}
                className="border-b border-slate-100 transition last:border-0 hover:bg-slate-50/70"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                      <Boxes size={17} />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {component.name}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        Version {component.version}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-4 text-xs font-medium text-slate-600">
                  {component.owner}
                </td>

                <td className="px-4 py-4 text-xs text-slate-600">
                  {component.license}
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${riskBadgeClasses(
                      component.risk_level,
                    )}`}
                  >
                    {component.risk_level}
                  </span>
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusBadgeClasses(
                      component.review_status,
                    )}`}
                  >
                    {component.review_status}
                  </span>
                </td>

                <td className="px-6 py-4 text-right text-[11px] text-slate-500">
                  {formatDate(component.last_updated)}
                </td>
              </tr>
            ))}

            {components.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-14 text-center">
                  <Boxes
                    size={28}
                    className="mx-auto mb-3 text-slate-300"
                  />
                  <p className="text-sm font-semibold text-slate-700">
                    No component records
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Add records through the Components workspace.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function RecentActivityCard({
  components,
  onViewAll,
}: {
  components: ComponentItem[];
  onViewAll: () => void;
}) {
  const activityItems = components.slice(0, 4).map((component, index) => ({
    id: component.id,
    title:
      component.review_status === "Approved"
        ? `${component.name} was approved`
        : `${component.name} requires review`,
    description: `${component.owner} · Version ${component.version}`,
    time: index === 0 ? "Just now" : `${index + 1} days ago`,
    success: component.review_status === "Approved",
  }));

  return (
    <article className="rounded-2xl border border-[#e4e8ef] bg-white p-6 shadow-[0_8px_28px_rgba(15,23,42,0.035)]">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Recent activity
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Latest updates in your workspace
          </p>
        </div>

        <button
          className="text-xs font-semibold text-[#5b5bd6] transition hover:text-[#4848bd]"
          onClick={onViewAll}
        >
          View all
        </button>
      </div>

      <div className="space-y-1">
        {activityItems.map((item, index) => (
          <div key={item.id} className="relative flex gap-3 py-3">
            {index !== activityItems.length - 1 && (
              <span className="absolute bottom-[-5px] left-[17px] top-[40px] w-px bg-slate-200" />
            )}

            <div
              className={`relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                item.success
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-amber-50 text-amber-600"
              }`}
            >
              {item.success ? (
                <Check size={16} />
              ) : (
                <AlertTriangle size={16} />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-700">
                {item.title}
              </p>
              <p className="mt-1 truncate text-xs text-slate-400">
                {item.description}
              </p>
            </div>

            <span className="shrink-0 pt-0.5 text-[10px] font-medium text-slate-400">
              {item.time}
            </span>
          </div>
        ))}

        {activityItems.length === 0 && (
          <div className="py-10 text-center">
            <Activity size={27} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">
              No activity yet
            </p>
          </div>
        )}
      </div>
    </article>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-7">
        <div className="h-4 w-40 rounded bg-slate-200" />
        <div className="mt-4 h-9 w-80 rounded-lg bg-slate-200" />
        <div className="mt-3 h-4 w-[520px] max-w-full rounded bg-slate-200" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <div className="h-[280px] rounded-2xl bg-white" />
        <div className="h-[280px] rounded-2xl bg-white" />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-[170px] rounded-2xl bg-white" />
        ))}
      </div>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="grid min-h-[620px] place-items-center">
      <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-red-600">
          <AlertTriangle size={26} />
        </div>

        <h2 className="mt-5 text-lg font-semibold text-slate-900">
          Local service unavailable
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">{message}</p>

        <button
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-[#5b5bd6] px-4 text-sm font-semibold text-white transition hover:bg-[#4d4dc4]"
          onClick={onRetry}
        >
          <RefreshCw size={16} />
          Try again
        </button>
      </div>
    </div>
  );
}

function PlaceholderPage({
  title,
  onReturn,
}: {
  title: string;
  onReturn: () => void;
}) {
  return (
    <div className="grid min-h-[650px] place-items-center">
      <div className="max-w-lg rounded-2xl border border-[#e4e8ef] bg-white p-10 text-center shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
          <Sparkles size={25} />
        </div>

        <h1 className="mt-5 text-xl font-semibold text-slate-900">
          {title} workspace
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          This screen will be built in the next stage. The navigation already
          works so that we can develop each module inside the same application
          shell.
        </p>

        <button
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-[#5b5bd6] px-4 text-sm font-semibold text-white transition hover:bg-[#4d4dc4]"
          onClick={onReturn}
        >
          Return to overview
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

function readinessPercentage(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

export default App;