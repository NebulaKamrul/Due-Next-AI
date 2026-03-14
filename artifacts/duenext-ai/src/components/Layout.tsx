import { Link, useLocation } from "wouter";
import { CalendarRange, Upload, ListChecks, BookOpen, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";

const navItems = [
  { href: "/", label: "Upload" },
  { href: "/results", label: "Results" },
  { href: "/how-to-import", label: "How to Import" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, toggle } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 bg-background border-b border-border/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Brand + toggle row */}
          <div className="h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarRange className="w-5 h-5 text-foreground" />
              <span className="font-semibold text-base tracking-tight text-foreground">DueNext</span>
            </div>

            {/* Dark mode toggle */}
            <button
              onClick={toggle}
              aria-label="Toggle dark mode"
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          {/* Nav tabs */}
          <div className="flex gap-6 -mb-px">
            {navItems.map(({ href, label }) => {
              const isActive = location === href;
              return (
                <Link key={href} href={href}>
                  <button
                    className={cn(
                      "py-3 text-sm font-medium border-b-2 transition-colors",
                      isActive
                        ? "border-foreground text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {label}
                  </button>
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {children}
      </main>
    </div>
  );
}
