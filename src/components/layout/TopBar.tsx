import { ChevronDown, Settings } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';

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

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-zinc-950" style={{ height: 'var(--topbar-height)' }}>
      <div className="flex items-center justify-between px-6" style={{ height: 'var(--topbar-height)' }}>
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold tracking-tight">{pageTitle}</h1>
        </div>

        {/* Right Section - User Profile */}
        <div className="flex items-center gap-2">
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