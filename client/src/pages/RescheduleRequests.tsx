import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExternalLink, CheckCircle, Clock, MessageSquare, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

export default function RescheduleRequests() {
  const [, setLocation] = useLocation();
  const [statusFilter, setEstadoFilter] = useState<'pending' | 'notified' | 'resolved' | 'all'>('all');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);

  // Queries
  const { data: allRequests, refetch: refetchAll } = trpc.rescheduleRequests.getAll.useQuery(undefined, {
    enabled: statusFilter === 'all',
  });
  
  const { data: filteredRequests, refetch: refetchFiltered } = trpc.rescheduleRequests.getByStatus.useQuery(
    { status: statusFilter as 'pending' | 'notified' | 'resolved' },
    { enabled: statusFilter !== 'all' }
  );

  // Mutations
  const markAsResolvedMutation = trpc.rescheduleRequests.markAsResolved.useMutation({
    onSuccess: () => {
      alert('✅ Solicitud marcada como resuelta exitosamente');
      refetchAll();
      refetchFiltered();
      setIsResolveDialogOpen(false);
      setSelectedRequest(null);
      setNotes('');
    },
    onError: (error) => {
      alert(`❌ Error: ${error.message}`);
    },
  });

  const addNotesMutation = trpc.rescheduleRequests.addNotes.useMutation({
    onSuccess: () => {
      alert('✅ Notas guardadas exitosamente');
      refetchAll();
      refetchFiltered();
      setIsNotesDialogOpen(false);
      setSelectedRequest(null);
      setNotes('');
    },
    onError: (error) => {
      alert(`❌ Error: ${error.message}`);
    },
  });

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (statusFilter === 'all') {
        refetchAll();
      } else {
        refetchFiltered();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [statusFilter, refetchAll, refetchFiltered]);

  const requests = statusFilter === 'all' ? allRequests : filteredRequests;

  const handleMarkAsResolved = () => {
    if (!selectedRequest) return;
    markAsResolvedMutation.mutate({
      requestId: selectedRequest.id,
      notes: notes || undefined,
    });
  };

  const handleAddNotes = () => {
    if (!selectedRequest || !notes.trim()) return;
    addNotesMutation.mutate({
      requestId: selectedRequest.id,
      notes,
    });
  };

  const getEstadoBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendiente</Badge>;
      case 'notified':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Notificada</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Resuelta</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAppointmentTypeLabel = (type: string) => {
    switch (type) {
      case 'marketing_evaluation':
        return 'Evaluación Marketing';
      case 'orthodontic_treatment':
        return 'Tratamiento Ortodóntico';
      case 'general_clinic':
        return 'Clínica General';
      default:
        return type;
    }
  };

  const generateWhatsAppLink = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://wa.me/${cleanPhone}`;
  };

  return (
    <div className="container py-8">
      <div className="mb-8 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/")}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold mb-2">Solicitudes de Reagendamiento</h1>
          <p className="text-muted-foreground">
            Gestiona las solicitudes espontáneas de reagendamiento detectadas automáticamente
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Solicitudes Detectadas</CardTitle>
              <CardDescription>
                {requests?.length || 0} solicitudes {statusFilter !== 'all' ? `(${statusFilter})` : 'totales'}
              </CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => setEstadoFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="notified">Notificadas</SelectItem>
                <SelectItem value="resolved">Resueltas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {!requests || requests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No hay solicitudes de reagendamiento {statusFilter !== 'all' ? `con estado "${statusFilter}"` : ''}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Cita Original</TableHead>
                  <TableHead>Mensaje</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Solicitud</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request: any) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.patientName}</TableCell>
                    <TableCell>{request.patientPhone}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(request.appointmentDate).toLocaleDateString('es-ES')}</div>
                        <div className="text-muted-foreground">{getAppointmentTypeLabel(request.appointmentType)}</div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate text-sm" title={request.detectedMessage}>
                        {request.detectedMessage}
                      </div>
                    </TableCell>
                    <TableCell>{getEstadoBadge(request.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(request.createdAt).toLocaleDateString('es-ES')} {new Date(request.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(generateWhatsAppLink(request.patientPhone), '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          WhatsApp
                        </Button>
                        
                        {request.status !== 'resolved' && (
                          <>
                            <Dialog open={isNotesDialogOpen && selectedRequest?.id === request.id} onOpenChange={(open) => {
                              setIsNotesDialogOpen(open);
                              if (open) {
                                setSelectedRequest(request);
                                setNotes(request.notes || '');
                              } else {
                                setSelectedRequest(null);
                                setNotes('');
                              }
                            }}>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <MessageSquare className="h-4 w-4 mr-1" />
                                  Notas
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Agregar Notas</DialogTitle>
                                  <DialogDescription>
                                    Agrega notas internas sobre esta solicitud de reagendamiento
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="notes">Notas</Label>
                                    <Textarea
                                      id="notes"
                                      value={notes}
                                      onChange={(e) => setNotes(e.target.value)}
                                      placeholder="Escribe tus notas aquí..."
                                      rows={4}
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setIsNotesDialogOpen(false)}>
                                    Cancelar
                                  </Button>
                                  <Button onClick={handleAddNotes} disabled={!notes.trim() || addNotesMutation.isPending}>
                                    {addNotesMutation.isPending ? 'Guardando...' : 'Guardar Notas'}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            <Dialog open={isResolveDialogOpen && selectedRequest?.id === request.id} onOpenChange={(open) => {
                              setIsResolveDialogOpen(open);
                              if (open) {
                                setSelectedRequest(request);
                                setNotes(request.notes || '');
                              } else {
                                setSelectedRequest(null);
                                setNotes('');
                              }
                            }}>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="default">
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Resolver
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Marcar como Resuelta</DialogTitle>
                                  <DialogDescription>
                                    ¿Confirmas que esta solicitud de reagendamiento ha sido resuelta?
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="resolve-notes">Notas finales (opcional)</Label>
                                    <Textarea
                                      id="resolve-notes"
                                      value={notes}
                                      onChange={(e) => setNotes(e.target.value)}
                                      placeholder="Agrega notas finales sobre la resolución..."
                                      rows={3}
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setIsResolveDialogOpen(false)}>
                                    Cancelar
                                  </Button>
                                  <Button onClick={handleMarkAsResolved} disabled={markAsResolvedMutation.isPending}>
                                    {markAsResolvedMutation.isPending ? 'Resolviendo...' : 'Marcar como Resuelta'}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
