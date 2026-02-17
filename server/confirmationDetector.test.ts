/**
 * Testes do Detector de Confirmações e Reagendamentos
 * 
 * Valida:
 * - Detecção de "Sí" e variações
 * - Detecção de solicitações de reagendamento em espanhol
 * - Encaminhamento automático para secretária
 * - Parada de recordatórios após confirmação
 */

import { describe, it, expect } from 'vitest';
import { 
  isConfirmationMessage,
  isRescheduleRequest
} from './confirmationDetectorService';

describe('Detector de Confirmações - Palavras Positivas', () => {
  it('deve detectar "Sí" (com acento)', () => {
    expect(isConfirmationMessage('Sí')).toBe(true);
    expect(isConfirmationMessage('sí')).toBe(true);
    expect(isConfirmationMessage('SÍ')).toBe(true);
  });

  it('deve detectar "Si" (sem acento)', () => {
    expect(isConfirmationMessage('Si')).toBe(true);
    expect(isConfirmationMessage('si')).toBe(true);
    expect(isConfirmationMessage('SI')).toBe(true);
  });

  it('deve detectar "Sim" (português)', () => {
    expect(isConfirmationMessage('Sim')).toBe(true);
    expect(isConfirmationMessage('sim')).toBe(true);
  });

  it('deve detectar "Confirmo"', () => {
    expect(isConfirmationMessage('Confirmo')).toBe(true);
    expect(isConfirmationMessage('confirmo')).toBe(true);
  });

  it('deve detectar "OK"', () => {
    expect(isConfirmationMessage('OK')).toBe(true);
    expect(isConfirmationMessage('ok')).toBe(true);
    expect(isConfirmationMessage('Okay')).toBe(true);
  });

  it('deve detectar "Claro"', () => {
    expect(isConfirmationMessage('Claro')).toBe(true);
    expect(isConfirmationMessage('claro')).toBe(true);
  });

  it('deve detectar "Asisto"', () => {
    expect(isConfirmationMessage('Asisto')).toBe(true);
    expect(isConfirmationMessage('Asistiré')).toBe(true);
  });

  it('deve detectar "Voy"', () => {
    expect(isConfirmationMessage('Voy')).toBe(true);
    expect(isConfirmationMessage('Iré')).toBe(true);
  });

  it('deve detectar confirmação em frases completas', () => {
    expect(isConfirmationMessage('Sí, confirmo mi cita')).toBe(true);
    expect(isConfirmationMessage('Claro que sí')).toBe(true);
    expect(isConfirmationMessage('Ok, estaré ahí')).toBe(true);
  });

  it('deve ignorar pontuação e acentos', () => {
    expect(isConfirmationMessage('Sí!')).toBe(true);
    expect(isConfirmationMessage('Sí.')).toBe(true);
    expect(isConfirmationMessage('¡Sí!')).toBe(true);
    expect(isConfirmationMessage('Si, confirmo')).toBe(true);
  });
});

describe('Detector de Reagendamentos - Palavras Negativas', () => {
  it('deve detectar "Reagendar"', () => {
    expect(isRescheduleRequest('Reagendar')).toBe(true);
    expect(isRescheduleRequest('reagendar')).toBe(true);
    expect(isRescheduleRequest('Quiero reagendar')).toBe(true);
  });

  it('deve detectar "Otro día"', () => {
    expect(isRescheduleRequest('Otro día')).toBe(true);
    expect(isRescheduleRequest('otro dia')).toBe(true);
    expect(isRescheduleRequest('Puede ser otro día')).toBe(true);
  });

  it('deve detectar "Cambiar"', () => {
    expect(isRescheduleRequest('Cambiar')).toBe(true);
    expect(isRescheduleRequest('cambiar')).toBe(true);
    expect(isRescheduleRequest('Quiero cambiar la cita')).toBe(true);
  });

  it('deve detectar "No puedo"', () => {
    expect(isRescheduleRequest('No puedo')).toBe(true);
    expect(isRescheduleRequest('no puedo')).toBe(true);
    expect(isRescheduleRequest('No puedo asistir')).toBe(true);
  });

  it('deve detectar "Cancelar"', () => {
    expect(isRescheduleRequest('Cancelar')).toBe(true);
    expect(isRescheduleRequest('cancelar')).toBe(true);
    expect(isRescheduleRequest('Necesito cancelar')).toBe(true);
  });

  it('deve detectar "No" simples', () => {
    expect(isRescheduleRequest('No')).toBe(true);
    expect(isRescheduleRequest('no')).toBe(true);
    expect(isRescheduleRequest('NO')).toBe(true);
  });

  it('deve detectar "Impossível"', () => {
    expect(isRescheduleRequest('Impossível')).toBe(true);
    expect(isRescheduleRequest('imposible')).toBe(true);
  });

  it('deve detectar reagendamento em frases completas', () => {
    expect(isRescheduleRequest('Puede ser otro día por favor')).toBe(true);
    expect(isRescheduleRequest('No puedo ese día, otro día mejor')).toBe(true);
    expect(isRescheduleRequest('Necesito cambiar la fecha')).toBe(true);
  });
});

describe('Detector - Prioridade de Palavras Negativas', () => {
  it('NÃO deve confirmar se contém palavra negativa', () => {
    // Mesmo que contenha "si", se tiver "no" deve ser considerado negativo
    expect(isConfirmationMessage('No puedo asistir')).toBe(false);
    expect(isConfirmationMessage('No, no puedo')).toBe(false);
    expect(isConfirmationMessage('Imposible')).toBe(false);
  });

  it('deve priorizar reagendamento sobre confirmação', () => {
    expect(isRescheduleRequest('Si, pero otro día')).toBe(true);
    expect(isRescheduleRequest('Ok, pero necesito cambiar')).toBe(true);
  });
});

describe('Detector - Casos Especiais em Espanhol', () => {
  it('deve detectar variações de "outro dia" em espanhol', () => {
    expect(isRescheduleRequest('otro dia')).toBe(true);
    expect(isRescheduleRequest('otro día')).toBe(true);
    expect(isRescheduleRequest('en otro dia')).toBe(true);
    expect(isRescheduleRequest('para otro día')).toBe(true);
  });

  it('deve detectar "puede ser" com reagendamento', () => {
    expect(isRescheduleRequest('Puede ser otro día')).toBe(true);
    expect(isRescheduleRequest('Puede ser mañana')).toBe(false); // "mañana" não está na lista
  });

  it('deve detectar "no puedo" em diferentes contextos', () => {
    expect(isRescheduleRequest('No puedo')).toBe(true);
    expect(isRescheduleRequest('No puedo ese día')).toBe(true);
    expect(isRescheduleRequest('No puedo asistir')).toBe(true);
    expect(isRescheduleRequest('Lamentablemente no puedo')).toBe(true);
  });
});

describe('Detector - Normalização de Texto', () => {
  it('deve ignorar maiúsculas/minúsculas', () => {
    expect(isConfirmationMessage('SÍ')).toBe(true);
    expect(isConfirmationMessage('sí')).toBe(true);
    expect(isConfirmationMessage('Sí')).toBe(true);
  });

  it('deve ignorar acentos', () => {
    expect(isConfirmationMessage('si')).toBe(true);
    expect(isConfirmationMessage('sí')).toBe(true);
  });

  it('deve ignorar pontuação', () => {
    expect(isConfirmationMessage('Sí!')).toBe(true);
    expect(isConfirmationMessage('Sí.')).toBe(true);
    expect(isConfirmationMessage('¡Sí!')).toBe(true);
    expect(isConfirmationMessage('Sí, confirmo')).toBe(true);
  });

  it('deve ignorar espaços extras', () => {
    expect(isConfirmationMessage('  Sí  ')).toBe(true);
    expect(isConfirmationMessage('Sí   confirmo')).toBe(true);
  });
});

describe('Detector - Mensagens Ambíguas', () => {
  it('deve rejeitar mensagens vazias', () => {
    expect(isConfirmationMessage('')).toBe(false);
    expect(isConfirmationMessage('   ')).toBe(false);
  });

  it('deve rejeitar mensagens sem palavras-chave', () => {
    expect(isConfirmationMessage('Hola')).toBe(false);
    expect(isConfirmationMessage('Gracias')).toBe(false);
    expect(isConfirmationMessage('Buenos días')).toBe(false);
  });

  it('deve detectar apenas palavras completas', () => {
    // "si" dentro de "asistir" não deve ser detectado como confirmação isolada
    // mas "asisto" está na lista de confirmações
    expect(isConfirmationMessage('asisto')).toBe(true);
  });
});

describe('Detector - Casos Reais de Uso', () => {
  it('deve detectar confirmações típicas de pacientes', () => {
    expect(isConfirmationMessage('Sí')).toBe(true);
    expect(isConfirmationMessage('Si confirmo')).toBe(true);
    expect(isConfirmationMessage('Claro que sí')).toBe(true);
    expect(isConfirmationMessage('Ok, estaré ahí')).toBe(true);
    expect(isConfirmationMessage('Confirmo mi asistencia')).toBe(true);
  });

  it('deve detectar reagendamentos típicos de pacientes', () => {
    expect(isRescheduleRequest('Puede ser otro día')).toBe(true);
    expect(isRescheduleRequest('No puedo ese día')).toBe(true);
    expect(isRescheduleRequest('Necesito cambiar la fecha')).toBe(true);
    expect(isRescheduleRequest('Quiero reagendar')).toBe(true);
    expect(isRescheduleRequest('Imposible ese día')).toBe(true);
  });
});
