import { Link, useLocation, Outlet } from "react-router-dom";
import { ClipboardList, History, LayoutDashboard, UserRoundPen } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../i18n/LanguageContext";
import { LeaderSelector } from "./LeaderSelector";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

interface SidebarItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

function SidebarBrandButton({ title }: { title: string }) {
  const { state } = useSidebar();

  return (
    <SidebarMenuButton asChild size="lg" tooltip={title}>
      <Link to="/" className="font-semibold">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <ClipboardList className="size-4" />
        </span>
        {state === "expanded" && (
          <span className="text-base leading-tight">{title}</span>
        )}
      </Link>
    </SidebarMenuButton>
  );
}

export function Layout() {
  const { employeeId, clearEmployee } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  if (!employeeId) {
    return <LeaderSelector />;
  }

  const navigationItems: SidebarItem[] = [
    { path: "/", label: t("home"), icon: LayoutDashboard },
    { path: "/history", label: t("evaluationHistory"), icon: History },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const pageTitle =
    location.pathname === "/"
      ? t("home")
      : location.pathname === "/history"
        ? t("evaluationHistory")
        : location.pathname.startsWith("/evaluate/")
          ? t("evaluation")
          : location.pathname.startsWith("/history/")
            ? t("history")
            : "";

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarBrandButton title={t("appTitle")} />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigationItems.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.path)}
                      tooltip={item.label}
                    >
                      <Link to={item.path}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center justify-between gap-2 px-2 py-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
                <span
                  className="truncate font-mono text-xs text-muted-foreground"
                  title={`#${employeeId}`}
                >
                  #{employeeId}
                </span>
                <LanguageSwitcher />
              </div>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip={t("selectIdentity")}
                onClick={clearEmployee}
                variant="outline"
              >
                <UserRoundPen />
                <span>{t("selectIdentity")}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur md:px-6">
          <SidebarTrigger aria-label={t("toggleMenu")} title={t("toggleMenu")} />
          <Separator orientation="vertical" className="data-[orientation=vertical]:h-5" />
          <h1 className="truncate text-lg font-semibold tracking-tight">{pageTitle}</h1>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 animate-fade-in">
          <div className="mx-auto w-full max-w-5xl">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
