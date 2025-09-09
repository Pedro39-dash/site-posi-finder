import { useState } from 'react';
import { Search, Bell, Settings, ChevronDown } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ProjectSelector } from '@/components/projects/ProjectSelector';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

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
  const [searchValue, setSearchValue] = useState('');
  const pageTitle = getPageTitle(location.pathname);

  const showProjectSelector = ['/audit', '/comparison', '/monitoring', '/rankings'].includes(location.pathname);
  const showSearch = ['/comparison', '/rankings'].includes(location.pathname);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight">{pageTitle}</h1>
            {showProjectSelector && (
              <>
                <div className="w-px h-6 bg-border" />
                <ProjectSelector onCreateProject={onCreateProject} />
              </>
            )}
          </div>
        </div>

        {/* Center Section - Search */}
        {showSearch && (
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Pesquisar keywords, domínios..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-10 bg-muted/50 border-0 focus-visible:ring-1"
              />
            </div>
          </div>
        )}

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
              3
            </Badge>
          </Button>

          {/* Settings */}
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>

          {/* User Menu */}
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