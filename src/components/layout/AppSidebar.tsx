import { BarChart3, Search, FolderOpen, GitCompare, Monitor, LogOut, User, FileSearch, TrendingUp, Home, Zap } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { RankingAlertSystem } from '@/components/alerts/RankingAlertSystem';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

// Navigation items based on user role
const getNavItems = (isAdmin: boolean, isClient: boolean) => [
  {
    title: "Página Inicial",
    path: "/",
    icon: Home,
  },
  {
    title: "Auditoria do Site",
    path: "/audit",
    icon: FileSearch,
  },
  {
    title: "Análise de Concorrentes", 
    path: "/comparison",
    icon: TrendingUp,
  },
  {
    title: "Monitoramento",
    path: "/monitoring",
    icon: BarChart3,
  },
  {
    title: "Rankings",
    path: "/rankings", 
    icon: Search,
  },
  // Show Projects only for clients
  ...(isClient ? [{
    title: "Projetos",
    path: "/projects",
    icon: Zap,
  }] : []),
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isAdmin, isClient, isLoading: roleLoading } = useRole();
  
  const navItems = getNavItems(isAdmin, isClient);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  if (roleLoading) {
    return (
      <Sidebar className={state === "collapsed" ? "w-14" : "w-80"}>
        <div className="flex h-full items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar 
      className={state === "collapsed" ? "w-14" : "w-80"} 
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-border">
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary flex-shrink-0" />
            {state !== "collapsed" && <span className="text-xl font-bold text-foreground">SEO Dashboard</span>}
          </div>
          {state !== "collapsed" && <NotificationCenter />}
        </div>
        <RankingAlertSystem />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Ferramentas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild>
                    {state === "collapsed" ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <NavLink
                            to={item.path}
                            className={({ isActive: linkActive }) =>
                              `flex items-center justify-center w-10 h-10 ${
                                linkActive || isActive(item.path)
                                  ? "bg-primary text-primary-foreground"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
                              }`
                            }
                          >
                            <item.icon className="h-5 w-5 flex-shrink-0" />
                          </NavLink>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>{item.title}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <NavLink
                        to={item.path}
                        className={({ isActive: linkActive }) =>
                          `flex items-center gap-3 ${
                            linkActive || isActive(item.path)
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`
                        }
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        <span className="font-medium">{item.title}</span>
                      </NavLink>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4">
        {user && state !== "collapsed" && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/50 mb-4">
            <User className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm font-medium truncate">{user.email}</span>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          {state !== "collapsed" && (
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Ferramentas SEO</p>
              <p>Analise, compare e monitore</p>
            </div>
          )}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user && (
              <Button
                variant="ghost"
                size={state === "collapsed" ? "icon" : "sm"}
                onClick={logout}
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
                {state !== "collapsed" && <span className="ml-2">Sair</span>}
              </Button>
            )}
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}