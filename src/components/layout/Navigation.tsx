import { useState } from "react";
import { BarChart3, Search, GitCompare, Monitor, Menu, X } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ThemeToggle";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { title: "Análise Individual", path: "/", icon: Search },
    { title: "Comparação", path: "/comparison", icon: GitCompare },
    { title: "Monitoramento", path: "/monitoring", icon: Monitor },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-6 border-b border-border">
        <BarChart3 className="h-8 w-8 text-primary" />
        <span className="text-xl font-bold text-foreground">SEO Dashboard</span>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive: linkActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    linkActive || isActive(item.path)
                      ? "bg-primary text-primary-foreground shadow-card"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`
                }
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.title}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-1">Ferramentas SEO</p>
            <p>Analise, compare e monitore posições</p>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Navigation */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <span className="font-bold text-foreground">SEO Dashboard</span>
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
          
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-80">
              <NavContent />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden lg:block fixed left-0 top-0 h-full w-80 bg-card border-r border-border z-40">
        <NavContent />
      </div>
    </>
  );
};

export default Navigation;