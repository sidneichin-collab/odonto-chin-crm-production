import { useState, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Upload, Plug, FileSpreadsheet, Webhook, Code, Zap, Link as LinkIcon, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { NewAppointmentModal } from "@/components/NewAppointmentModal";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import Papa from "papaparse";

interface CSVRow {
  nome: string;
  telefone: string;
  email?: string;
  data: string;
  horario: string;
  tipo: string;
  cadeira: string;
}

interface ImportResult {
  success: number;
  errors: number;
  duplicates: number;
  errorDetails: Array<{ row: number; error: string; data: any }>;
}

export default function NovaConsulta() {
  const [showManualForm, setShowManualForm] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === "text/csv") {
      processFile(file);
    } else {
      toast.error("Por favor, selecione um arquivo CSV válido");
    }
  };

  const processFile = (file: File) => {
    setCsvFile(file);
    setImportResult(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as CSVRow[];
        setCsvData(data);
        toast.success(`${data.length} registros carregados. Revise e clique em "Importar"`);
      },
      error: (error) => {
        toast.error(`Error ao processar CSV: ${error.message}`);
      },
    });
  };

  const validateRow = (row: CSVRow, index: number): string | null => {
    if (!row.nome || row.nome.trim() === "") {
      return `Linha ${index + 1}: Nome é obrigatório`;
    }
    if (!row.telefone || row.telefone.trim() === "") {
      return `Linha ${index + 1}: Teléfono é obrigatório`;
    }
    if (!row.data || row.data.trim() === "") {
      return `Linha ${index + 1}: Data é obrigatória`;
    }
    if (!row.horario || row.horario.trim() === "") {
      return `Linha ${index + 1}: Horário é obrigatório`;
    }
    if (!row.tipo || !["orthodontics", "general_clinic", "marketing_evaluation"].includes(row.tipo)) {
      return `Linha ${index + 1}: Tipo inválido (use: orthodontics, general_clinic, marketing_evaluation)`;
    }
    if (!row.cadeira || row.cadeira.trim() === "") {
      return `Linha ${index + 1}: Cadeira é obrigatória`;
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(row.data)) {
      return `Linha ${index + 1}: Data deve estar no formato YYYY-MM-DD (ex: 2026-01-26)`;
    }

    // Validate time format (HH:MM)
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(row.horario)) {
      return `Linha ${index + 1}: Horário deve estar no formato HH:MM (ex: 10:00)`;
    }

    return null;
  };

  const handleImport = async () => {
    if (csvData.length === 0) {
      toast.error("Ninguno dado para importar");
      return;
    }

    setIsImporting(true);
    const result: ImportResult = {
      success: 0,
      errors: 0,
      duplicates: 0,
      errorDetails: [],
    };

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      
      // Validate row
      const validationError = validateRow(row, i);
      if (validationError) {
        result.errors++;
        result.errorDetails.push({ row: i + 1, error: validationError, data: row });
        continue;
      }

      try {
        const appointmentDateTime = `${row.data}T${row.horario}:00`;

        await utils.client.import.create.mutate({
          patientName: row.nome.split(' ')[0] || row.nome,
          patientLastName: row.nome.split(' ').slice(1).join(' ') || "(CSV)",
          patientPhone: row.telefone,
          emergencyPhone: row.telefone, // Use same phone as placeholder
          patientEmail: row.email || undefined,
          ubicacion: "Importado CSV",
          cedulaImageUrl: "https://placeholder.com/cedula.jpg", // Placeholder
          appointmentDateTime,
          appointmentType: (row.tipo === "orthodontics" ? "orthodontic_treatment" : row.tipo) as "orthodontic_treatment" | "general_clinic" | "marketing_evaluation",
          chair: row.cadeira,
          duration: 60,
          notes: `Importado via CSV em ${new Date().toLocaleString()}`,
        });

        result.success++;
      } catch (error: any) {
        result.errors++;
        result.errorDetails.push({
          row: i + 1,
          error: error.message || "Error desconhecido",
          data: row,
        });
      }
    }

    setImportResult(result);
    setIsImporting(false);

    // Invalidate queries to refresh data
    utils.appointments.listByDate.invalidate();
    utils.appointments.listByDateRange.invalidate();

    if (result.success > 0) {
      toast.success(`${result.success} consultas importadas com sucesso!`);
    }
    if (result.errors > 0) {
      toast.error(`${result.errors} erros durante a importação`);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nueva Consulta</h1>
          <p className="text-muted-foreground mt-2">
            Agende consultas manualmente, importe via CSV ou configure integrações
          </p>
        </div>

        <Tabs defaultValue="manual" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="manual">
              <Calendar className="h-4 w-4 mr-2" />
              Agendamiento Manual
            </TabsTrigger>
            <TabsTrigger value="csv">
              <Upload className="h-4 w-4 mr-2" />
              Importación CSV
            </TabsTrigger>
            <TabsTrigger value="integrations">
              <Plug className="h-4 w-4 mr-2" />
              Integrações
            </TabsTrigger>
          </TabsList>

          {/* ABA 1: AGENDAMENTO MANUAL */}
          <TabsContent value="manual" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Agendar Nueva Consulta</CardTitle>
                <CardDescription>
                  Preencha os dados do paciente e selecione horário disponível
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setShowManualForm(true)} size="lg" className="w-full">
                  <Calendar className="h-5 w-5 mr-2" />
                  Abrir Formulário de Agendamiento
                </Button>
                
                <div className="mt-6 space-y-2 text-sm text-muted-foreground">
                  <p><strong>💡 Dica:</strong> O formulário permite:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Buscar pacientes existentes ou cadastrar novos</li>
                    <li>Selecionar tipo de consulta (Ortodoncia / Clínico Geral / Marketing)</li>
                    <li>Escolher cadeira disponível</li>
                    <li>Validação automática de horários ocupados</li>
                    <li>Campos de contato completos (WhatsApp, Email, Facebook, Instagram)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA 2: IMPORTAÇÃO CSV */}
          <TabsContent value="csv" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Importación em Lote via CSV</CardTitle>
                <CardDescription>
                  Importe múltiplos agendamentos de uma vez usando arquivo CSV
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Upload Area */}
                <div
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">
                    {csvFile ? csvFile.name : "Arraste seu arquivo CSV aqui"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    ou clique para selecionar
                  </p>
                  <Button variant="outline" type="button">
                    Selecionar Arquivo CSV
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {/* CSV Format Documentation */}
                <div className="space-y-2 text-sm">
                  <h4 className="font-semibold">Formato do CSV:</h4>
                  <div className="bg-muted p-3 rounded font-mono text-xs overflow-x-auto">
                    nome,telefone,email,data,horario,tipo,cadeira<br/>
                    João Silva,+5511999999999,joao@email.com,2026-01-26,10:00,orthodontics,Cadeira 1 Orto
                  </div>
                  
                  <div className="mt-4 space-y-1 text-muted-foreground">
                    <p><strong>Campos obrigatórios:</strong></p>
                    <ul className="list-disc list-inside ml-4">
                      <li>nome, telefone, data, horario, tipo, cadeira</li>
                    </ul>
                    <p className="mt-2"><strong>Tipos válidos:</strong></p>
                    <ul className="list-disc list-inside ml-4">
                      <li>orthodontics, general_clinic, marketing_evaluation</li>
                    </ul>
                    <p className="mt-2"><strong>Formato de data:</strong> YYYY-MM-DD (ex: 2026-01-26)</p>
                    <p><strong>Formato de horário:</strong> HH:MM (ex: 10:00)</p>
                  </div>
                </div>

                {/* Preview Table */}
                {csvData.length > 0 && !importResult && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Preview dos Dados ({csvData.length} registros)</h4>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setCsvData([]);
                            setCsvFile(null);
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button onClick={handleImport} disabled={isImporting}>
                          {isImporting ? "Importando..." : `Importar ${csvData.length} Consultas`}
                        </Button>
                      </div>
                    </div>
                    <div className="border rounded-lg overflow-x-auto max-h-96 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted sticky top-0">
                          <tr>
                            <th className="p-2 text-left">#</th>
                            <th className="p-2 text-left">Nome</th>
                            <th className="p-2 text-left">Teléfono</th>
                            <th className="p-2 text-left">Email</th>
                            <th className="p-2 text-left">Data</th>
                            <th className="p-2 text-left">Horário</th>
                            <th className="p-2 text-left">Tipo</th>
                            <th className="p-2 text-left">Cadeira</th>
                          </tr>
                        </thead>
                        <tbody>
                          {csvData.slice(0, 50).map((row, index) => (
                            <tr key={index} className="border-t">
                              <td className="p-2">{index + 1}</td>
                              <td className="p-2">{row.nome}</td>
                              <td className="p-2">{row.telefone}</td>
                              <td className="p-2">{row.email || "-"}</td>
                              <td className="p-2">{row.data}</td>
                              <td className="p-2">{row.horario}</td>
                              <td className="p-2">{row.tipo}</td>
                              <td className="p-2">{row.cadeira}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {csvData.length > 50 && (
                        <div className="p-3 text-center text-sm text-muted-foreground border-t">
                          Mostrando 50 de {csvData.length} registros
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Import Result */}
                {importResult && (
                  <div className="space-y-3">
                    <h4 className="font-semibold">Resultado da Importación</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                        <CardContent className="p-4 flex items-center gap-3">
                          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                          <div>
                            <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                              {importResult.success}
                            </p>
                            <p className="text-sm text-green-700 dark:text-green-300">Éxito</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
                        <CardContent className="p-4 flex items-center gap-3">
                          <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                          <div>
                            <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                              {importResult.errors}
                            </p>
                            <p className="text-sm text-red-700 dark:text-red-300">Errors</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
                        <CardContent className="p-4 flex items-center gap-3">
                          <AlertCircle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                          <div>
                            <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                              {importResult.duplicates}
                            </p>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300">Duplicados</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {importResult.errorDetails.length > 0 && (
                      <div className="border rounded-lg p-4 bg-red-50 dark:bg-red-950/10">
                        <h5 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                          Detalles dos Errors:
                        </h5>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {importResult.errorDetails.map((detail, index) => (
                            <div key={index} className="text-sm">
                              <p className="font-medium text-red-800 dark:text-red-200">
                                Linha {detail.row}: {detail.error}
                              </p>
                              <p className="text-red-600 dark:text-red-400 text-xs ml-4">
                                {JSON.stringify(detail.data)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={() => {
                        setImportResult(null);
                        setCsvData([]);
                        setCsvFile(null);
                      }}
                      className="w-full"
                    >
                      Nueva Importación
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA 3: INTEGRAÇÕES */}
          <TabsContent value="integrations" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Veretech */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5 text-blue-500" />
                    Veretech (Orthotech)
                  </CardTitle>
                  <CardDescription>
                    Integração com sistema Orthotech da Veretech
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Estado:</span>
                    <span className="text-sm text-orange-500">⏳ Aguardando API</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Entre em contato com suporte da Veretech para obter credenciais de API e documentação.
                  </p>
                  <Button variant="outline" size="sm" className="w-full" disabled>
                    Configurar Integração
                  </Button>
                </CardContent>
              </Card>

              {/* n8n */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-purple-500" />
                    n8n
                  </CardTitle>
                  <CardDescription>
                    Automação de workflows com n8n
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Estado:</span>
                    <span className="text-sm text-muted-foreground">⚪ Não configurado</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Configure webhooks do n8n para receber agendamentos automaticamente.
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    Configurar n8n
                  </Button>
                </CardContent>
              </Card>

              {/* Webhooks */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Webhook className="h-5 w-5 text-green-500" />
                    Webhooks
                  </CardTitle>
                  <CardDescription>
                    Receba agendamentos via webhooks genéricos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Estado:</span>
                    <span className="text-sm text-muted-foreground">⚪ Não configurado</span>
                  </div>
                  <div className="bg-muted p-2 rounded text-xs font-mono break-all">
                    POST /api/webhooks/appointments
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    Ver Documentação
                  </Button>
                </CardContent>
              </Card>

              {/* API REST */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5 text-cyan-500" />
                    API REST
                  </CardTitle>
                  <CardDescription>
                    Integre via API REST com qualquer sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Estado:</span>
                    <span className="text-sm text-green-500">✅ Disponível</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use nossa API tRPC para criar agendamentos programaticamente.
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    Ver Documentação API
                  </Button>
                </CardContent>
              </Card>

              {/* Zapier */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-orange-500" />
                    Zapier
                  </CardTitle>
                  <CardDescription>
                    Conecte com 5000+ aplicativos via Zapier
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Estado:</span>
                    <span className="text-sm text-muted-foreground">⚪ Não configurado</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Configure Zaps para automatizar agendamentos de formulários, Google Forms, etc.
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    Configurar Zapier
                  </Button>
                </CardContent>
              </Card>

              {/* Make (Integromat) */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LinkIcon className="h-5 w-5 text-indigo-500" />
                    Make (Integromat)
                  </CardTitle>
                  <CardDescription>
                    Automação visual com Make
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Estado:</span>
                    <span className="text-sm text-muted-foreground">⚪ Não configurado</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Crie cenários no Make para integrar com múltiplos sistemas.
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    Configurar Make
                  </Button>
                </CardContent>
              </Card>

              {/* Google Calendar */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-red-500" />
                    Google Calendar
                  </CardTitle>
                  <CardDescription>
                    Sincronize agendamentos com Google Calendar
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Estado:</span>
                    <span className="text-sm text-muted-foreground">⚪ Não configurado</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sincronização bidirecional com Google Calendar.
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    Conectar Google
                  </Button>
                </CardContent>
              </Card>

              {/* Outros Sistemas Odontológicos */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Outros Sistemas Odontológicos</CardTitle>
                  <CardDescription>
                    Integrações disponíveis com principais sistemas do mercado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {["Dentrix", "Dental Office", "Clinicorp", "Simples Dental"].map((system) => (
                      <div key={system} className="border rounded-lg p-3 text-center">
                        <p className="text-sm font-medium">{system}</p>
                        <p className="text-xs text-muted-foreground mt-1">Em breve</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de Agendamiento Manual */}
      <NewAppointmentModal
        open={showManualForm}
        onOpenChange={setShowManualForm}
        onSuccess={() => {
          setShowManualForm(false);
        }}
      />
    </DashboardLayout>
  );
}
