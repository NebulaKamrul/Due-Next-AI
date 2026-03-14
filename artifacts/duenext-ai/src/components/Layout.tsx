import { Link, useLocation } from "wouter";
import { CalendarRange, Upload, ListChecks, BookOpen, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";

const navItems = [
  { href: "/", label: "Upload", icon: Upload },
  { href: "/results", label: "Results", icon: ListChecks },
  { href: "/how-to-import", label: "How to Import", icon: BookOpen },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, toggle } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Brand + toggle row */}
          <div className="h-14 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="bg-primary text-primary-foreground p-1.5 rounded-lg shadow-sm">
                <CalendarRange className="w-4 h-4" />
              </div>
              <span className="font-bold text-base tracking-tight">DueNext AI</span>
            </div>

            {/* Dark mode toggle */}
            <button
              onClick={toggle}
              aria-label="Toggle dark mode"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="w-4 h-4" />
                  <span className="hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              )}
            </button>
          </div>

          {/* Nav tabs */}
          <div className="flex gap-1 -mb-px">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = location === href;
              return (
                <Link key={href} href={href}>
                  <button
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors",
                      isActive
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {children}
      </main>
    </div>
  );
}
