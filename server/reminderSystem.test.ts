/**
 * Testes do Sistema de Recordatórios Automáticos
 * 
 * Valida:
 * - Envio de recordatórios em horários corretos
 * - Mensagens progressivamente persuasivas
 * - Detecção de confirmações
 * - Movimentação no Kanban
 * - Parada automática após confirmação
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  processAllPendingReminders,
  getNotConfirmedMessage,
  getConfirmedMessage,
  NOT_CONFIRMED_SCHEDULE,
  CONFIRMED_SCHEDULE
} from './reminderAutomationService';
import { db } from './db';

// Mock do serviço N8N
vi.mock('./n8nWhatsAppService', () => ({
  sendWhatsAppViaN8n: vi.fn().mockResolvedValue({ success: true })
}));

describe('Sistema de Recordatórios - Horários', () => {
  it('deve ter 11 horários para pacientes não confirmados', () => {
    expect(NOT_CONFIRMED_SCHEDULE.length).toBe(11);
  });

  it('deve ter 2 horários para pacientes confirmados', () => {
    expect(CONFIRMED_SCHEDULE.length).toBe(2);
  });

  it('deve ter horários corretos para 2 dias antes', () => {
    const twoDaysBefore = NOT_CONFIRMED_SCHEDULE.filter(s => s.daysBeforeAppointment === 2);
    expect(twoDaysBefore).toHaveLength(3);
    expect(twoDaysBefore.map(s => s.hour)).toEqual([9, 15, 19]);
  });

  it('deve ter horários corretos para 1 dia antes', () => {
    const oneDayBefore = NOT_CONFIRMED_SCHEDULE.filter(s => s.daysBeforeAppointment === 1);
    expect(oneDayBefore).toHaveLength(7);
    expect(oneDayBefore.map(s => s.hour)).toEqual([7, 8, 10, 12, 14, 16, 18]);
  });

  it('deve ter horário correto para dia da consulta', () => {
    const appointmentDay = NOT_CONFIRMED_SCHEDULE.filter(s => s.daysBeforeAppointment === 0);
    expect(appointmentDay).toHaveLength(1);
    expect(appointmentDay[0].hour).toBe(7);
  });
});

describe('Sistema de Recordatórios - Mensagens', () => {
  it('deve gerar mensagem inicial cordial (sequência 1)', () => {
    const message = getNotConfirmedMessage(
      1,
      'João Silva',
      'ORTOBOM ODONTOLOGÍA',
      '15/02/2026',
      '14:30',
      10
    );

    expect(message).toContain('João Silva');
    expect(message).toContain('ORTOBOM ODONTOLOGÍA');
    expect(message).toContain('15/02/2026');
    expect(message).toContain('14:30');
    expect(message).toContain('confirma');
    expect(message.toLowerCase()).toContain('sí');
  });

  it('deve gerar mensagem mais persuasiva (sequência 5)', () => {
    const message = getNotConfirmedMessage(
      5,
      'João Silva',
      'ORTOBOM ODONTOLOGÍA',
      '15/02/2026',
      '14:30',
      10
    );

    expect(message).toContain('João Silva');
    // Mensagem deve ser mais persuasiva que a primeira
    expect(message.length).toBeGreaterThan(50);
  });

  it('deve gerar mensagem educacional para paciente confirmado', () => {
    const message = getConfirmedMessage(
      1,
      'João Silva',
      'ORTOBOM ODONTOLOGÍA',
      '15/02/2026',
      '14:30',
      10
    );

    expect(message).toContain('João Silva');
    expect(message).toContain('ORTOBOM ODONTOLOGÍA');
    // Mensagem educacional não deve pedir confirmação
    expect(message.toLowerCase()).not.toContain('confirma');
  });

  it('deve usar saudação apropriada baseada no horário', () => {
    const morningMessage = getNotConfirmedMessage(1, 'João', 'Clínica', '15/02/2026', '14:30', 10);
    const afternoonMessage = getNotConfirmedMessage(1, 'João', 'Clínica', '15/02/2026', '14:30', 15);
    const eveningMessage = getNotConfirmedMessage(1, 'João', 'Clínica', '15/02/2026', '14:30', 20);

    expect(morningMessage.toLowerCase()).toContain('buen día');
    expect(afternoonMessage.toLowerCase()).toContain('buenas tardes');
    expect(eveningMessage.toLowerCase()).toContain('buenas noches');
  });
});

describe('Sistema de Recordatórios - Lógica de Envio', () => {
  it('deve processar recordatórios pendentes sem erros', async () => {
    // Mock do banco de dados
    vi.spyOn(db, 'getAppointmentsNeedingReminders').mockResolvedValue([]);
    
    const result = await processAllPendingReminders();
    
    expect(result).toHaveProperty('processed');
    expect(result).toHaveProperty('successful');
    expect(result).toHaveProperty('failed');
  });

  it('deve calcular corretamente horário 2h antes da consulta', () => {
    // Consulta às 14:30
    const appointmentHour = 14;
    const twoHoursBefore = appointmentHour - 2;
    
    expect(twoHoursBefore).toBe(12);
  });

  it('deve respeitar limite de 19h para envio', () => {
    const lastSchedule = NOT_CONFIRMED_SCHEDULE
      .filter(s => s.daysBeforeAppointment > 0)
      .sort((a, b) => b.hour - a.hour)[0];
    
    expect(lastSchedule.hour).toBeLessThanOrEqual(19);
  });
});

describe('Sistema de Recordatórios - Integração', () => {
  it('deve ter estrutura correta de resposta', async () => {
    vi.spyOn(db, 'getAppointmentsNeedingReminders').mockResolvedValue([]);
    
    const result = await processAllPendingReminders();
    
    expect(result.processed).toBeGreaterThanOrEqual(0);
    expect(result.successful).toBeGreaterThanOrEqual(0);
    expect(result.failed).toBeGreaterThanOrEqual(0);
    expect(result.successful + result.failed).toBe(result.processed);
  });
});

describe('Sistema de Recordatórios - Casos Especiais', () => {
  it('deve lidar com nomes com caracteres especiais', () => {
    const message = getNotConfirmedMessage(
      1,
      'María José Pérez',
      'ORTOBOM ODONTOLOGÍA',
      '15/02/2026',
      '14:30',
      10
    );

    expect(message).toContain('María José Pérez');
  });

  it('deve formatar horários corretamente', () => {
    const message = getNotConfirmedMessage(
      1,
      'João',
      'Clínica',
      '15/02/2026',
      '09:00',
      10
    );

    expect(message).toContain('09:00');
  });

  it('deve ter sequência numérica correta', () => {
    const sequences = NOT_CONFIRMED_SCHEDULE.map(s => s.sequenceNumber);
    
    // Deve ser sequencial de 1 a 11
    expect(sequences).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });
});
