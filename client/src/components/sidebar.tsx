import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Gamepad2, Gauge, History, User, LogOut } from "lucide-react";

function formatBigIntString(s?: string) {
  if (!s) return '0';
  const sign = s.startsWith('-') ? '-' : '';
  const digits = s.replace(/[^0-9]/g, '');
  if (!digits) return '0';
  return sign + digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

interface AuthResponse {
  admin: {
    id: string;
    username: string;
    balance?: string;
  };
}

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: authData } = useQuery<AuthResponse>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/logout", {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Logged out successfully",
        description: "You have been signed out",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navItems = [
    {
      path: "/",
      label: "Dashboard",
      icon: Gauge,
    },
    {
      path: "/history",
      label: "Transaction History",
      icon: History,
    },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border shadow-lg">
      <div className="flex items-center px-6 py-4 border-b border-border">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3">
          <Gamepad2 className="text-primary-foreground h-5 w-5" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Admin Panel</h2>
      </div>
      
      <nav className="mt-6 px-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <li key={item.path}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start ${
                    isActive 
                      ? "bg-primary/10 text-primary border border-primary/20" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  onClick={() => setLocation(item.path)}
                  data-testid={`nav-${item.path === "/" ? "dashboard" : item.path.slice(1)}`}
                >
                  <Icon className={`mr-3 h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                  {item.label}
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="absolute bottom-4 left-4 right-4">
        <div className="flex items-center px-4 py-3 bg-muted rounded-md">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-3">
            <User className="text-primary-foreground text-sm h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground" data-testid="text-admin-username">
              {authData?.admin?.username || "Admin User"}
            </p>
            <p className="text-xs text-muted-foreground">Logged in</p>
            <p className="text-sm mt-1 text-foreground">My balance</p>
            <p className="text-lg font-semibold" data-testid="text-admin-balance">{formatBigIntString(authData?.admin?.balance)}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground p-2"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
