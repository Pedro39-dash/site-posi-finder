import { TrendingUp, Home, Zap, HelpCircle, BarChart, Settings, ChevronDown, Plus, Globe, Check } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useRole } from "@/hooks/useRole";
import { useProject } from "@/hooks/useProject";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface AppSidebarProps {
  onEditProject?: () => void;
  onCreateProject?: () => void;
}

export function AppSidebar({ onEditProject, onCreateProject }: AppSidebarProps = {}) {
  const location = useLocation();
  const { isAdmin, isClient, isLoading: roleLoading } = useRole();
  const { activeProject, projects, setActiveProject } = useProject();
  
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
      <SidebarHeader className="border-b px-4 py-4">
        {activeProject ? (
          <div className="space-y-3">
            {/* Projeto Ativo - Clicável para trocar */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between h-auto py-2 px-3 hover:bg-zinc-800"
                >
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <span className="text-xs text-muted-foreground">Projeto Ativo</span>
                    <span className="text-sm font-semibold truncate w-full text-left">
                      {activeProject.name}
                    </span>
                    <span className="text-xs text-muted-foreground truncate w-full text-left">
                      {activeProject.domain}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 ml-2 flex-shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 bg-popover z-50">
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground flex justify-between items-center">
                  <span>Trocar Projeto</span>
                  <span className="bg-primary/20 px-2 py-0.5 rounded text-primary">
                    {projects.length}
                  </span>
                </div>
                
                {projects.length === 1 ? (
                  <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                    Você tem apenas 1 projeto.
                    <br />
                    Crie mais projetos para alternar.
                  </div>
                ) : (
                  projects.map((project) => (
                    <DropdownMenuItem
                      key={project.id}
                      onClick={() => setActiveProject(project.id)}
                      className={cn(
                        "cursor-pointer",
                        project.id === activeProject.id ? "bg-accent" : ""
                      )}
                    >
                      <div className="flex flex-col flex-1">
                        <span className="font-medium">{project.name}</span>
                        <span className="text-xs text-muted-foreground">{project.domain}</span>
                      </div>
                      {project.id === activeProject.id && (
                        <Check className="h-4 w-4 ml-2 text-primary flex-shrink-0" />
                      )}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Botões de Ação */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                onClick={onEditProject}
              >
                <Settings className="h-3 w-3" />
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={onCreateProject}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-center py-6 px-3 bg-zinc-900 rounded-md border border-dashed border-zinc-700">
              <div className="text-center">
                <Globe className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">Nenhum Projeto</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Crie seu primeiro projeto
                </p>
                <Button size="sm" onClick={onCreateProject} className="w-full">
                  <Plus className="h-3 w-3 mr-2" />
                  Criar Projeto
                </Button>
              </div>
            </div>
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