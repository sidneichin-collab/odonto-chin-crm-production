/**
 * A/B Testing System for Persuasion Templates
 * 
 * Sistema para testar diferentes templates e medir efetividade
 * Usa técnicas estatísticas para determinar o melhor template
 */

export interface ABTestConfig {
  testId: string;
  name: string;
  description: string;
  templateA: {
    level: number;
    name: string;
    description: string;
  };
  templateB: {
    level: number;
    name: string;
    description: string;
  };
  startDate: Date;
  endDate?: Date;
  status: "active" | "paused" | "completed";
  sampleSize: number;
  confidenceLevel: number; // 0.90, 0.95, 0.99
}

export interface ABTestResult {
  testId: string;
  templateA: {
    confirmations: number;
    totalAttempts: number;
    confirmationRate: number;
    averageConfidence: number;
    standardDeviation: number;
  };
  templateB: {
    confirmations: number;
    totalAttempts: number;
    confirmationRate: number;
    averageConfidence: number;
    standardDeviation: number;
  };
  winner?: "A" | "B" | "tie";
  pValue: number;
  isStatisticallySignificant: boolean;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  recommendation: string;
}

export interface ABTestMetrics {
  testId: string;
  templateId: number;
  confirmations: number;
  totalAttempts: number;
  confirmationRate: number;
  averageConfidence: number;
  averageResponseTime: number; // em minutos
  conversionFunnel: {
    sent: number;
    opened: number;
    clicked: number;
    confirmed: number;
  };
}

/**
 * Create A/B test configuration
 */
export function createABTest(config: Omit<ABTestConfig, "testId">): ABTestConfig {
  return {
    testId: `ab-test-${Date.now()}`,
    ...config,
  };
}

/**
 * Calculate confirmation rate
 */
export function calculateConfirmationRate(confirmations: number, totalAttempts: number): number {
  if (totalAttempts === 0) return 0;
  return (confirmations / totalAttempts) * 100;
}

/**
 * Calculate standard deviation
 */
export function calculateStandardDeviation(confirmationRate: number, totalAttempts: number): number {
  const p = confirmationRate / 100;
  const variance = p * (1 - p) / totalAttempts;
  return Math.sqrt(variance) * 100;
}

/**
 * Perform two-proportion z-test
 * Returns p-value for statistical significance
 */
export function performZTest(
  confirmationsA: number,
  totalA: number,
  confirmationsB: number,
  totalB: number
): number {
  const pA = confirmationsA / totalA;
  const pB = confirmationsB / totalB;
  const pPooled = (confirmationsA + confirmationsB) / (totalA + totalB);

  const sePooled = Math.sqrt(pPooled * (1 - pPooled) * (1 / totalA + 1 / totalB));

  if (sePooled === 0) return 1;

  const zScore = (pA - pB) / sePooled;
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));

  return pValue;
}

/**
 * Normal cumulative distribution function (approximation)
 */
function normalCDF(z: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = z < 0 ? -1 : 1;
  z = Math.abs(z) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * z);
  const t2 = t * t;
  const t3 = t2 * t;
  const t4 = t3 * t;
  const t5 = t4 * t;

  const y = 1.0 - (a5 * t5 + a4 * t4 + a3 * t3 + a2 * t2 + a1 * t) * Math.exp(-z * z);

  return 0.5 * (1.0 + sign * y);
}

/**
 * Calculate confidence interval using normal approximation
 */
export function calculateConfidenceInterval(
  confirmationRate: number,
  totalAttempts: number,
  confidenceLevel: number = 0.95
): { lower: number; upper: number } {
  const p = confirmationRate / 100;
  const se = Math.sqrt((p * (1 - p)) / totalAttempts);

  // Z-score for 95% confidence: 1.96
  const zScore = confidenceLevel === 0.95 ? 1.96 : confidenceLevel === 0.99 ? 2.576 : 1.645;

  const marginOfError = zScore * se * 100;

  return {
    lower: Math.max(0, confirmationRate - marginOfError),
    upper: Math.min(100, confirmationRate + marginOfError),
  };
}

/**
 * Analyze A/B test results
 */
export function analyzeABTest(
  metricsA: ABTestMetrics,
  metricsB: ABTestMetrics,
  confidenceLevel: number = 0.95
): ABTestResult {
  const rateA = calculateConfirmationRate(metricsA.confirmations, metricsA.totalAttempts);
  const rateB = calculateConfirmationRate(metricsB.confirmations, metricsB.totalAttempts);

  const stdDevA = calculateStandardDeviation(rateA, metricsA.totalAttempts);
  const stdDevB = calculateStandardDeviation(rateB, metricsB.totalAttempts);

  const pValue = performZTest(
    metricsA.confirmations,
    metricsA.totalAttempts,
    metricsB.confirmations,
    metricsB.totalAttempts
  );

  const isSignificant = pValue < (1 - confidenceLevel);

  const confidenceInterval = calculateConfidenceInterval(rateA - rateB, Math.min(metricsA.totalAttempts, metricsB.totalAttempts), confidenceLevel);

  let winner: "A" | "B" | "tie" = "tie";
  if (isSignificant) {
    winner = rateA > rateB ? "A" : "B";
  }

  const recommendation = getRecommendation(winner, rateA, rateB, isSignificant, metricsA.totalAttempts, metricsB.totalAttempts);

  return {
    testId: metricsA.testId,
    templateA: {
      confirmations: metricsA.confirmations,
      totalAttempts: metricsA.totalAttempts,
      confirmationRate: rateA,
      averageConfidence: metricsA.averageConfidence,
      standardDeviation: stdDevA,
    },
    templateB: {
      confirmations: metricsB.confirmations,
      totalAttempts: metricsB.totalAttempts,
      confirmationRate: rateB,
      averageConfidence: metricsB.averageConfidence,
      standardDeviation: stdDevB,
    },
    winner,
    pValue,
    isStatisticallySignificant: isSignificant,
    confidenceInterval,
    recommendation,
  };
}

/**
 * Get recommendation based on test results
 */
function getRecommendation(
  winner: "A" | "B" | "tie",
  rateA: number,
  rateB: number,
  isSignificant: boolean,
  sampleA: number,
  sampleB: number
): string {
  if (!isSignificant) {
    return `Resultados não são estatisticamente significativos. Aumente o tamanho da amostra (mínimo ${Math.max(sampleA, sampleB) * 2} tentativas por template).`;
  }

  if (winner === "tie") {
    return "Os templates têm desempenho similar. Escolha baseado em outros critérios (custo, satisfação do cliente, etc.).";
  }

  const winnerRate = winner === "A" ? rateA : rateB;
  const loserRate = winner === "A" ? rateB : rateA;
  const improvement = ((winnerRate - loserRate) / loserRate) * 100;

  return `Template ${winner} é o vencedor com ${winnerRate.toFixed(1)}% de taxa de confirmação (${improvement.toFixed(1)}% melhor). Recomendamos usar este template para novos agendamentos.`;
}

/**
 * Calculate sample size needed for statistical significance
 */
export function calculateSampleSize(
  baselineRate: number,
  minDetectableEffect: number,
  confidenceLevel: number = 0.95,
  power: number = 0.80
): number {
  // Using simplified formula for two-proportion test
  const z_alpha = confidenceLevel === 0.95 ? 1.96 : confidenceLevel === 0.99 ? 2.576 : 1.645;
  const z_beta = power === 0.80 ? 0.84 : power === 0.90 ? 1.28 : 1.645;

  const p1 = baselineRate / 100;
  const p2 = (baselineRate + minDetectableEffect) / 100;

  const numerator = (z_alpha + z_beta) ** 2 * (p1 * (1 - p1) + p2 * (1 - p2));
  const denominator = (p2 - p1) ** 2;

  return Math.ceil(numerator / denominator);
}

/**
 * Get conversion funnel analysis
 */
export function analyzeConversionFunnel(metrics: ABTestMetrics): {
  openRate: number;
  clickRate: number;
  confirmationRate: number;
  dropOffRates: {
    afterSent: number;
    afterOpened: number;
    afterClicked: number;
  };
} {
  const { sent, opened, clicked, confirmed } = metrics.conversionFunnel;

  return {
    openRate: (opened / sent) * 100,
    clickRate: (clicked / opened) * 100,
    confirmationRate: (confirmed / clicked) * 100,
    dropOffRates: {
      afterSent: ((sent - opened) / sent) * 100,
      afterOpened: ((opened - clicked) / opened) * 100,
      afterClicked: ((clicked - confirmed) / clicked) * 100,
    },
  };
}

/**
 * Get A/B test summary
 */
export function getABTestSummary(result: ABTestResult): string {
  const templateA = result.templateA;
  const templateB = result.templateB;
  const winner = result.winner;

  return `
A/B Test Results:
================

Template A:
- Confirmações: ${templateA.confirmations}/${templateA.totalAttempts}
- Taxa: ${templateA.confirmationRate.toFixed(2)}%
- Confiança Média: ${templateA.averageConfidence.toFixed(2)}%
- Desvio Padrão: ${templateA.standardDeviation.toFixed(2)}%

Template B:
- Confirmações: ${templateB.confirmations}/${templateB.totalAttempts}
- Taxa: ${templateB.confirmationRate.toFixed(2)}%
- Confiança Média: ${templateB.averageConfidence.toFixed(2)}%
- Desvio Padrão: ${templateB.standardDeviation.toFixed(2)}%

Análise Estatística:
- P-value: ${result.pValue.toFixed(4)}
- Significância: ${result.isStatisticallySignificant ? "SIM" : "NÃO"}
- Intervalo de Confiança: [${result.confidenceInterval.lower.toFixed(2)}%, ${result.confidenceInterval.upper.toFixed(2)}%]

Resultado:
- Vencedor: ${winner === "tie" ? "Empate" : `Template ${winner}`}
- Recomendação: ${result.recommendation}
`;
}

/**
 * Get best template based on multiple metrics
 */
export function getBestTemplate(
  metricsA: ABTestMetrics,
  metricsB: ABTestMetrics,
  weights: {
    confirmationRate: number;
    averageConfidence: number;
    responseTime: number;
  } = { confirmationRate: 0.6, averageConfidence: 0.3, responseTime: 0.1 }
): "A" | "B" {
  const rateA = calculateConfirmationRate(metricsA.confirmations, metricsA.totalAttempts);
  const rateB = calculateConfirmationRate(metricsB.confirmations, metricsB.totalAttempts);

  // Normalize response time (lower is better, so we invert)
  const maxResponseTime = Math.max(metricsA.averageResponseTime, metricsB.averageResponseTime);
  const responseTimeScoreA = (maxResponseTime - metricsA.averageResponseTime) / maxResponseTime;
  const responseTimeScoreB = (maxResponseTime - metricsB.averageResponseTime) / maxResponseTime;

  const scoreA =
    (rateA / 100) * weights.confirmationRate +
    (metricsA.averageConfidence / 100) * weights.averageConfidence +
    responseTimeScoreA * weights.responseTime;

  const scoreB =
    (rateB / 100) * weights.confirmationRate +
    (metricsB.averageConfidence / 100) * weights.averageConfidence +
    responseTimeScoreB * weights.responseTime;

  return scoreA > scoreB ? "A" : "B";
}

/**
 * Validate A/B test is ready to conclude
 */
export function isTestReadyToConclude(
  metricsA: ABTestMetrics,
  metricsB: ABTestMetrics,
  minSampleSize: number = 100
): { ready: boolean; reason: string } {
  if (metricsA.totalAttempts < minSampleSize) {
    return {
      ready: false,
      reason: `Template A: ${metricsA.totalAttempts}/${minSampleSize} amostras. Precisa de mais ${minSampleSize - metricsA.totalAttempts} tentativas.`,
    };
  }

  if (metricsB.totalAttempts < minSampleSize) {
    return {
      ready: false,
      reason: `Template B: ${metricsB.totalAttempts}/${minSampleSize} amostras. Precisa de mais ${minSampleSize - metricsB.totalAttempts} tentativas.`,
    };
  }

  return {
    ready: true,
    reason: "Ambos os templates têm amostra suficiente para análise.",
  };
}
