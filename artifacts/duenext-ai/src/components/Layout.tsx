import { Link, useLocation } from "wouter";
import { CalendarRange, Sun, Moon, Linkedin, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";

const navItems = [
  { href: "/", label: "Upload" },
  { href: "/results", label: "Deadlines" },
  { href: "/how-to-import", label: "How to Import" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, toggle } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-5xl mx-auto px-6 sm:px-10">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CalendarRange className="w-5 h-5 text-primary" />
              <span className="font-display text-lg font-semibold tracking-tight text-foreground">DueNext<span className="text-primary">.ai</span></span>
            </div>

            <button
              onClick={toggle}
              aria-label="Toggle dark mode"
              className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted/50"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex gap-8 -mb-px">
            {navItems.map(({ href, label }) => {
              const isActive = location === href;
              return (
                <Link key={href} href={href}>
                  <button
                    className={cn(
                      "py-3 text-sm tracking-wide transition-colors border-b-2",
                      isActive
                        ? "border-primary text-foreground font-medium"
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

      <main className="max-w-5xl mx-auto px-6 sm:px-10 py-16">
        {children}
      </main>

      <footer className="border-t border-border/40 py-10">
        <div className="max-w-5xl mx-auto px-6 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CalendarRange className="w-4 h-4 text-primary/60" />
            <span className="font-display text-sm text-foreground/70">DueNext<span className="text-primary/60">.ai</span></span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://www.linkedin.com/in/nebulakamrul/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground/50 hover:text-foreground transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-4 h-4" />
            </a>
            <a
              href="mailto:nebulakamrul@gmail.com"
              className="text-muted-foreground/50 hover:text-foreground transition-colors"
              aria-label="Email"
            >
              <Mail className="w-4 h-4" />
            </a>
          </div>

          <p className="text-xs text-muted-foreground/40 tracking-wide">
            built by nebula kamrul &middot; &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
