import { TrendingUp, Home, Zap, HelpCircle, BarChart } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useRole } from "@/hooks/useRole";
import { useProject } from "@/hooks/useProject";
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
      title: "Preciso de Ajuda",
      path: "/help",
      icon: HelpCircle,
    },
  ],
  ferramentas: [
    {
      title: "Análise de Concorrentes", 
      path: "/comparison",
      icon: TrendingUp,
    },
    {
      title: "Monitoramento",
      path: "/monitoring",
      icon: BarChart,
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
  const location = useLocation();
  const { isAdmin, isClient, isLoading: roleLoading } = useRole();
  const { activeProject } = useProject();
  
  const navSections = getNavigationItems(isAdmin, isClient);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  if (roleLoading) {
    return (
      <Sidebar className="w-72">
        <div className="flex h-full items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar 
      className="w-72 border-r h-full bg-zinc-950"
      collapsible="none"
    >
      <SidebarHeader className="border-b px-4 py-6">
        {activeProject ? (
          <div className="flex flex-col space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">Projeto Selecionado</h2>
            <p className="text-sm bg-zinc-900 p-2 rounded-sm">{activeProject.domain}</p>
          </div>
        ) : (
          <div className="flex flex-col space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">Nenhum Projeto</h2>
            <p className="text-sm text-muted-foreground">Selecione um projeto</p>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        {/* Navegação Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-medium uppercase text-zinc-500">
            Navegação
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navSections.navegacao.map((item) => {
                const itemIsActive = isActive(item.path);
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild>
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
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Ferramentas Section */}
        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className="px-3 text-xs font-medium uppercase text-zinc-500">
            Ferramentas
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navSections.ferramentas.map((item) => {
                const itemIsActive = isActive(item.path);
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild>
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
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="text-center text-xs text-muted-foreground">
          Alterar Plano
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}