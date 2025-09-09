import { BarChart3, Search, FileSearch, TrendingUp, Home, Zap, HelpCircle, User, LogOut, Settings } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Navigation sections based on user role
const getNavigationItems = (isAdmin: boolean, isClient: boolean) => ({
  navegacao: [
    {
      title: "Página Inicial",
      path: "/",
      icon: Home,
    },
    {
      title: "Perfil",
      path: "/profile", 
      icon: User,
    },
    {
      title: "Preciso de Ajuda",
      path: "/help",
      icon: HelpCircle,
    },
  ],
  ferramentas: [
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
  ]
});

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isAdmin, isClient, isLoading: roleLoading } = useRole();
  
  const navSections = getNavigationItems(isAdmin, isClient);

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
      className={cn(
        "border-r transition-all duration-300",
        state === "collapsed" ? "w-16" : "w-72"
      )}
      collapsible="icon"
    >
      <SidebarHeader className="border-b px-4 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <BarChart3 className="h-6 w-6 text-primary-foreground" />
          </div>
          {state !== "collapsed" && (
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold tracking-tight">SEO Tools</h2>
              <p className="text-xs text-muted-foreground">Análise completa</p>
            </div>
          )}
        </div>
        {state !== "collapsed" && <NotificationCenter />}
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        {/* Navegação Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Navegação
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navSections.navegacao.map((item) => {
                const itemIsActive = isActive(item.path);
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild>
                      {state === "collapsed" ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <NavLink
                              to={item.path}
                              className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-md transition-colors",
                                itemIsActive
                                  ? "bg-primary text-primary-foreground"
                                  : "hover:bg-accent hover:text-accent-foreground"
                              )}
                            >
                              <item.icon className="h-4 w-4" />
                            </NavLink>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>{item.title}</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <NavLink
                          to={item.path}
                          className={cn(
                            "flex h-10 items-center gap-3 rounded-md px-3 transition-colors",
                            itemIsActive
                              ? "bg-primary text-primary-foreground font-medium"
                              : "hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          <span className="text-sm">{item.title}</span>
                        </NavLink>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Ferramentas Section */}
        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Ferramentas SEO
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navSections.ferramentas.map((item) => {
                const itemIsActive = isActive(item.path);
                const hasNotification = item.path === '/rankings'; // Exemplo de notificação
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild>
                      {state === "collapsed" ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <NavLink
                              to={item.path}
                              className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-md transition-colors relative",
                                itemIsActive
                                  ? "bg-primary text-primary-foreground"
                                  : "hover:bg-accent hover:text-accent-foreground"
                              )}
                            >
                              <item.icon className="h-4 w-4" />
                              {hasNotification && (
                                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
                                  2
                                </Badge>
                              )}
                            </NavLink>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>{item.title}</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <NavLink
                          to={item.path}
                          className={cn(
                            "flex h-10 items-center gap-3 rounded-md px-3 transition-colors relative",
                            itemIsActive
                              ? "bg-primary text-primary-foreground font-medium"
                              : "hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          <span className="text-sm flex-1">{item.title}</span>
                          {hasNotification && (
                            <Badge className="h-5 w-5 rounded-full p-0 text-xs">
                              2
                            </Badge>
                          )}
                        </NavLink>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
          
          {user && (
            <Button
              variant="ghost"
              size={state === "collapsed" ? "icon" : "sm"}
              onClick={logout}
              className="h-8"
            >
              <LogOut className="h-4 w-4" />
              {state !== "collapsed" && <span className="ml-2 text-sm">Sair</span>}
            </Button>
          )}
        </div>
        
        {user && state !== "collapsed" && (
          <div className="mt-3 flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-none truncate">{user.email?.split('@')[0]}</p>
              <p className="text-xs text-muted-foreground mt-1">Usuário ativo</p>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}