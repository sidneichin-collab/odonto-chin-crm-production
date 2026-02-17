import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ReschedulingAlertPopup } from './ReschedulingAlertPopup';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { 
  LayoutDashboard, 
  LogOut, 
  PanelLeft, 
  Users, 
  Calendar,
  DollarSign,
  MessageSquare,
  FileText,
  Settings,
  UserCog,
  Activity,
  Upload,
  Clock,
  AlertTriangle,
  TestTube2,
  Inbox,
  HeartPulse,
  BarChart3,
  FlaskConical,
  CalendarClock,
  Radio,
  Tag,
  Moon,
  Sun,
  ChevronDown,
  ChevronRight,
  Kanban,
  Building2
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { useTheme } from "@/hooks/useTheme";
import { ClinicSelector } from "./ClinicSelector";
import { createContext, useContext } from "react";

interface ClinicContextType {
  selectedClinic: string | null;
  setSelectedClinic: (clinicId: string | null) => void;
}

const ClinicContext = createContext<ClinicContextType>({
  selectedClinic: null,
  setSelectedClinic: () => {},
});

export const useClinicFilter = () => useContext(ClinicContext);

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: AlertTriangle, label: "Pacientes en Riesgo", path: "/risk-patients" },
  { icon: Kanban, label: "Confirmación/Pendiente", path: "/confirmacion-pendiente" },
  { icon: Calendar, label: "Agendamientos Kanban", path: "/agendamentos-kanban" },
  { icon: BarChart3, label: "Estadísticas de Sillones", path: "/chair-statistics" },
  { icon: Clock, label: "Lista de Espera", path: "/waitlist" },
  { icon: MessageSquare, label: "Conversaciones", path: "/conversas", showBadge: true, badgeType: "unread" },
  { icon: Radio, label: "Canales", path: "/canais" },
  { icon: Activity, label: "Monitoreo Recordatorios", path: "/monitoreo-recordatorios" },
  { icon: Tag, label: "Etiquetas", path: "/etiquetas" },
  { icon: MessageSquare, label: "Comunicación", path: "/communications" },
  { icon: MessageSquare, label: "Integraciones", path: "/integraciones" },
  { icon: TestTube2, label: "Prueba de Webhook", path: "/test-webhook" },
  { icon: Inbox, label: "Mensajes Recibidos (Kanban)", path: "/mensagens-recebidas" },
  { icon: CalendarClock, label: "Solicitudes de Reagendamiento", path: "/reschedule-requests", showBadge: true },
  { icon: HeartPulse, label: "Salud de los Canales", path: "/channel-health" },
  { icon: BarChart3, label: "Estadísticas de Plantillas", path: "/estadisticas-plantillas" },
  { icon: FlaskConical, label: "Tests A/B", path: "/tests-ab" },
  { icon: Activity, label: "Efectividad de Recordatorios", path: "/efectividad-recordatorios" },
  { icon: FileText, label: "Informes", path: "/reports" },
  { icon: MessageSquare, label: "Templates", path: "/templates" },
  { icon: Inbox, label: "Mensajes Recibidos", path: "/mensajes-recibidos" },
  { icon: CalendarClock, label: "Solicitudes Reagendamiento", path: "/solicitudes-reagendamiento" },
  { icon: HeartPulse, label: "Salud Canales", path: "/salud-canales" },
  { icon: DollarSign, label: "Inadimplência", path: "/relatorio-inadimplencia" },
  { icon: Activity, label: "Insights IA", path: "/insights-ia" },
  { icon: BarChart3, label: "Dashboard de Métricas", path: "/dashboard-metricas" },
];

const adminMenuItems = [
  { icon: UserCog, label: "Gestionar Usuarios", path: "/admin/users" },
  { icon: UserCog, label: "Secretarias", path: "/secretaries" },
  { icon: Settings, label: "Configuraciones", path: "/settings" },
  { icon: Settings, label: "Configurações Avançadas", path: "/configuracoes" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-3">
              <Activity className="w-10 h-10 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight text-center">
                ODONTO CHIN CRM
              </h1>
            </div>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Sistema de gerenciamento de clínica odontológica. Faça login para continuar.
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Iniciar Sesión en el Sistema
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const [location, navigate] = useLocation();
  const [selectedClinic, setSelectedClinic] = useState<string | null>(null);
  const { user } = useAuth();
  const { logout } = useAuth();
  const isMobile = useIsMobile();
  const { state, setOpen } = useSidebar();
  const isResizing = useRef(false);
  const { theme, toggleTheme } = useTheme();
  
  // Poll for unread messages count
  const { data: unreadCount = 0 } = trpc.inbox.getUnreadCount.useQuery(undefined, {
    refetchInterval: 10000, // Poll every 10 seconds
  });
  
  // Poll for pending reschedule requests count
  const { data: pendingRescheduleData } = trpc.rescheduleRequests.getPendingCount.useQuery(undefined, {
    refetchInterval: 30000, // Poll every 30 seconds
  });
  const pendingRescheduleCount = pendingRescheduleData?.count || 0;
  
  // Track previous unreadCount to detect new messages
  const prevUnreadCountRef = useRef(unreadCount);
  
  // Play notification sound when new message arrives
  useEffect(() => {
    if (unreadCount > prevUnreadCountRef.current && prevUnreadCountRef.current > 0) {
      // Play notification sound (simple beep)
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800; // Frequency in Hz
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    }
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount]);

  const handleMouseDown = () => {
    isResizing.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = e.clientX;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      if (isResizing.current) {
        isResizing.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [setSidebarWidth]);

  const isAdmin = user?.role === 'admin';

  return (
    <div>
      <Sidebar collapsible="icon" className="border-r">
        <SidebarHeader className="border-b px-4 py-4">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-primary shrink-0" />
            {state === "expanded" && (
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight">ODONTO CHIN</span>
                <span className="text-xs text-muted-foreground">Sistema de Gestión</span>
              </div>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2 py-4">
          <SidebarMenu>
            {/* Pacientes Activos - Direct Link */}
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => {
                  navigate("/patients");
                  if (isMobile) setOpen(false);
                }}
                isActive={location === "/patients"}
                tooltip="Pacientes Activos"
              >
                <Users className="shrink-0" />
                <span>Pacientes Activos</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {menuItems.map((item) => (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  onClick={() => {
                    navigate(item.path);
                    if (isMobile) setOpen(false);
                  }}
                  isActive={location === item.path}
                  tooltip={item.label}
                >
                  <item.icon className="shrink-0" />
                  <span className="flex items-center gap-2">
                    {item.label}
                    {item.path === '/conversas' && unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-500 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                    {item.path === '/mensagens-recebidas' && unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                    {item.path === '/reschedule-requests' && pendingRescheduleCount > 0 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-orange-500 rounded-full">
                        {pendingRescheduleCount}
                      </span>
                    )}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            
            {isAdmin && (
              <div>
                <div className="my-2 px-3">
                  <div className="h-px bg-border" />
                </div>
                {adminMenuItems.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      onClick={() => {
                        navigate(item.path);
                        if (isMobile) setOpen(false);
                      }}
                      isActive={location === item.path}
                      tooltip={item.label}
                    >
                      <item.icon className="shrink-0" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </div>
            )}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="border-t p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton className="w-full">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                {state === "expanded" && (
                  <div className="flex flex-col items-start overflow-hidden">
                    <span className="text-sm font-medium truncate w-full">
                      {user?.name || "Usuario"}
                    </span>
                    <span className="text-xs text-muted-foreground truncate w-full">
                      {user?.email || ""}
                    </span>
                  </div>
                )}
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Salir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>

        {state === "expanded" && (
          <div
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors"
            onMouseDown={handleMouseDown}
          />
        )}
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
          <SidebarTrigger className="-ml-2">
            <PanelLeft className="h-5 w-5" />
          </SidebarTrigger>
          <div className="flex-1" />
          {user?.role === 'admin' ? (
            <ClinicSelector 
              value={selectedClinic || undefined}
              onChange={setSelectedClinic}
            />
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
              <Building2 className="w-4 h-4" />
              <span>Mi Clínica</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9"
          >
            {theme === "light" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>
        </header>
        <main className="flex-1 p-6 w-full overflow-x-auto">{children}</main>
      </SidebarInset>
      
      {/* Popup sonoro de alertas de reagendamento */}
      <ReschedulingAlertPopup />
    </div>
  );
}
