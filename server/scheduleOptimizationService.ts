/**
 * Serviço de Otimização e Sugestão de Horários
 * Recomenda os melhores horários para agendamento baseado em análise de demanda
 */

interface SchedulingSuggestion {
  date: string;
  time: string;
  chair: string;
  specialty: string;
  availableSlots: number;
  demandLevel: "low" | "medium" | "high";
  score: number;
  reason: string;
}

interface LoadBalancingResult {
  currentLoad: Record<string, number>;
  suggestedReallocation: Array<{
    from: string;
    to: string;
    appointmentCount: number;
    reason: string;
  }>;
  balancedLoad: Record<string, number>;
  improvementPercentage: number;
}

interface ChairAllocationOptimization {
  chair: string;
  currentUtilization: number;
  recommendedUtilization: number;
  suggestedAppointments: number;
  reallocationPriority: "high" | "medium" | "low";
}

/**
 * Sugere os melhores horários para agendamento
 */
export function suggestOptimalSchedulingTimes(
  appointments: Array<{
    appointmentDate: string;
    appointmentTime: string;
    status: string;
    chair: string;
    specialty: string;
  }>,
  specialty: string,
  chair: string,
  numberOfSuggestions: number = 5
): SchedulingSuggestion[] {
  const suggestions: SchedulingSuggestion[] = [];

  // Agrupar agendamentos por data, hora e cadeira
  const timeSlots: Record<string, Record<string, Record<string, number>>> = {};

  appointments.forEach((a) => {
    if (!timeSlots[a.appointmentDate]) {
      timeSlots[a.appointmentDate] = {};
    }
    if (!timeSlots[a.appointmentDate][a.appointmentTime]) {
      timeSlots[a.appointmentDate][a.appointmentTime] = {};
    }
    if (!timeSlots[a.appointmentDate][a.appointmentTime][a.chair]) {
      timeSlots[a.appointmentDate][a.appointmentTime][a.chair] = 0;
    }
    timeSlots[a.appointmentDate][a.appointmentTime][a.chair]++;
  });

  // Gerar sugestões
  Object.entries(timeSlots).forEach(([date, times]) => {
    Object.entries(times).forEach(([time, chairs]) => {
      const slotCount = chairs[chair] || 0;
      const availableSlots = 4 - slotCount; // 4 slots por hora

      if (availableSlots > 0) {
        let demandLevel: "low" | "medium" | "high" = "low";
        if (availableSlots === 1) demandLevel = "high";
        else if (availableSlots <= 2) demandLevel = "medium";

        // Calcular score (quanto maior, melhor)
        let score = availableSlots * 10; // Priorizar slots com mais disponibilidade

        // Penalizar horários com alta demanda
        if (demandLevel === "high") score -= 5;

        // Priorizar horários de pico (9:00-11:00, 14:00-16:00)
        const hour = parseInt(time.split(":")[0]);
        if ((hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 16)) {
          score += 3;
        }

        const reason = generateSchedulingReason(availableSlots, demandLevel, hour);

        suggestions.push({
          date,
          time,
          chair,
          specialty,
          availableSlots,
          demandLevel,
          score,
          reason,
        });
      }
    });
  });

  // Ordenar por score (descendente) e retornar as top N sugestões
  return suggestions.sort((a, b) => b.score - a.score).slice(0, numberOfSuggestions);
}

/**
 * Gera motivo da sugestão de horário
 */
export function generateSchedulingReason(
  availableSlots: number,
  demandLevel: string,
  hour: number
): string {
  let reason = "";

  if (availableSlots >= 3) {
    reason = "✅ Horário com boa disponibilidade";
  } else if (availableSlots === 2) {
    reason = "⚠️ Horário com disponibilidade moderada";
  } else {
    reason = "🔴 Horário com disponibilidade limitada";
  }

  if ((hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 16)) {
    reason += " - Horário de pico preferido";
  }

  return reason;
}

/**
 * Analisa e sugere rebalanceamento de carga diária
 */
export function analyzeLoadBalancing(
  appointments: Array<{
    appointmentDate: string;
    chair: string;
  }>
): LoadBalancingResult {
  // Calcular carga atual por cadeira
  const currentLoad: Record<string, number> = {};
  appointments.forEach((a) => {
    currentLoad[a.chair] = (currentLoad[a.chair] || 0) + 1;
  });

  // Calcular carga média ideal
  const totalAppointments = appointments.length;
  const numberOfChairs = Object.keys(currentLoad).length;
  const idealLoadPerChair = Math.round(totalAppointments / numberOfChairs);

  // Identificar cadeiras sobrecarregadas e subcarregadas
  const overloadedChairs: Array<{ chair: string; excess: number }> = [];
  const underloadedChairs: Array<{ chair: string; deficit: number }> = [];

  Object.entries(currentLoad).forEach(([chair, load]) => {
    if (load > idealLoadPerChair) {
      overloadedChairs.push({ chair, excess: load - idealLoadPerChair });
    } else if (load < idealLoadPerChair) {
      underloadedChairs.push({ chair, deficit: idealLoadPerChair - load });
    }
  });

  // Gerar sugestões de realocação
  const suggestedReallocation: Array<{
    from: string;
    to: string;
    appointmentCount: number;
    reason: string;
  }> = [];

  overloadedChairs.forEach((overloaded) => {
    underloadedChairs.forEach((underloaded) => {
      if (overloaded.excess > 0 && underloaded.deficit > 0) {
        const moveCount = Math.min(overloaded.excess, underloaded.deficit);
        suggestedReallocation.push({
          from: overloaded.chair,
          to: underloaded.chair,
          appointmentCount: moveCount,
          reason: `Mover ${moveCount} agendamento(s) de ${overloaded.chair} para ${underloaded.chair} para melhor distribuição`,
        });
        overloaded.excess -= moveCount;
        underloaded.deficit -= moveCount;
      }
    });
  });

  // Calcular carga balanceada após realocação
  const balancedLoad = { ...currentLoad };
  suggestedReallocation.forEach((reallocation) => {
    balancedLoad[reallocation.from] -= reallocation.appointmentCount;
    balancedLoad[reallocation.to] += reallocation.appointmentCount;
  });

  // Calcular melhoria percentual
  const currentImbalance = calculateImbalance(currentLoad);
  const balancedImbalance = calculateImbalance(balancedLoad);
  const improvementPercentage = Math.round(((currentImbalance - balancedImbalance) / currentImbalance) * 100);

  return {
    currentLoad,
    suggestedReallocation,
    balancedLoad,
    improvementPercentage,
  };
}

/**
 * Calcula o índice de desbalanceamento
 */
export function calculateImbalance(load: Record<string, number>): number {
  const values = Object.values(load);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Otimiza alocação de cadeiras
 */
export function optimizeChairAllocation(
  appointments: Array<{
    chair: string;
    specialty: string;
  }>,
  totalChairsPerSpecialty: Record<string, number>
): ChairAllocationOptimization[] {
  const specialtyChairs: Record<string, Record<string, number>> = {};

  // Agrupar por especialidade e cadeira
  appointments.forEach((a) => {
    if (!specialtyChairs[a.specialty]) {
      specialtyChairs[a.specialty] = {};
    }
    specialtyChairs[a.specialty][a.chair] = (specialtyChairs[a.specialty][a.chair] || 0) + 1;
  });

  const optimizations: ChairAllocationOptimization[] = [];

  // Analisar cada especialidade
  Object.entries(specialtyChairs).forEach(([specialty, chairs]) => {
    const totalAppointments = Object.values(chairs).reduce((a, b) => a + b, 0);
    const totalChairs = totalChairsPerSpecialty[specialty] || Object.keys(chairs).length;
    const recommendedAppointmentsPerChair = Math.round(totalAppointments / totalChairs);

    Object.entries(chairs).forEach(([chair, count]) => {
      const utilizationRate = (count / recommendedAppointmentsPerChair) * 100;
      let priority: "high" | "medium" | "low" = "low";

      if (utilizationRate > 120) priority = "high";
      else if (utilizationRate > 110) priority = "medium";

      optimizations.push({
        chair,
        currentUtilization: count,
        recommendedUtilization: recommendedAppointmentsPerChair,
        suggestedAppointments: recommendedAppointmentsPerChair - count,
        reallocationPriority: priority,
      });
    });
  });

  return optimizations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.reallocationPriority] - priorityOrder[b.reallocationPriority];
  });
}

/**
 * Gera recomendações de agendamento para a secretária
 */
export function generateSchedulingRecommendations(
  appointments: Array<{
    appointmentDate: string;
    appointmentTime: string;
    status: string;
    chair: string;
    specialty: string;
  }>
): string[] {
  const recommendations: string[] = [];

  // Analisar distribuição por dia da semana
  const dayDistribution: Record<string, number> = {};
  appointments.forEach((a) => {
    const date = new Date(a.appointmentDate);
    const dayOfWeek = date.toLocaleDateString("pt-BR", { weekday: "long" });
    dayDistribution[dayOfWeek] = (dayDistribution[dayOfWeek] || 0) + 1;
  });

  const days = Object.entries(dayDistribution).sort((a, b) => b[1] - a[1]);
  if (days.length > 0) {
    const maxDay = days[0];
    const minDay = days[days.length - 1];

    if (maxDay[1] > minDay[1] * 1.5) {
      recommendations.push(
        `📊 ${maxDay[0]} tem ${maxDay[1]} agendamentos, enquanto ${minDay[0]} tem apenas ${minDay[1]}. Considere distribuir melhor.`
      );
    }
  }

  // Analisar distribuição por hora
  const hourDistribution: Record<string, number> = {};
  appointments.forEach((a) => {
    const hour = a.appointmentTime.split(":")[0];
    hourDistribution[hour] = (hourDistribution[hour] || 0) + 1;
  });

  const hours = Object.entries(hourDistribution).sort((a, b) => b[1] - a[1]);
  if (hours[0][1] > hours[hours.length - 1][1] * 2) {
    recommendations.push(
      `⏰ Horário ${hours[0][0]}:00 tem ${hours[0][1]} agendamentos. Considere distribuir para horários menos ocupados.`
    );
  }

  // Analisar taxa de confirmação
  const confirmed = appointments.filter((a) => a.status === "confirmed").length;
  const confirmationRate = (confirmed / appointments.length) * 100;

  if (confirmationRate < 50) {
    recommendations.push(
      `🔔 Taxa de confirmação baixa (${Math.round(confirmationRate)}%). Intensificar recordatórios.`
    );
  }

  return recommendations;
}
