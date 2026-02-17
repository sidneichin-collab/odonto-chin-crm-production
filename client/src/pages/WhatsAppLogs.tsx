// @ts-nocheck - Type issues to be fixed
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Download, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function WhatsAppLogs() {
  const [searchPhone, setSearchPhone] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // Buscar logs com auto-refresh a cada 10 segundos
  const { data: logsData, isLoading, refetch } = trpc.whatsappLogs.getLogs.useQuery(
    {
      phone: searchPhone || undefined,
      type: filterType === 'all' ? undefined : filterType,
      page,
      pageSize,
    },
    {
      refetchInterval: 10000, // Auto-refresh a cada 10 segundos
    }
  );

  const logs = logsData?.logs || [];
  const totalPages = logsData?.totalPages || 1;

  // Exportar logs para CSV
  const handleExportCSV = () => {
    if (!logs.length) return;

    const headers = ['Data/Hora', 'Teléfono', 'Paciente', 'Tipo', 'Mensagem', 'Estado'];
    const rows = logs.map(log => [
      format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR }),
      log.phone,
      (log.patientName || "Paciente") || '-',
      log.type,
      log.messageText.substring(0, 100),
      log.status || '-',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `whatsapp-logs-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`;
    link.click();
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      sent: { variant: 'default', label: 'Enviado' },
      received: { variant: 'secondary', label: 'Recebido' },
      confirmed: { variant: 'default', label: 'Confirmado' },
      rescheduled: { variant: 'outline', label: 'Reagendamento' },
      error: { variant: 'destructive', label: 'Error' },
    };
    const config = variants[type] || { variant: 'outline' as const, label: type };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Logs WhatsApp em Tempo Real</CardTitle>
              <CardDescription>
                Monitore todas as mensagens enviadas e recebidas (atualização automática a cada 10s)
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!logs.length}>
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por telefone..."
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="sent">Enviados</SelectItem>
                <SelectItem value="received">Recebidos</SelectItem>
                <SelectItem value="confirmed">Confirmados</SelectItem>
                <SelectItem value="rescheduled">Reagendamentos</SelectItem>
                <SelectItem value="error">Errors</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabela de Logs */}
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Cargando logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Ninguno log encontrado
            </div>
          ) : (
            <>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 font-medium">Data/Hora</th>
                      <th className="text-left p-3 font-medium">Teléfono</th>
                      <th className="text-left p-3 font-medium">Paciente</th>
                      <th className="text-left p-3 font-medium">Tipo</th>
                      <th className="text-left p-3 font-medium">Mensagem</th>
                      <th className="text-left p-3 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, index) => (
                      <tr key={log.id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/50'}>
                        <td className="p-3 text-sm">
                          {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                        </td>
                        <td className="p-3 text-sm font-mono">{log.phone}</td>
                        <td className="p-3 text-sm">{(log.patientName || "Paciente") || '-'}</td>
                        <td className="p-3">{getTypeBadge(log.type)}</td>
                        <td className="p-3 text-sm max-w-md truncate">{log.messageText}</td>
                        <td className="p-3 text-sm">
                          {log.status ? (
                            <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                              {log.status}
                            </Badge>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Página {page} de {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
