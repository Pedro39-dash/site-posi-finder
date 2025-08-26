import { BarChart3, Search, FolderOpen, GitCompare, Monitor, LogOut, User } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
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

const navItems = [
  { title: "Dashboard", path: "/", icon: Search },
  { title: "Projetos", path: "/projects", icon: FolderOpen },
  { title: "Comparação", path: "/comparison", icon: GitCompare },
  { title: "Monitoramento", path: "/monitoring", icon: Monitor },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar 
      className={state === "collapsed" ? "w-14" : "w-80"} 
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-border">
        <div className="flex items-center gap-2 px-4 py-3">
          <BarChart3 className="h-8 w-8 text-primary flex-shrink-0" />
          {state !== "collapsed" && <span className="text-xl font-bold text-foreground">SEO Dashboard</span>}
        </div>
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