/**
 * Scheduler de Recordatórios Automáticos
 * 
 * Executa a cada hora e processa:
 * - Envio de recordatórios para pacientes não confirmados
 * - Envio de mensagens educacionais para pacientes confirmados
 * - Detecção de confirmações em mensagens recebidas
 * - Movimentação automática no Kanban
 */

import { processAllPendingReminders } from './reminderAutomationService';
import { processAllIncomingMessages } from './confirmationDetectorService';

let isRunning = false;
let schedulerInterval: NodeJS.Timeout | null = null;

/**
 * Executa o processamento de recordatórios
 */
async function runReminderProcessing() {
  if (isRunning) {
    console.log('[ReminderScheduler] Processamento já em andamento, pulando...');
    return;
  }

  isRunning = true;
  
  try {
    const now = new Date();
    const currentHour = now.getHours();
    
    console.log(`[ReminderScheduler] Iniciando processamento às ${currentHour}:00`);
    
    // 1. Processar mensagens recebidas (detectar confirmações)
    console.log('[ReminderScheduler] Processando mensagens recebidas...');
    const confirmationResults = await processAllIncomingMessages();
    console.log(`[ReminderScheduler] Confirmações detectadas: ${confirmationResults.confirmationsDetected}`);
    
    // 2. Processar recordatórios pendentes
    console.log('[ReminderScheduler] Processando recordatórios pendentes...');
    const reminderResults = await processAllPendingReminders();
    console.log(`[ReminderScheduler] Recordatórios enviados: ${reminderResults.successful}/${reminderResults.processed}`);
    
    console.log('[ReminderScheduler] Processamento concluído com sucesso');
  } catch (error) {
    console.error('[ReminderScheduler] Erro durante processamento:', error);
  } finally {
    isRunning = false;
  }
}

/**
 * Inicia o scheduler
 * Executa a cada hora no minuto 0
 */
export function startReminderScheduler() {
  if (schedulerInterval) {
    console.log('[ReminderScheduler] Scheduler já está rodando');
    return;
  }

  console.log('[ReminderScheduler] Iniciando scheduler de recordatórios');
  
  // Executar imediatamente na primeira vez
  runReminderProcessing();
  
  // Executar a cada hora
  schedulerInterval = setInterval(() => {
    runReminderProcessing();
  }, 60 * 60 * 1000); // 1 hora em milissegundos
  
  console.log('[ReminderScheduler] Scheduler iniciado - executando a cada hora');
}

/**
 * Para o scheduler
 */
export function stopReminderScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[ReminderScheduler] Scheduler parado');
  }
}

/**
 * Executa processamento manual (para testes)
 */
export async function runManualProcessing() {
  console.log('[ReminderScheduler] Executando processamento manual...');
  await runReminderProcessing();
}
