import { ChevronDown } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';

const getPageTitle = (pathname: string) => {
  const routes = {
    '/': 'Dashboard',
    '/audit': 'Auditoria do Site',
    '/comparison': 'Análise de Concorrentes',
    '/monitoring': 'Monitoramento',
    '/rankings': 'Rankings',
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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <h1 className="text-xl font-semibold tracking-tight">{pageTitle}</h1>
        </div>

        {/* Right Section - Only User Profile */}
        <div className="flex items-center">
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="flex items-center gap-2 px-3"
                >
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
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
                <DropdownMenuItem>Configurações</DropdownMenuItem>
                <DropdownMenuItem>Ajuda</DropdownMenuItem>
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