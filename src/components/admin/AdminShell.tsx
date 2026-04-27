import { ReactNode } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCog,
  Database,
  Mic,
  MessageCircleQuestion,
  Settings,
  ScrollText,
  ArrowLeft,
  Shield,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const NAV = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard, end: true },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Roles", url: "/admin/roles", icon: UserCog },
  { title: "Content", url: "/admin/content", icon: Database },
  { title: "Recitation", url: "/admin/recitation", icon: Mic },
  { title: "AI Q&A", url: "/admin/ask", icon: MessageCircleQuestion },
  { title: "Settings", url: "/admin/settings", icon: Settings },
  { title: "Audit Logs", url: "/admin/logs", icon: ScrollText },
];

function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className={`px-3 pt-4 pb-2 flex items-center gap-2 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0">
            <Shield className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">Admin Panel</p>
              <p className="text-[10px] text-muted-foreground truncate">Quran & Prayer</p>
            </div>
          )}
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Manage</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.end}
                      className={({ isActive }) =>
                        `${isActive ? "bg-muted text-primary font-semibold" : "hover:bg-muted/50"}`
                      }
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export default function AdminShell({ children }: { children?: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();

  const segments = location.pathname.split("/").filter(Boolean);
  const breadcrumb = segments.length <= 1 ? "Dashboard" : segments.slice(1).join(" / ");

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b bg-card/40 backdrop-blur-sm sticky top-0 z-30 flex items-center px-3 gap-3">
            <SidebarTrigger />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold leading-none">
                Admin
              </p>
              <p className="text-sm font-bold text-foreground truncate capitalize">{breadcrumb}</p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
              {user?.email}
            </div>
            <Button asChild variant="ghost" size="sm" className="h-8">
              <Link to="/">
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Exit
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={async () => {
                await signOut();
                toast.success("Signed out");
                navigate("/");
              }}
              aria-label="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </header>

          <main className="flex-1 p-4 sm:p-6 overflow-auto">
            <div className="max-w-7xl mx-auto">{children ?? <Outlet />}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
