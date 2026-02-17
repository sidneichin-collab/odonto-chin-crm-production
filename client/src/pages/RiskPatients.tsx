import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Phone, Mail, TrendingUp, Users, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function RiskPatients() {
  const [, setLocation] = useLocation();
  const { data: highRiskPatients, isLoading } = trpc.riskScore.getHighRisk.useQuery();

  const getRiskLevel = (score: number) => {
    if (score >= 75) return { label: "Crítico", variant: "destructive" as const, color: "text-red-600" };
    if (score >= 50) return { label: "Alto", variant: "destructive" as const, color: "text-orange-600" };
    if (score >= 25) return { label: "Médio", variant: "default" as const, color: "text-yellow-600" };
    return { label: "Baixo", variant: "secondary" as const, color: "text-green-600" };
  };

  const getRiskDescription = (score: number, noShowCount: number) => {
    if (score >= 75) {
      return `Paciente com histórico crítico de ${noShowCount} faltas. Requer atenção imediata e estratégia diferenciada.`;
    }
    if (score >= 50) {
      return `Paciente com ${noShowCount} faltas. Recomenda-se confirmação dupla e ligação pessoal.`;
    }
    if (score >= 25) {
      return `Paciente com ${noShowCount} falta(s). Monitorar comportamento e enviar recordatórios extras.`;
    }
    return "Paciente com baixo risco de falta.";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando pacientes en riesgo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/")}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pacientes em Risco</h1>
          <p className="text-muted-foreground">
            Sistema de pontuação de risco para identificar pacientes com histórico de faltas
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risco Crítico</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {highRiskPatients?.filter((p) => p.riskScore >= 75).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Score ≥ 75</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risco Alto</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {highRiskPatients?.filter((p) => p.riskScore >= 50 && p.riskScore < 75).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Score 50-74</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Monitorados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highRiskPatients?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Pacientes com score ≥ 50</p>
          </CardContent>
        </Card>
      </div>

      {/* Risk Patients List */}
      <div className="space-y-4">
        {highRiskPatients && highRiskPatients.length > 0 ? (
          highRiskPatients.map((patient) => {
            const risk = getRiskLevel(patient.riskScore);
            return (
              <Card key={patient.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="flex items-center gap-2">
                        {patient.fullName}
                        <Badge variant={risk.variant}>{risk.label}</Badge>
                        <Badge variant="outline" className={risk.color}>
                          Score: {patient.riskScore}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="space-y-1">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {patient.phone}
                          </span>
                          {patient.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {patient.email}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                          <span className="font-medium">
                            {patient.noShowCount} falta(s) registrada(s)
                          </span>
                        </div>
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setLocation(`/patients/${patient.id}`)}
                    >
                      Ver Detalles
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {getRiskDescription(patient.riskScore, patient.noShowCount || 0)}
                    </p>
                    
                    {/* Risk Score Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Pontuação de Risco</span>
                        <span>{patient.riskScore}/100</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            patient.riskScore >= 75
                              ? "bg-red-600"
                              : patient.riskScore >= 50
                              ? "bg-orange-500"
                              : "bg-yellow-500"
                          }`}
                          style={{ width: `${patient.riskScore}%` }}
                        />
                      </div>
                    </div>

                    {/* Recommended Actions */}
                    <div className="bg-muted/50 p-3 rounded-md">
                      <p className="text-sm font-medium mb-2">Acciones Recomendadas:</p>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        {patient.riskScore >= 75 && (
                          <>
                            <li>• Ligação pessoal obrigatória para confirmação</li>
                            <li>• Enviar recordatórios 3 dias antes da consulta</li>
                            <li>• Confirmação dupla (48h e 24h antes)</li>
                          </>
                        )}
                        {patient.riskScore >= 50 && patient.riskScore < 75 && (
                          <>
                            <li>• Confirmação dupla (48h e 24h antes)</li>
                            <li>• Enviar recordatórios extras</li>
                            <li>• Considerar ligação pessoal</li>
                          </>
                        )}
                        {patient.riskScore < 50 && (
                          <>
                            <li>• Monitorar comportamento</li>
                            <li>• Recordatórios padrão</li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Ninguno paciente en riesgo alto</p>
              <p className="text-sm text-muted-foreground">
                Todos os pacientes têm score de risco abaixo de 50
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Information Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-sm">Como funciona o Score de Risco?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            O sistema calcula automaticamente a pontuação de risco (0-100) baseado em:
          </p>
          <ul className="space-y-1 ml-4">
            <li>• <strong>Número de faltas:</strong> Cada falta aumenta significativamente o score</li>
            <li>• <strong>Taxa de confirmação:</strong> Pacientes que não confirmam consultas têm score mais alto</li>
            <li>• <strong>Histórico recente:</strong> Faltas recentes têm maior peso no cálculo</li>
          </ul>
          <p className="mt-3">
            <strong>Níveis de Risco:</strong>
          </p>
          <ul className="space-y-1 ml-4">
            <li>• <strong className="text-red-600">Crítico (75-100):</strong> Requer atenção imediata</li>
            <li>• <strong className="text-orange-600">Alto (50-74):</strong> Monitoramento intensivo</li>
            <li>• <strong className="text-yellow-600">Médio (25-49):</strong> Acompanhamento regular</li>
            <li>• <strong className="text-green-600">Baixo (0-24):</strong> Comportamento normal</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
