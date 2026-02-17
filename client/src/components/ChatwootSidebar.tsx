import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, BarChart3 } from "lucide-react";
import { format, addDays, subDays } from "date-fns";
import { es } from "date-fns/locale";

interface ChatwootSidebarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  treatmentFilter: 'all' | 'orthodontics' | 'general_clinic' | 'marketing';
  onFilterChange: (filter: 'all' | 'orthodontics' | 'general_clinic' | 'marketing') => void;
  stats?: {
    total: number;
    orthodontics: number;
    clinic: number;
    marketing: number;
  };
}

export function ChatwootSidebar({
  selectedDate,
  onDateChange,
  treatmentFilter,
  onFilterChange,
  stats = { total: 0, orthodontics: 0, clinic: 0, marketing: 0 }
}: ChatwootSidebarProps) {
  const handlePreviousDay = () => onDateChange(subDays(selectedDate, 1));
  const handleNextDay = () => onDateChange(addDays(selectedDate, 1));
  const handleToday = () => onDateChange(new Date());

  return (
    <div className="w-72 bg-muted/30 border-r border-border flex flex-col h-full">
      {/* Date navigation */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <Button variant="ghost" size="icon" onClick={handlePreviousDay} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" onClick={handleToday} className="text-sm font-medium">
            Hoy
          </Button>
          <Button variant="ghost" size="icon" onClick={handleNextDay} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold">
            {format(selectedDate, "EEEE", { locale: es })}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-border">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">
          Filtros
        </h3>
        <div className="space-y-1">
          <button
            onClick={() => onFilterChange('all')}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
              treatmentFilter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            📋 Todos
            {stats.total > 0 && (
              <span className="float-right text-xs opacity-70">{stats.total}</span>
            )}
          </button>
          <button
            onClick={() => onFilterChange('orthodontics')}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
              treatmentFilter === 'orthodontics'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            🦷 Ortodoncio
            {stats.orthodontics > 0 && (
              <span className="float-right text-xs opacity-70">{stats.orthodontics}</span>
            )}
          </button>
          <button
            onClick={() => onFilterChange('general_clinic')}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
              treatmentFilter === 'general_clinic'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            🏥 Clínico
            {stats.clinic > 0 && (
              <span className="float-right text-xs opacity-70">{stats.clinic}</span>
            )}
          </button>
          <button
            onClick={() => onFilterChange('marketing')}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
              treatmentFilter === 'marketing'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            📢 Marketing
            {stats.marketing > 0 && (
              <span className="float-right text-xs opacity-70">{stats.marketing}</span>
            )}
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="p-4 flex-1 overflow-auto">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">
          Calendario
        </h3>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && onDateChange(date)}
          locale={es}
          className="rounded-md border"
        />
      </div>

      {/* Stats summary */}
      {stats.total > 0 && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <BarChart3 className="h-4 w-4" />
            <span className="font-medium">Estadísticas del día</span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Total:</span>
              <span className="font-semibold">{stats.total}</span>
            </div>
            <div className="flex justify-between text-purple-600 dark:text-purple-400">
              <span>Ortodoncio:</span>
              <span className="font-semibold">{stats.orthodontics}</span>
            </div>
            <div className="flex justify-between text-cyan-600 dark:text-cyan-400">
              <span>Clínico:</span>
              <span className="font-semibold">{stats.clinic}</span>
            </div>
            <div className="flex justify-between text-orange-600 dark:text-orange-400">
              <span>Marketing:</span>
              <span className="font-semibold">{stats.marketing}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
