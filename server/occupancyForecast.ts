// @ts-nocheck - Type issues to be fixed
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { appointments } from "../drizzle/schema";
import { getDb } from "./db";

interface HourlyPattern {
  hour: number;
  dayOfWeek: number;
  averageOccupancy: number;
  appointmentCount: number;
}

interface ChairAvailability {
  chair: string;
  date: string;
  hour: number;
  predictedOccupancy: number;
  isRecommended: boolean;
  confidence: number; // 0-100
}

interface TimeSlotRecommendation {
  date: string;
  hour: number;
  chair: string;
  score: number; // 0-100, higher is better
  reason: string;
  predictedOccupancy: number;
}

/**
 * Analyze historical patterns by hour and day of week
 */
export async function analyzeHourlyPatterns(
  daysBack: number = 90
): Promise<HourlyPattern[]> {
  const db = await getDb();
  if (!db) return [];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  // Get all appointments in the period
  const appointmentsList = await db
    .select({
      appointmentDate: appointments.appointmentDate,
      duration: appointments.duration,
      status: appointments.status,
      chair: appointments.chair,
    })
    .from(appointments)
    .where(
      and(
        gte(appointments.appointmentDate, startDate),
        sql`chair IS NOT NULL`,
        sql`status != 'cancelled'`
      )
    )
    .execute();

  // Group by hour and day of week
  const patternMap = new Map<string, { totalMinutes: number; count: number; days: Set<string> }>();

  for (const apt of appointmentsList) {
    const date = new Date(apt.appointmentDate);
    const hour = date.getHours();
    const dayOfWeek = date.getDay();
    const dateStr = date.toISOString().split('T')[0];
    const key = `${dayOfWeek}-${hour}`;

    if (!patternMap.has(key)) {
      patternMap.set(key, { totalMinutes: 0, count: 0, days: new Set() });
    }

    const pattern = patternMap.get(key)!;
    pattern.totalMinutes += apt.duration || 60;
    pattern.count++;
    pattern.days.add(dateStr);
  }

  // Calculate average occupancy per hour/day combination
  const AVAILABLE_MINUTES_PER_HOUR = 60;
  const patterns: HourlyPattern[] = [];

  for (const [key, data] of Array.from(patternMap.entries())) {
    const [dayOfWeek, hour] = key.split('-').map(Number);
    const uniqueDays = data.days.size;
    const avgMinutesPerDay = data.totalMinutes / uniqueDays;
    const avgOccupancy = Math.min(100, (avgMinutesPerDay / AVAILABLE_MINUTES_PER_HOUR) * 100);

    patterns.push({
      hour,
      dayOfWeek,
      averageOccupancy: Math.round(avgOccupancy * 10) / 10,
      appointmentCount: data.count,
    });
  }

  return patterns.sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
    return a.hour - b.hour;
  });
}

/**
 * Predict occupancy for future dates
 */
export async function predictOccupancy(
  targetDate: Date,
  chair?: string
): Promise<ChairAvailability[]> {
  const patterns = await analyzeHourlyPatterns();
  const db = await getDb();
  if (!db) return [];

  const dayOfWeek = targetDate.getDay();
  const dateStr = targetDate.toISOString().split('T')[0];

  // Get existing appointments for the target date
  const existingAppointments = await db
    .select({
      appointmentDate: appointments.appointmentDate,
      chair: appointments.chair,
      duration: appointments.duration,
    })
    .from(appointments)
    .where(
      and(
        gte(appointments.appointmentDate, targetDate),
        lte(appointments.appointmentDate, new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)),
        sql`status != 'cancelled'`,
        chair ? eq(appointments.chair, chair) : sql`chair IS NOT NULL`
      )
    )
    .execute();

  // Get list of chairs
  const chairsResult = await db
    .select({ chair: appointments.chair })
    .from(appointments)
    .where(sql`chair IS NOT NULL`)
    .groupBy(appointments.chair)
    .execute();

  const chairs = chairsResult.map(r => r.chair!).filter(Boolean);

  // Generate predictions for each hour (8 AM to 6 PM)
  const predictions: ChairAvailability[] = [];
  const workingHours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

  for (const chairName of chairs) {
    if (chair && chairName !== chair) continue;

    for (const hour of workingHours) {
      // Find historical pattern for this hour/day combination
      const pattern = patterns.find(p => p.hour === hour && p.dayOfWeek === dayOfWeek);
      const baseOccupancy = pattern ? pattern.averageOccupancy : 50; // Default to 50% if no data

      // Check existing appointments for this hour
      const hourStart = new Date(targetDate);
      hourStart.setHours(hour, 0, 0, 0);
      const hourEnd = new Date(hourStart);
      hourEnd.setHours(hour + 1, 0, 0, 0);

      const existingInHour = existingAppointments.filter(apt => {
        const aptDate = new Date(apt.appointmentDate);
        return apt.chair === chairName && 
               aptDate >= hourStart && 
               aptDate < hourEnd;
      });

      const existingMinutes = existingInHour.reduce((sum, apt) => sum + (apt.duration || 60), 0);
      const currentOccupancy = Math.min(100, (existingMinutes / 60) * 100);

      // Combine historical pattern with current bookings
      const predictedOccupancy = Math.max(baseOccupancy, currentOccupancy);
      
      // Calculate confidence based on historical data availability
      const confidence = pattern && pattern.appointmentCount > 5 ? 
        Math.min(100, pattern.appointmentCount * 10) : 30;

      // Recommend slots with low predicted occupancy
      const isRecommended = predictedOccupancy < 60 && confidence > 50;

      predictions.push({
        chair: chairName,
        date: dateStr,
        hour,
        predictedOccupancy: Math.round(predictedOccupancy * 10) / 10,
        isRecommended,
        confidence,
      });
    }
  }

  return predictions.sort((a, b) => {
    if (a.chair !== b.chair) return a.chair.localeCompare(b.chair);
    return a.hour - b.hour;
  });
}

/**
 * Get best time slot recommendations for a given date range
 */
export async function getBestTimeSlots(
  startDate: Date,
  endDate: Date,
  appointmentType?: string,
  preferredChair?: string
): Promise<TimeSlotRecommendation[]> {
  const recommendations: TimeSlotRecommendation[] = [];
  const patterns = await analyzeHourlyPatterns();

  // Iterate through each day in the range
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const predictions = await predictOccupancy(currentDate, preferredChair);

    for (const pred of predictions) {
      // Skip if already highly occupied
      if (pred.predictedOccupancy > 70) continue;

      // Calculate score (0-100, higher is better)
      // Factors: low occupancy (40%), high confidence (30%), optimal time (30%)
      const occupancyScore = (100 - pred.predictedOccupancy) * 0.4;
      const confidenceScore = pred.confidence * 0.3;
      
      // Optimal times: 9-11 AM and 2-4 PM get bonus
      const isOptimalTime = (pred.hour >= 9 && pred.hour <= 11) || (pred.hour >= 14 && pred.hour <= 16);
      const timeScore = isOptimalTime ? 30 : 15;

      const totalScore = occupancyScore + confidenceScore + timeScore;

      // Generate reason
      let reason = "";
      if (pred.predictedOccupancy < 30) {
        reason = "Horario con baja ocupación histórica";
      } else if (pred.predictedOccupancy < 50) {
        reason = "Disponibilidad moderada";
      } else {
        reason = "Disponibilidad limitada";
      }

      if (isOptimalTime) {
        reason += " - Horario preferido";
      }

      recommendations.push({
        date: pred.date,
        hour: pred.hour,
        chair: pred.chair,
        score: Math.round(totalScore),
        reason,
        predictedOccupancy: pred.predictedOccupancy,
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Sort by score (highest first) and return top 20
  return recommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
}

/**
 * Optimize load distribution across chairs
 */
export async function optimizeChairDistribution(
  targetDate: Date
): Promise<Array<{ chair: string; recommendedSlots: number; currentLoad: number; optimalLoad: number }>> {
  const predictions = await predictOccupancy(targetDate);
  
  // Group by chair
  const chairMap = new Map<string, { slots: ChairAvailability[]; totalOccupancy: number }>();

  for (const pred of predictions) {
    if (!chairMap.has(pred.chair)) {
      chairMap.set(pred.chair, { slots: [], totalOccupancy: 0 });
    }
    const chairData = chairMap.get(pred.chair)!;
    chairData.slots.push(pred);
    chairData.totalOccupancy += pred.predictedOccupancy;
  }

  // Calculate optimal distribution
  const result = [];
  const totalChairs = chairMap.size;
  const avgOccupancy = Array.from(chairMap.values())
    .reduce((sum, data) => sum + data.totalOccupancy, 0) / totalChairs;

  for (const [chair, data] of Array.from(chairMap.entries())) {
    const avgChairOccupancy = data.totalOccupancy / data.slots.length;
    const currentLoad = Math.round(avgChairOccupancy);
    const optimalLoad = Math.round(avgOccupancy);
    
    // Recommend more slots if below optimal, fewer if above
    const recommendedSlots = currentLoad < optimalLoad ? 
      data.slots.filter(s => s.predictedOccupancy < 60).length :
      data.slots.filter(s => s.predictedOccupancy < 40).length;

    result.push({
      chair,
      recommendedSlots,
      currentLoad,
      optimalLoad,
    });
  }

  return result.sort((a, b) => a.currentLoad - b.currentLoad);
}
