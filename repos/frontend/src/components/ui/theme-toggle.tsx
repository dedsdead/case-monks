import { Check, Monitor, Sun, Moon } from "lucide-react";
import { useThemeContext, type Theme } from "../../contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const THEMES: { value: Theme; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function ThemeToggle() {
  const { theme, setTheme } = useThemeContext();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Toggle theme" title="Toggle theme">
          <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="right" sideOffset={8}>
        {THEMES.map((entry) => {
          const Icon = entry.icon;
          return (
            <DropdownMenuItem
              key={entry.value}
              role="menuitemradio"
              aria-checked={theme === entry.value}
              onSelect={() => setTheme(entry.value)}
            >
              <Icon className="mr-2 size-4" />
              <span className="flex-1">{entry.label}</span>
              {theme === entry.value && <Check className="size-4" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}