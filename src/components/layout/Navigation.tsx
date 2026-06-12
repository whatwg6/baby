import { BarChart3, Home, Rows3, UserRound } from "lucide-react";
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
      <nav aria-label="主导航" className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white md:hidden">
        <div className="grid grid-cols-4">
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
        className="hidden min-h-screen w-24 shrink-0 border-r border-line bg-white px-3 py-5 md:block"
      >
        <div className="space-y-2">
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
      className={`flex min-h-16 w-full flex-col items-center justify-center gap-1 rounded-card px-2 py-3 text-xs font-medium transition-colors ${
        isActive ? "bg-primary/10 text-primary" : "text-muted hover:bg-cream hover:text-ink"
      }`}
    >
      <Icon aria-hidden="true" className="h-5 w-5" />
      <span>{item.label}</span>
    </button>
  );
}
