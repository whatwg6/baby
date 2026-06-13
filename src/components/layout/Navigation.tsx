import { BarChart3, Home, Rows3, Sparkles, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ViewKey } from "../../domain/types";

type NavigationItem = {
  key: ViewKey;
  label: string;
  icon: LucideIcon;
};

const navigationItems: NavigationItem[] = [
  { key: "home", label: "首页", icon: Home },
  { key: "timeline", label: "时间线", icon: Rows3 },
  { key: "data", label: "数据", icon: BarChart3 },
  { key: "profile", label: "档案", icon: UserRound },
];

export type NavigationProps = {
  activeView: ViewKey;
  onViewChange: (view: ViewKey) => void;
};

export function Navigation({ activeView, onViewChange }: NavigationProps) {
  return (
    <>
      <nav
        aria-label="主导航"
        className="fixed inset-x-3 bottom-3 z-20 rounded-card border border-line bg-white/95 p-1 shadow-panel backdrop-blur md:hidden"
      >
        <div className="grid grid-cols-4 gap-1">
          {navigationItems.map((item) => (
            <NavigationButton
              key={item.key}
              item={item}
              isActive={item.key === activeView}
              onClick={() => onViewChange(item.key)}
            />
          ))}
        </div>
      </nav>

      <nav
        aria-label="主导航"
        className="hidden min-h-screen w-60 shrink-0 border-r border-line/80 bg-white/90 px-4 py-5 shadow-soft backdrop-blur md:block"
      >
        <div className="mb-8 flex items-center gap-3 px-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-card bg-primary text-white shadow-soft">
            <Sparkles aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <p className="text-base font-semibold text-ink">宝宝成长</p>
            <p className="text-xs text-muted">日常记录台</p>
          </div>
        </div>

        <div className="space-y-1.5">
          {navigationItems.map((item) => (
            <NavigationButton
              key={item.key}
              item={item}
              isActive={item.key === activeView}
              onClick={() => onViewChange(item.key)}
            />
          ))}
        </div>
      </nav>
    </>
  );
}

function NavigationButton({
  item,
  isActive,
  onClick,
}: {
  item: NavigationItem;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={`flex min-h-14 w-full items-center justify-center gap-2 rounded-card px-2 py-2 text-xs font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-primary/30 md:min-h-12 md:justify-start md:px-3 md:text-sm ${
        isActive
          ? "bg-primary text-white shadow-soft"
          : "text-muted hover:bg-mist hover:text-ink"
      }`}
    >
      <Icon aria-hidden="true" className="h-5 w-5" />
      <span className="md:min-w-0 md:truncate">{item.label}</span>
    </button>
  );
}
