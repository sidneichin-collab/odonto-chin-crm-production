# Odonto Chin CRM - Lista de Tareas

## 🎯 Arquitectura Multi-Tenant
- [x] Configurar schema de base de datos con aislamiento por tenant
- [x] Implementar tabla de clínicas (tenants) con configuración individual
- [x] Crear middleware de tenant para aislar datos por clínica
- [x] Configurar relaciones de base de datos con tenantId

## 🔐 Autenticación y Roles
- [x] Implementar sistema de autenticación JWT
- [x] Crear roles (super-admin, admin, user)
- [x] Configurar control de acceso basado en roles (RBAC)
- [x] Implementar asignación de usuarios a clínicas específicas
- [x] Crear procedimiento de registro solo para super-admin

## 📊 Dashboard en Tiempo Real
- [x] Diseñar interfaz de dashboard con tema oscuro
- [x] Implementar estadística: Total de pacientes
- [x] Implementar estadística: Citas de hoy
- [x] Implementar estadística: Lista de espera
- [x] Implementar estadística: Pacientes en riesgo
- [ ] Agregar gráficos y visualizaciones
- [x] Configurar actualización automática de datos

## 👥 Gestión de Pacientes
- [x] Crear formulario de registro de pacientes completo
- [x] Implementar campos de historia médica
- [x] Crear sistema de búsqueda de pacientes
- [x] Implementar filtros avanzados (por estado, fecha, etc.)
- [x] Agregar vista de detalles del paciente
- [x] Implementar edición de información del paciente
- [ ] Crear sistema de archivos/documentos por paciente

## 📅 Sistema Kanban de Agendamientos
- [x] Crear board Kanban para Ortodontia
- [x] Crear board Kanban para Clínico Geral
- [x] Implementar columnas de estado (Pendiente, Confirmado, En Tratamiento, Completado)
- [x] Agregar funcionalidad drag-and-drop entre columnas
- [x] Crear formulario de nueva cita
- [x] Implementar edición de citas existentes
- [ ] Agregar filtros por fecha y dentista
- [x] Mostrar información del paciente en cada tarjeta

## 💬 Integración WhatsApp (Evolution API)
- [x] Configurar conexión con Evolution API (http://95.111.240.243:8080)
- [x] Implementar envío de recordatorios automáticos
- [x] Crear plantillas de mensajes en español
- [x] Configurar sistema anti-bloqueo (pulse control)
- [x] Implementar log de mensajes enviados
- [x] Crear interfaz para ver estado de mensajes

## 🤖 Automaciones N8N
- [ ] Configurar webhook de N8N
- [ ] Implementar recordatorios programados
- [ ] Crear flujo de confirmación de citas
- [ ] Configurar alertas para citas del día siguiente
- [ ] Implementar recordatorios para pacientes en riesgo

## 📋 Lista de Espera
- [x] Crear módulo de lista de espera
- [x] Implementar formulario de agregar paciente a lista
- [x] Crear vista de pacientes en espera
- [x] Agregar priorización de pacientes
- [ ] Implementar notificaciones cuando hay disponibilidad

## ⚠️ Alertas de Pacientes en Riesgo
- [x] Crear sistema de detección de pacientes en riesgo
- [x] Implementar indicadores visuales en dashboard
- [x] Agregar lista de pacientes en riesgo
- [x] Crear alertas automáticas para secretaria
- [ ] Implementar seguimiento de pacientes en riesgo

## 🎨 Interfaz de Usuario
- [x] Configurar tema oscuro profesional
- [x] Crear layout con sidebar de navegación
- [x] Traducir toda la interfaz al español
- [x] Implementar navegación entre módulos
- [x] Agregar breadcrumbs y navegación contextual
- [x] Crear componentes reutilizables (botones, formularios, tablas)
- [x] Implementar estados de carga y errores
- [x] Agregar animaciones y transiciones suaves

## 🔧 Procedimientos tRPC
- [x] Crear procedimientos para gestión de clínicas
- [x] Crear procedimientos para gestión de pacientes
- [x] Crear procedimientos para agendamientos
- [x] Crear procedimientos para lista de espera
- [x] Crear procedimientos para WhatsApp
- [x] Crear procedimientos para estadísticas del dashboard
- [x] Implementar procedimientos protegidos por tenant

## ✅ Pruebas y Validación
- [ ] Probar aislamiento de datos entre tenants
- [ ] Validar sistema de autenticación
- [ ] Probar funcionalidad de drag-and-drop
- [ ] Validar integración con Evolution API
- [ ] Probar envío de mensajes WhatsApp
- [ ] Validar recordatorios automáticos
- [ ] Probar todas las funcionalidades en español

## 📦 Deployment
- [ ] Configurar variables de entorno
- [ ] Preparar documentación de deployment
- [ ] Crear checkpoint final
- [ ] Entregar sistema al usuario

## 🔒 Seguridad y Privacidad
- [ ] Implementar validación de datos en formularios
- [ ] Configurar sanitización de inputs
- [ ] Implementar rate limiting para API
- [x] Agregar logs de auditoría
- [ ] Configurar backup automático de base de datos

---

**Total de tareas:** 75+  
**Estado:** Iniciando desarrollo  
**Prioridad:** Alta - Sistema crítico para 68+ clínicas


## 🎨 Adaptação de Design (Versão Anterior)
- [x] Trocar tema escuro por cores vibrantes
- [x] Redesenhar cards do dashboard com cores (azul, verde, laranja, roxo, vermelho)
- [x] Adicionar subtitle "para secretarias" no header
- [x] Criar botão "Ver Agenda" ciano no topo direito
- [x] Expandir sidebar com novos módulos
- [x] Adicionar módulo "Pacientes Marketing"
- [x] Adicionar módulo "Follow Up"
- [x] Adicionar módulo "Guardian IA" com dropdown
- [x] Adicionar módulo "Calculadora ROI"
- [x] Adicionar módulo "Envío Automático"
- [x] Adicionar módulo "Recordatorios" com dropdown
- [x] Adicionar seção "Día Siguiente - sábado, 07 de febrero"
- [x] Criar cards de status (Confirmadas, Pendientes, Canceladas)
- [ ] Adicionar calendário no top-right para seleção de dia/mês
- [x] Implementar contadores clicáveis para citas


## 🎯 Adaptação Dashboard (Imagem 2 - Referência Final)
- [x] Implementar calendário interativo no topo direito do dashboard
- [x] Calendário deve mostrar mês/ano com navegação (setas)
- [x] Destacar dia atual em ciano
- [x] Permitir seleção de dia clicando nos números
- [x] Mostrar botão "Hoy" para voltar ao dia atual
- [x] Redesenhar layout de cards para 4 cards na primeira linha
- [x] Card 1: "Citas de Hoy" (azul) - "Consultas agendadas para hoy"
- [x] Card 2: "Confirmadas" (verde) - "Pacientes confirmaron asistencia"
- [x] Card 3: "Pendientes" (laranja) - "Esperando confirmación"
- [x] Card 4: "Completadas" (roxo) - "Consultas finalizadas hoy"
- [x] Mudar seção "Día Siguiente" para "Citas de Mañana"
- [ ] Atualizar sidebar com novos módulos:
  - [x] Canales WhatsApp
  - [x] Estadísticas Sillones
  - [x] Lista de Espera
  - [x] Relatório Inadimplência
- [ ] Remover módulos antigos não presentes na imagem
- [ ] Ajustar espaçamento e layout para ficar idêntico à referência


## 📅 Navegação por Data no Calendário
- [ ] Criar procedimento tRPC `dashboard.statsByDate` para buscar dados por data específica
- [ ] Modificar procedimento para aceitar parâmetro `date` (ISO string)
- [ ] Retornar contadores separados por tipo (Ortodontia Confirmadas, Ortodontia Pendientes, etc.)
- [ ] Atualizar Dashboard para usar `selectedDate` ao invés de data atual
- [ ] Implementar `useEffect` para refetch quando `selectedDate` mudar
- [ ] Atualizar cards "Citas de Hoy" para mostrar data selecionada
- [ ] Atualizar seção "Citas de Mañana" para mostrar dia seguinte à data selecionada
- [ ] Garantir que botão "Hoy" reseta para data atual
- [ ] Testar navegação entre diferentes dias do mês
- [ ] Testar navegação entre diferentes meses
- [ ] Verificar que contadores atualizam corretamente


## ➕ Botão de Agendamento Rápido
- [ ] Adicionar botão redondo "+" flutuante no dashboard (canto inferior direito)
- [ ] Botão deve ter cor ciano (#06b6d4) para destaque
- [ ] Ao clicar, abrir modal "Cadastro Rápido de Paciente"
- [ ] Modal deve ter formulário simplificado (Nome, Telefone, Email, Data de Nascimento)
- [ ] Após cadastro, redirecionar para página de agendamentos
