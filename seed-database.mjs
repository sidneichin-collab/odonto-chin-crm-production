/**
 * Script de Seed para Popular Banco de Dados
 * Odonto Chin CRM - 70 Clínicas em 7 Países
 * 
 * Execute: node seed-database.mjs
 */

import mysql from 'mysql2/promise';
import 'dotenv/config';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não encontrada no .env');
  process.exit(1);
}

console.log('🔌 Conectando ao banco de dados...');

const connection = await mysql.createConnection(DATABASE_URL);

console.log('✅ Conectado com sucesso!\n');

// ============================================
// 1. POPULAR 70 CLÍNICAS (7 PAÍSES)
// ============================================

console.log('🏥 Populando 70 clínicas em 7 países...');

const countries = [
  { name: 'Bolivia', cities: ['La Paz', 'Santa Cruz', 'Cochabamba', 'Sucre', 'Oruro'], timezone: 'America/La_Paz', currency: 'BOB', count: 10 },
  { name: 'Paraguay', cities: ['Asunción', 'Ciudad del Este', 'Encarnación', 'Pedro Juan Caballero', 'Concepción'], timezone: 'America/Asuncion', currency: 'PYG', count: 10 },
  { name: 'Panama', cities: ['Ciudad de Panamá', 'Colón', 'David', 'Santiago', 'Chitré'], timezone: 'America/Panama', currency: 'PAB', count: 10 },
  { name: 'Chile', cities: ['Santiago', 'Valparaíso', 'Concepción', 'La Serena', 'Antofagasta'], timezone: 'America/Santiago', currency: 'CLP', count: 10 },
  { name: 'Uruguay', cities: ['Montevideo', 'Salto', 'Paysandú', 'Maldonado', 'Rivera'], timezone: 'America/Montevideo', currency: 'UYU', count: 10 },
  { name: 'Colombia', cities: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena'], timezone: 'America/Bogota', currency: 'COP', count: 10 },
  { name: 'Peru', cities: ['Lima', 'Arequipa', 'Trujillo', 'Cusco', 'Chiclayo'], timezone: 'America/Lima', currency: 'PEN', count: 10 }
];

const clinicNames = [
  'Odonto Chin', 'Clínica Dental Sonrisa', 'Centro Odontológico Salud', 
  'Dental Care', 'Ortodoncia Moderna', 'Clínica Dental Familiar',
  'Sonrisas Perfectas', 'Dental Excellence', 'Odontología Integral',
  'Centro Dental Avanzado'
];

let clinicId = 1;

for (const country of countries) {
  for (let i = 0; i < country.count; i++) {
    const city = country.cities[i % country.cities.length];
    const clinicName = `${clinicNames[i % clinicNames.length]} ${city}`;
    const status = i === 0 ? 'active' : (Math.random() > 0.1 ? 'active' : 'coming_soon');
    
    await connection.execute(
      `INSERT INTO clinics (name, country, city, address, timezone, currency, phone, email, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        clinicName,
        country.name,
        city,
        `Av. Principal ${100 + i}, ${city}`,
        country.timezone,
        country.currency,
        `+${Math.floor(Math.random() * 900000000 + 100000000)}`,
        `contacto@${clinicName.toLowerCase().replace(/\s+/g, '')}.com`,
        status
      ]
    );
    
    clinicId++;
  }
}

console.log(`✅ ${clinicId - 1} clínicas criadas!\n`);

// ============================================
// 2. POPULAR PACIENTES (30 pacientes)
// ============================================

console.log('👥 Populando 30 pacientes...');

const firstNames = ['Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Carmen', 'José', 'Laura', 'Pedro', 'Sofia', 
                     'Miguel', 'Isabel', 'Diego', 'Valentina', 'Javier', 'Camila', 'Fernando', 'Daniela', 
                     'Roberto', 'Gabriela', 'Antonio', 'Lucía', 'Manuel', 'Paula', 'Ricardo', 'Natalia',
                     'Andrés', 'Martina', 'Jorge', 'Victoria'];

const lastNames = ['García', 'Rodríguez', 'Martínez', 'López', 'González', 'Pérez', 'Sánchez', 'Ramírez',
                   'Torres', 'Flores', 'Rivera', 'Gómez', 'Díaz', 'Cruz', 'Morales', 'Reyes'];

const treatmentTypes = ['ortodontia', 'clinica_geral', 'ambos'];
const riskLevels = ['baixo', 'medio', 'alto'];

for (let i = 1; i <= 30; i++) {
  const firstName = firstNames[i - 1];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const fullName = `${firstName} ${lastName}`;
  
  const birthYear = 1960 + Math.floor(Math.random() * 40);
  const birthMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const birthDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  
  await connection.execute(
    `INSERT INTO patients (name, ci, phone, emergency_contact, email, birth_date, address, ubicacion, treatment_type, origin, risk_level, notes) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      fullName,
      `${Math.floor(Math.random() * 9000000 + 1000000)}`,
      `+595${Math.floor(Math.random() * 900000000 + 100000000)}`,
      `+595${Math.floor(Math.random() * 900000000 + 100000000)}`,
      `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
      `${birthYear}-${birthMonth}-${birthDay}`,
      `Calle ${Math.floor(Math.random() * 100 + 1)}, Barrio Centro`,
      `Lat: ${-25.2 - Math.random()}, Lng: ${-57.5 + Math.random()}`,
      treatmentTypes[Math.floor(Math.random() * treatmentTypes.length)],
      Math.random() > 0.5 ? 'Marketing Digital' : 'Referência',
      riskLevels[Math.floor(Math.random() * riskLevels.length)],
      `Paciente ${i} - Dados de teste`
    ]
  );
}

console.log('✅ 30 pacientes criados!\n');

// Buscar IDs reais dos pacientes criados
const [patientRows] = await connection.execute('SELECT id FROM patients ORDER BY id');
const patientIds = patientRows.map(row => row.id);

if (patientIds.length === 0) {
  console.log('❌ Nenhum paciente encontrado!');
  await connection.end();
  process.exit(1);
}

console.log(`✅ Encontrados ${patientIds.length} pacientes (IDs: ${patientIds[0]} a ${patientIds[patientIds.length-1]})\n`);

// ============================================
// 3. POPULAR AGENDAMENTOS (50 agendamentos)
// ============================================

console.log('📅 Populando 50 agendamentos...');

const statuses = ['scheduled', 'confirmed', 'not_confirmed', 'completed', 'cancelled', 'rescheduling_pending'];
const treatmentTypesAppt = ['orthodontics', 'general_clinic', 'both'];
const chairs = [1, 2, 3, 4];

// Datas: hoje, amanhã, próximos 7 dias
const today = new Date();
const dates = [];

for (let i = -3; i <= 7; i++) {
  const date = new Date(today);
  date.setDate(date.getDate() + i);
  dates.push(date);
}

for (let i = 1; i <= 50; i++) {
  const patientId = patientIds[Math.floor(Math.random() * patientIds.length)];
  const date = dates[Math.floor(Math.random() * dates.length)];
  const hour = 8 + Math.floor(Math.random() * 9); // 8h às 17h
  const minute = Math.random() > 0.5 ? '00' : '30';
  const time = `${String(hour).padStart(2, '0')}:${minute}:00`;
  
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const chair = chairs[Math.floor(Math.random() * chairs.length)];
  
  const dateStr = date.toISOString().split('T')[0];
  
  await connection.execute(
    `INSERT INTO appointments (patient_id, appointment_date, appointment_time, duration, treatment_type, status, chair, notes, reminder_sent) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      patientId,
      dateStr,
      time,
      60, // 60 minutos
      treatmentTypesAppt[Math.floor(Math.random() * treatmentTypesAppt.length)],
      status,
      chair,
      `Agendamento ${i} - Teste`,
      Math.random() > 0.5 ? 1 : 0
    ]
  );
}

console.log('✅ 50 agendamentos criados!\n');

// ============================================
// 4. POPULAR TRATAMENTOS
// ============================================

console.log('💉 Populando tratamentos...');

const treatments = [
  { name: 'Limpeza Dental', description: 'Limpeza profissional e profilaxia', duration: 30, price: '150.00' },
  { name: 'Restauração', description: 'Restauração com resina composta', duration: 60, price: '250.00' },
  { name: 'Extração', description: 'Extração dentária simples', duration: 45, price: '200.00' },
  { name: 'Canal', description: 'Tratamento de canal', duration: 90, price: '800.00' },
  { name: 'Aparelho Ortodôntico', description: 'Instalação de aparelho fixo', duration: 120, price: '2500.00' },
  { name: 'Clareamento', description: 'Clareamento dental a laser', duration: 60, price: '600.00' },
  { name: 'Implante', description: 'Implante dentário', duration: 180, price: '3500.00' },
  { name: 'Prótese', description: 'Prótese dentária', duration: 90, price: '1500.00' }
];

for (const treatment of treatments) {
  await connection.execute(
    `INSERT INTO treatments (name, description, duration, price) VALUES (?, ?, ?, ?)`,
    [treatment.name, treatment.description, treatment.duration, treatment.price]
  );
}

console.log('✅ 8 tratamentos criados!\n');

// ============================================
// 5. POPULAR TAGS
// ============================================

console.log('🏷️ Populando tags...');

const tags = [
  { name: 'VIP', color: '#FFD700', type: 'patient' },
  { name: 'Urgente', color: '#EF4444', type: 'appointment' },
  { name: 'Primeira Consulta', color: '#3B82F6', type: 'appointment' },
  { name: 'Retorno', color: '#10B981', type: 'appointment' },
  { name: 'Inadimplente', color: '#F97316', type: 'patient' },
  { name: 'Marketing', color: '#A855F7', type: 'general' }
];

for (const tag of tags) {
  await connection.execute(
    `INSERT INTO tags (name, color, tag_type, is_active) VALUES (?, ?, ?, ?)`,
    [tag.name, tag.color, tag.type, 1]
  );
}

console.log('✅ 6 tags criadas!\n');

// ============================================
// FINALIZAR
// ============================================

await connection.end();

console.log('🎉 SEED COMPLETO!');
console.log('');
console.log('📊 Resumo:');
console.log('   - 70 clínicas em 7 países');
console.log('   - 30 pacientes');
console.log('   - 50 agendamentos (distribuídos em datas variadas)');
console.log('   - 8 tratamentos');
console.log('   - 6 tags');
console.log('');
console.log('✅ Banco de dados populado com sucesso!');
