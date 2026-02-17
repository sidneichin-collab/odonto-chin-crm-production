import { useState } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X } from "lucide-react";
import { toast } from "sonner";

interface ParsedPatient {
  fullName: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  address?: string;
  status?: "active" | "inactive" | "defaulter" | "at_risk";
  notes?: string;
}

export default function Import() {
  const [parsedData, setParsedData] = useState<ParsedPatient[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    total: number;
    success: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  const importPatients = trpc.import.importPatients.useMutation();

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFileName(file.name);
    setImportResult(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const mapped: ParsedPatient[] = results.data.map((row: any) => ({
          fullName: row["Nome"] || row["nome"] || row["fullName"] || row["name"] || "",
          phone: row["Teléfono"] || row["telefone"] || row["phone"] || "",
          email: row["Email"] || row["email"] || undefined,
          dateOfBirth: row["Data de Nascimento"] || row["dateOfBirth"] || undefined,
          address: row["Dirección"] || row["endereco"] || row["address"] || undefined,
          status: (row["Estado"] || row["status"] || "active").toLowerCase() as any,
          notes: row["Observaciones"] || row["observacoes"] || row["notes"] || undefined,
        }));

        // Filter out rows with missing required fields
        const valid = mapped.filter(p => p.fullName && p.phone);
        setParsedData(valid);

        if (valid.length === 0) {
          toast.error("Ninguno dado válido encontrado no arquivo CSV");
        } else {
          toast.success(`${valid.length} pacientes encontrados no arquivo`);
        }
      },
      error: (error) => {
        toast.error(`Error ao processar CSV: ${error.message}`);
      },
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".csv"],
    },
    maxFiles: 1,
  });

  const handleImport = async () => {
    if (parsedData.length === 0) {
      toast.error("Ninguno dado para importar");
      return;
    }

    setImporting(true);
    try {
      const result = await importPatients.mutateAsync({
        patients: parsedData,
        skipDuplicates: true,
      });

      setImportResult(result);

      if (result.success > 0) {
        toast.success(`${result.success} pacientes importados com sucesso!`);
      }
      if (result.skipped > 0) {
        toast.info(`${result.skipped} pacientes duplicados foram ignorados`);
      }
      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} erros durante a importação`);
      }
    } catch (error) {
      toast.error("Error ao importar pacientes");
      console.error(error);
    } finally {
      setImporting(false);
    }
  };

  const handleClear = () => {
    setParsedData([]);
    setFileName("");
    setImportResult(null);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Importación CSV</h1>
        <p className="text-muted-foreground mt-2">
          Importe pacientes do sistema Veretech ou qualquer arquivo CSV
        </p>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload de Arquivo CSV</CardTitle>
          <CardDescription>
            Arraste e solte seu arquivo CSV ou clique para selecionar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              {isDragActive ? (
                <>
                  <Upload className="h-12 w-12 text-primary" />
                  <p className="text-lg font-medium">Solte o arquivo aqui...</p>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
                  <div>
                    <p className="text-lg font-medium">
                      Arraste um arquivo CSV ou clique para selecionar
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Formato esperado: Nome, Teléfono, Email, Data de Nascimento, Dirección
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {fileName && (
            <Alert className="mt-4">
              <FileSpreadsheet className="h-4 w-4" />
              <AlertDescription>
                Arquivo carregado: <strong>{fileName}</strong> ({parsedData.length} registros válidos)
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Preview Table */}
      {parsedData.length > 0 && !importResult && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Preview dos Dados</CardTitle>
              <CardDescription>
                Revise os dados antes de importar ({parsedData.length} pacientes)
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClear}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleImport} disabled={importing}>
                {importing ? "Importando..." : "Importar Pacientes"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Data de Nascimento</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.slice(0, 50).map((patient, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{patient.fullName}</TableCell>
                      <TableCell>{patient.phone}</TableCell>
                      <TableCell>{patient.email || "-"}</TableCell>
                      <TableCell>{patient.dateOfBirth || "-"}</TableCell>
                      <TableCell>
                        <span className="capitalize">{patient.status || "active"}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {parsedData.length > 50 && (
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Mostrando 50 de {parsedData.length} registros
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Import Result */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Resultado da Importación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">{importResult.success}</div>
                  <p className="text-sm text-muted-foreground">Importados com sucesso</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-orange-600">{importResult.skipped}</div>
                  <p className="text-sm text-muted-foreground">Duplicados ignorados</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-red-600">
                    {importResult.errors.length}
                  </div>
                  <p className="text-sm text-muted-foreground">Errors</p>
                </CardContent>
              </Card>
            </div>

            {importResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-2">Errors durante a importação:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {importResult.errors.slice(0, 10).map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                  {importResult.errors.length > 10 && (
                    <p className="text-sm mt-2">
                      ... e mais {importResult.errors.length - 10} erros
                    </p>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button onClick={handleClear} variant="outline">
                Importar Outro Arquivo
              </Button>
              <Button onClick={() => (window.location.href = "/pacientes")}>
                Ver Pacientes Importados
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instruções de Importación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Formato do CSV</h3>
            <p className="text-sm text-muted-foreground">
              O arquivo CSV deve conter as seguintes colunas (nomes podem variar):
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
              <li><strong>Nome</strong> (obrigatório) - Nombre completo do paciente</li>
              <li><strong>Teléfono</strong> (obrigatório) - Número de telefone com DDD</li>
              <li><strong>Email</strong> (opcional) - Dirección de email</li>
              <li><strong>Data de Nascimento</strong> (opcional) - Formato: DD/MM/AAAA</li>
              <li><strong>Dirección</strong> (opcional) - Dirección completo</li>
              <li><strong>Estado</strong> (opcional) - active, inactive, defaulter, at_risk</li>
              <li><strong>Observaciones</strong> (opcional) - Notas sobre o paciente</li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium mb-2">Detecção de Duplicados</h3>
            <p className="text-sm text-muted-foreground">
              O sistema detecta automaticamente pacientes duplicados baseado no telefone e email.
              Pacientes duplicados serão ignorados durante a importação.
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-2">Exemplo de CSV</h3>
            <div className="bg-muted p-4 rounded-lg text-sm font-mono">
              Nome,Teléfono,Email,Data de Nascimento,Estado<br />
              João Silva,11999999999,joao@email.com,01/01/1990,active<br />
              Maria Santos,11988888888,maria@email.com,15/05/1985,active
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
