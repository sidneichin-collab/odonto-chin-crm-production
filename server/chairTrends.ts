// @ts-nocheck
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { appointments } from "../drizzle/schema";
import { getDb } from "./db";

interface DailyOccupancy {
  date: string;
  chair: string;
  totalAppointments: number;
  completedAppointments: number;
  totalMinutes: number;
  occupancyRate: number;
}

interface ChairTrendData {
  chair: string;
  data: Array<{
    date: string;
    occupancyRate: number;
    appointments: number;
  }>;
  averageOccupancy: number;
  trend: number; // Percentage change compared to previous period
}

interface PeriodComparison {
  current: {
    totalAppointments: number;
    averageOccupancy: number;
    totalRevenue: number;
  };
  previous: {
    totalAppointments: number;
    averageOccupancy: number;
    totalRevenue: number;
  };
  growth: {
    appointments: number; // Percentage
    occupancy: number; // Percentage
    revenue: number; // Percentage
  };
}

/**
 * Get daily occupancy data for all chairs within a date range
 */
export async function getDailyOccupancyData(
  startDate: Date,
  endDate: Date
): Promise<DailyOccupancy[]> {
  const db = await getDb();
  if (!db) return [];

  // Get all appointments in the date range
  const appointmentsList = await db
    .select({
      appointmentDate: appointments.appointmentDate,
      chair: appointments.chair,
      duration: appointments.duration,
      status: appointments.status,
    })
    .from(appointments)
    .where(
      and(
        gte(appointments.appointmentDate, startDate),
        lte(appointments.appointmentDate, endDate),
        sql`chair IS NOT NULL`
      )
    )
    .execute();

  // Group by date and chair
  const dataMap = new Map<string, DailyOccupancy>();

  for (const apt of appointmentsList) {
    const dateStr = apt.appointmentDate.toISOString().split('T')[0];
    const chair = apt.chair || "Unknown";
    const key = `${dateStr}-${chair}`;

    if (!dataMap.has(key)) {
      dataMap.set(key, {
        date: dateStr,
        chair,
        totalAppointments: 0,
        completedAppointments: 0,
        totalMinutes: 0,
        occupancyRate: 0,
      });
    }

    const dayData = dataMap.get(key)!;
    dayData.totalAppointments++;
    
    if (apt.status === 'completed') {
      dayData.completedAppointments++;
    }
    
    if (apt.status !== 'cancelled') {
      dayData.totalMinutes += apt.duration || 60;
    }
  }

  // Calculate occupancy rates (assuming 8-hour workday = 480 minutes)
  const AVAILABLE_MINUTES_PER_DAY = 480;
  
  const result: DailyOccupancy[] = [];
  for (const data of Array.from(dataMap.values())) {
    data.occupancyRate = Math.min(100, (data.totalMinutes / AVAILABLE_MINUTES_PER_DAY) * 100);
    result.push(data);
  }

  return result.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get trend data for each chair
 */
export async function getChairTrends(
  startDate: Date,
  endDate: Date
): Promise<ChairTrendData[]> {
  const dailyData = await getDailyOccupancyData(startDate, endDate);

  // Group by chair
  const chairMap = new Map<string, DailyOccupancy[]>();
  for (const data of dailyData) {
    if (!chairMap.has(data.chair)) {
      chairMap.set(data.chair, []);
    }
    chairMap.get(data.chair)!.push(data);
  }

  // Calculate trends
  const trends: ChairTrendData[] = [];
  
  for (const [chair, data] of Array.from(chairMap.entries())) {
    const sortedData = data.sort((a: DailyOccupancy, b: DailyOccupancy) => a.date.localeCompare(b.date));
    
    // Calculate average occupancy
    const avgOccupancy = sortedData.reduce((sum: number, d: DailyOccupancy) => sum + d.occupancyRate, 0) / sortedData.length;

    // Calculate trend (compare first half vs second half)
    const midPoint = Math.floor(sortedData.length / 2);
    const firstHalf = sortedData.slice(0, midPoint);
    const secondHalf = sortedData.slice(midPoint);

    const firstHalfAvg = firstHalf.reduce((sum: number, d: DailyOccupancy) => sum + d.occupancyRate, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum: number, d: DailyOccupancy) => sum + d.occupancyRate, 0) / secondHalf.length;

    const trend = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;

    trends.push({
      chair,
      data: sortedData.map((d: DailyOccupancy) => ({
        date: d.date,
        occupancyRate: Math.round(d.occupancyRate * 10) / 10,
        appointments: d.totalAppointments,
      })),
      averageOccupancy: Math.round(avgOccupancy * 10) / 10,
      trend: Math.round(trend * 10) / 10,
    });
  }

  return trends.sort((a, b) => b.averageOccupancy - a.averageOccupancy);
}

/**
 * Compare current period with previous period
 */
export async function comparePeriods(
  currentStart: Date,
  currentEnd: Date
): Promise<PeriodComparison> {
  const db = await getDb();
  if (!db) {
    return {
      current: { totalAppointments: 0, averageOccupancy: 0, totalRevenue: 0 },
      previous: { totalAppointments: 0, averageOccupancy: 0, totalRevenue: 0 },
      growth: { appointments: 0, occupancy: 0, revenue: 0 },
    };
  }

  // Calculate period length
  const periodLength = currentEnd.getTime() - currentStart.getTime();
  const previousStart = new Date(currentStart.getTime() - periodLength);
  const previousEnd = new Date(currentStart.getTime());

  // Get current period data
  const currentData = await getDailyOccupancyData(currentStart, currentEnd);
  const currentAppointments = currentData.reduce((sum: number, d: DailyOccupancy) => sum + d.totalAppointments, 0);
  const currentOccupancy = currentData.length > 0
    ? currentData.reduce((sum: number, d: DailyOccupancy) => sum + d.occupancyRate, 0) / currentData.length
    : 0;
  const currentRevenue = currentData.reduce((sum: number, d: DailyOccupancy) => sum + (d.completedAppointments * 150), 0);

  // Get previous period data
  const previousData = await getDailyOccupancyData(previousStart, previousEnd);
  const previousAppointments = previousData.reduce((sum: number, d: DailyOccupancy) => sum + d.totalAppointments, 0);
  const previousOccupancy = previousData.length > 0
    ? previousData.reduce((sum: number, d: DailyOccupancy) => sum + d.occupancyRate, 0) / previousData.length
    : 0;
  const previousRevenue = previousData.reduce((sum: number, d: DailyOccupancy) => sum + (d.completedAppointments * 150), 0);

  // Calculate growth percentages
  const appointmentsGrowth = previousAppointments > 0
    ? ((currentAppointments - previousAppointments) / previousAppointments) * 100
    : 0;
  
  const occupancyGrowth = previousOccupancy > 0
    ? ((currentOccupancy - previousOccupancy) / previousOccupancy) * 100
    : 0;
  
  const revenueGrowth = previousRevenue > 0
    ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
    : 0;

  return {
    current: {
      totalAppointments: currentAppointments,
      averageOccupancy: Math.round(currentOccupancy * 10) / 10,
      totalRevenue: currentRevenue,
    },
    previous: {
      totalAppointments: previousAppointments,
      averageOccupancy: Math.round(previousOccupancy * 10) / 10,
      totalRevenue: previousRevenue,
    },
    growth: {
      appointments: Math.round(appointmentsGrowth * 10) / 10,
      occupancy: Math.round(occupancyGrowth * 10) / 10,
      revenue: Math.round(revenueGrowth * 10) / 10,
    },
  };
}

/**
 * Get aggregated data by day of week
 */
export async function getOccupancyByDayOfWeek(
  startDate: Date,
  endDate: Date
): Promise<Array<{ dayOfWeek: number; dayName: string; averageOccupancy: number; totalAppointments: number }>> {
  const dailyData = await getDailyOccupancyData(startDate, endDate);

  // Group by day of week (0 = Sunday, 6 = Saturday)
  const dayMap = new Map<number, { occupancy: number[]; appointments: number }>();

  for (const data of dailyData) {
    const date = new Date(data.date);
    const dayOfWeek = date.getDay();

    if (!dayMap.has(dayOfWeek)) {
      dayMap.set(dayOfWeek, { occupancy: [], appointments: 0 });
    }

    const dayData = dayMap.get(dayOfWeek)!;
    dayData.occupancy.push(data.occupancyRate);
    dayData.appointments += data.totalAppointments;
  }

  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  const result = [];
  for (let i = 0; i < 7; i++) {
    const dayData = dayMap.get(i);
    if (dayData) {
      const avgOccupancy = dayData.occupancy.reduce((sum: number, o: number) => sum + o, 0) / dayData.occupancy.length;
      result.push({
        dayOfWeek: i,
        dayName: dayNames[i],
        averageOccupancy: Math.round(avgOccupancy * 10) / 10,
        totalAppointments: dayData.appointments,
      });
    } else {
      result.push({
        dayOfWeek: i,
        dayName: dayNames[i],
        averageOccupancy: 0,
        totalAppointments: 0,
      });
    }
  }

  return result;
}
