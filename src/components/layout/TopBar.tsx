import { ChevronDown, Settings, FlaskConical } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useSimulatedData } from '@/hooks/useSimulatedData';

const getPageTitle = (pathname: string) => {
  const routes = {
    '/': 'Dashboard',
    '/comparison': 'Análise de Concorrentes',
    '/monitoring': 'Monitoramento',
    '/projects': 'Projetos',
    '/profile': 'Perfil',
    '/help': 'Ajuda'
  };
  
  return routes[pathname as keyof typeof routes] || 'Dashboard';
};

interface TopBarProps {
  onCreateProject?: () => void;
}

export function TopBar({ onCreateProject }: TopBarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const pageTitle = getPageTitle(location.pathname);
  const { isSimulatedMode, toggleSimulatedMode } = useSimulatedData();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-zinc-950" style={{ height: 'var(--topbar-height)' }}>
      <div className="flex items-center justify-between px-6" style={{ height: 'var(--topbar-height)' }}>
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold tracking-tight">{pageTitle}</h1>
        </div>

        {/* Right Section - User Profile */}
        <div className="flex items-center gap-4">
          {/* Simulated Data Toggle */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 border-l border-zinc-700 pl-4">
                  {isSimulatedMode && (
                    <Badge variant="secondary" className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                      SIMULADO
                    </Badge>
                  )}
                  <Switch 
                    checked={isSimulatedMode}
                    onCheckedChange={toggleSimulatedMode}
                    className="data-[state=checked]:bg-amber-500"
                  />
                  <FlaskConical className={`h-5 w-5 transition-colors ${isSimulatedMode ? 'text-amber-400' : 'text-muted-foreground'}`} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  {isSimulatedMode 
                    ? 'Modo teste ativo: dados simulados sendo exibidos. Desative para ver dados reais.' 
                    : 'Ativar dados simulados para testes e demonstrações'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* <ThemeToggle /> */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="flex items-center gap-2 px-3 border-l border-zinc-500">
                  <div className="h-7 w-7 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-xs font-medium text-primary">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium hidden sm:inline-block">
                    {user.email?.split('@')[0]}
                  </span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>Perfil</DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuItem>Ajuda</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}