/**
 * Serviço de Análise de Demanda e Padrões de Agenda
 * Analisa a distribuição de agendamentos ao longo do mês
 * e identifica padrões de demanda
 */

interface DayLoadAnalysis {
  date: string;
  dayOfWeek: string;
  totalAppointments: number;
  confirmedAppointments: number;
  pendingAppointments: number;
  noShowAppointments: number;
  availableSlots: number;
  utilizationRate: number;
  loadLevel: "low" | "medium" | "high" | "critical";
  chairDistribution: Record<string, number>;
  specialtyDistribution: Record<string, number>;
}

interface MonthAnalysis {
  month: string;
  year: number;
  totalAppointments: number;
  averageDailyAppointments: number;
  peakDays: DayLoadAnalysis[];
  lowDays: DayLoadAnalysis[];
  utilizationRate: number;
  chairUtilization: Record<string, number>;
  specialtyDemand: Record<string, number>;
  recommendations: string[];
}

interface HourlyPattern {
  hour: string;
  totalAppointments: number;
  availableSlots: number;
  utilizationRate: number;
  demandLevel: "low" | "medium" | "high";
}

/**
 * Analisa a carga de um dia específico
 */
export function analyzeDayLoad(
  date: string,
  appointments: Array<{
    id?: number;
    appointmentDate: string;
    appointmentTime: string;
    status: string;
    chair: string;
    specialty: string;
  }>,
  totalSlotsPerDay: number = 40
): DayLoadAnalysis {
  const dayAppointments = appointments.filter((a) => a.appointmentDate === date);

  const confirmedCount = dayAppointments.filter((a) => a.status === "confirmed").length;
  const pendingCount = dayAppointments.filter((a) => a.status === "pending").length;
  const noShowCount = dayAppointments.filter((a) => a.status === "no_show").length;

  const utilizationRate = (dayAppointments.length / totalSlotsPerDay) * 100;

  let loadLevel: "low" | "medium" | "high" | "critical" = "low";
  if (utilizationRate >= 90) loadLevel = "critical";
  else if (utilizationRate >= 70) loadLevel = "high";
  else if (utilizationRate >= 50) loadLevel = "medium";

  // Distribuição por cadeira
  const chairDistribution: Record<string, number> = {};
  dayAppointments.forEach((a) => {
    chairDistribution[a.chair] = (chairDistribution[a.chair] || 0) + 1;
  });

  // Distribuição por especialidade
  const specialtyDistribution: Record<string, number> = {};
  dayAppointments.forEach((a) => {
    specialtyDistribution[a.specialty] = (specialtyDistribution[a.specialty] || 0) + 1;
  });

  const dayOfWeek = new Date(date).toLocaleDateString("pt-BR", { weekday: "long" });

  return {
    date,
    dayOfWeek,
    totalAppointments: dayAppointments.length,
    confirmedAppointments: confirmedCount,
    pendingAppointments: pendingCount,
    noShowAppointments: noShowCount,
    availableSlots: totalSlotsPerDay - dayAppointments.length,
    utilizationRate: Math.round(utilizationRate),
    loadLevel,
    chairDistribution,
    specialtyDistribution,
  };
}

/**
 * Analisa padrões horários de demanda
 */
export function analyzeHourlyPatterns(
  appointments: Array<{
    appointmentTime: string;
    status: string;
  }>,
  operatingHours: { start: string; end: string } = { start: "08:00", end: "18:00" }
): HourlyPattern[] {
  const patterns: HourlyPattern[] = [];

  // Gerar padrões para cada hora do dia
  for (let hour = 8; hour < 18; hour++) {
    const hourStr = `${hour.toString().padStart(2, "0")}:00`;
    const hourAppointments = appointments.filter((a) => a.appointmentTime.startsWith(hourStr));

    const utilizationRate = (hourAppointments.length / 4) * 100; // 4 slots por hora (15 min cada)

    let demandLevel: "low" | "medium" | "high" = "low";
    if (utilizationRate >= 75) demandLevel = "high";
    else if (utilizationRate >= 50) demandLevel = "medium";

    patterns.push({
      hour: hourStr,
      totalAppointments: hourAppointments.length,
      availableSlots: 4 - hourAppointments.length,
      utilizationRate: Math.round(utilizationRate),
      demandLevel,
    });
  }

  return patterns;
}

/**
 * Analisa a distribuição mensal de agendamentos
 */
export function analyzeMonthlyDistribution(
  month: number,
  year: number,
  appointments: Array<{
    id?: number;
    appointmentDate: string;
    appointmentTime: string;
    status: string;
    chair: string;
    specialty: string;
  }>,
  totalSlotsPerDay: number = 40
): MonthAnalysis {
  // Filtrar agendamentos do mês
  const monthAppointments = appointments.filter((a) => {
    const date = new Date(a.appointmentDate);
    return date.getMonth() + 1 === month && date.getFullYear() === year;
  });

  // Analisar cada dia do mês
  const daysInMonth = new Date(year, month, 0).getDate();
  const dayAnalyses: DayLoadAnalysis[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    dayAnalyses.push(analyzeDayLoad(date, monthAppointments, totalSlotsPerDay));
  }

  // Encontrar dias com pico e dias com baixa demanda
  const peakDays = dayAnalyses
    .filter((d) => d.loadLevel === "high" || d.loadLevel === "critical")
    .sort((a, b) => b.utilizationRate - a.utilizationRate)
    .slice(0, 5);

  const lowDays = dayAnalyses
    .filter((d) => d.loadLevel === "low")
    .sort((a, b) => a.utilizationRate - b.utilizationRate)
    .slice(0, 5);

  // Calcular taxa média de utilização
  const totalUtilization = dayAnalyses.reduce((sum, d) => sum + d.utilizationRate, 0);
  const averageUtilization = Math.round(totalUtilization / dayAnalyses.length);

  // Distribuição de cadeiras
  const chairUtilization: Record<string, number> = {};
  monthAppointments.forEach((a) => {
    chairUtilization[a.chair] = (chairUtilization[a.chair] || 0) + 1;
  });

  // Demanda por especialidade
  const specialtyDemand: Record<string, number> = {};
  monthAppointments.forEach((a) => {
    specialtyDemand[a.specialty] = (specialtyDemand[a.specialty] || 0) + 1;
  });

  // Gerar recomendações
  const recommendations: string[] = [];

  if (peakDays.length > 0) {
    recommendations.push(
      `⚠️ Dias de pico identificados: ${peakDays.map((d) => d.date).join(", ")}. Considere distribuir agendamentos para dias com menor demanda.`
    );
  }

  if (averageUtilization > 80) {
    recommendations.push(
      `📊 Taxa de utilização alta (${averageUtilization}%). Considere aumentar slots disponíveis ou adicionar profissionais.`
    );
  }

  if (averageUtilization < 50) {
    recommendations.push(
      `📉 Taxa de utilização baixa (${averageUtilization}%). Oportunidade para agendar mais pacientes.`
    );
  }

  // Análise de distribuição de cadeiras
  const chairUtilizationValues = Object.values(chairUtilization);
  const maxChairUtilization = Math.max(...chairUtilizationValues);
  const minChairUtilization = Math.min(...chairUtilizationValues);
  const chairImbalance = maxChairUtilization - minChairUtilization;

  if (chairImbalance > 5) {
    recommendations.push(
      `🪑 Distribuição desigual entre cadeiras. Considere rebalancear agendamentos para melhor utilização de recursos.`
    );
  }

  const monthName = new Date(year, month - 1).toLocaleDateString("pt-BR", { month: "long" });

  return {
    month: monthName,
    year,
    totalAppointments: monthAppointments.length,
    averageDailyAppointments: Math.round(monthAppointments.length / daysInMonth),
    peakDays,
    lowDays,
    utilizationRate: averageUtilization,
    chairUtilization,
    specialtyDemand,
    recommendations,
  };
}

/**
 * Identifica os melhores horários para agendamento
 */
export function findOptimalSchedulingTimes(
  appointments: Array<{
    id?: number;
    appointmentDate: string;
    appointmentTime: string;
    status: string;
  }>,
  minAvailableSlots: number = 2
): Array<{
  date: string;
  time: string;
  availableSlots: number;
  demandLevel: string;
}> {
  const optimalTimes: Array<{
    date: string;
    time: string;
    availableSlots: number;
    demandLevel: string;
  }> = [];

  // Agrupar por data e hora
  const timeSlots: Record<string, Record<string, number>> = {};

  appointments.forEach((a) => {
    if (!timeSlots[a.appointmentDate]) {
      timeSlots[a.appointmentDate] = {};
    }
    if (!timeSlots[a.appointmentDate][a.appointmentTime]) {
      timeSlots[a.appointmentDate][a.appointmentTime] = 0;
    }
    timeSlots[a.appointmentDate][a.appointmentTime]++;
  });

  // Encontrar slots com disponibilidade
  Object.entries(timeSlots).forEach(([date, times]) => {
    Object.entries(times).forEach(([time, count]) => {
      const availableSlots = 4 - count; // 4 slots por hora
      if (availableSlots >= minAvailableSlots) {
        const demandLevel = availableSlots >= 3 ? "low" : availableSlots >= 2 ? "medium" : "high";
        optimalTimes.push({
          date,
          time,
          availableSlots,
          demandLevel,
        });
      }
    });
  });

  // Ordenar por disponibilidade e demanda
  return optimalTimes.sort((a, b) => {
    if (a.demandLevel !== b.demandLevel) {
      const demandOrder = { low: 0, medium: 1, high: 2 };
      return demandOrder[a.demandLevel as keyof typeof demandOrder] - demandOrder[b.demandLevel as keyof typeof demandOrder];
    }
    return b.availableSlots - a.availableSlots;
  });
}

/**
 * Gera relatório de análise de agenda
 */
export function generateScheduleReport(
  month: number,
  year: number,
  appointments: Array<{
    appointmentDate: string;
    appointmentTime: string;
    status: string;
    chair: string;
    specialty: string;
  }>
): {
  monthAnalysis: MonthAnalysis;
  hourlyPatterns: HourlyPattern[];
  optimalTimes: Array<{
    date: string;
    time: string;
    availableSlots: number;
    demandLevel: string;
  }>;
} {
  const monthAnalysis = analyzeMonthlyDistribution(month, year, appointments);
  const hourlyPatterns = analyzeHourlyPatterns(appointments);
  const optimalTimes = findOptimalSchedulingTimes(appointments);

  return {
    monthAnalysis,
    hourlyPatterns,
    optimalTimes,
  };
}
