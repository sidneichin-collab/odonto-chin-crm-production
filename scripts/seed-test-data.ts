/**
 * Seed test data - 10 patients + 20 appointments
 * Run with: pnpm tsx scripts/seed-test-data.ts
 */

import { db, createPatient, createAppointment } from "../server/db";
import { patients } from "../drizzle/schema";

const testData = [
  { name: 'María González', phone: '+595981234567', type: 'Ortodoncio' },
  { name: 'Carlos Rodríguez', phone: '+595982345678', type: 'Clínico' },
  { name: 'Ana Martínez', phone: '+595983456789', type: 'Ortodoncio' },
  { name: 'José López', phone: '+595984567890', type: 'Clínico' },
  { name: 'Rosa Fernández', phone: '+595985678901', type: 'Ortodoncio' },
  { name: 'Pedro García', phone: '+595986789012', type: 'Clínico' },
  { name: 'Carmen Benítez', phone: '+595987890123', type: 'Ortodoncio' },
  { name: 'Luis Ramírez', phone: '+595988901234', type: 'Clínico' },
  { name: 'Elena Torres', phone: '+595989012345', type: 'Ortodoncio' },
  { name: 'Miguel Sánchez', phone: '+595990123456', type: 'Clínico' },
];

async function seed() {
  console.log('🚀 Seeding test data...\n');

  try {
    // Get existing patient to check treatment_type format
    const [existing] = await db.select().from(patients).limit(1);
    
    if (!existing) {
      console.error('❌ No patients exist. Please create at least one patient first.');
      process.exit(1);
    }

    console.log(`✅ Using clinic ID: 1\n`);

    // Create patients
    console.log('👥 Creating 10 patients...');
    const createdPatients = [];

    for (const p of testData) {
      const patient = await createPatient({
        clinicId: 1,
        name: p.name,
        phone: p.phone,
        emergencyContact: p.phone.replace(/\d{3}$/, '999'),
        email: `${p.name.toLowerCase().replace(' ', '.')}@test.com`,
        ubicacion: 'Asunción',
        treatmentType: existing.treatmentType, // Copy existing format
        origin: 'Test',
        notes: 'Test patient',
      });

      createdPatients.push({ ...patient, type: p.type });
      console.log(`  ✓ ${p.name}`);
    }

    console.log(`\n✅ Created ${createdPatients.length} patients\n`);

    // Create appointments
    console.log('📅 Creating 20 appointments...');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);

    const dates = [
      new Date(tomorrow),
      new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000),
      new Date(tomorrow.getTime() + 48 * 60 * 60 * 1000),
    ];

    const times = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
    const chairs = ['Sillón 1 Oro', 'Sillón 2 Oro', 'Sillón 3 Oro', 'Sillón 1 Clínico'];
    const statuses = ['scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduling_pending'];

    let count = 0;
    for (let i = 0; i < 20; i++) {
      const patient = createdPatients[i % createdPatients.length];
      const date = dates[i % dates.length];
      const time = times[i % times.length];
      const chair = chairs[i % chairs.length];
      const status = i < 10 ? 'scheduled' : statuses[i % statuses.length];

      const [hours, minutes] = time.split(':');
      const appointmentDate = new Date(date);
      appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      await createAppointment({
        clinicId: 1,
        patientId: patient.id!,
        patientName: patient.name!,
        patientPhone: patient.phone!,
        appointmentDate: appointmentDate.toISOString().slice(0, 19).replace('T', ' '),
        appointmentTime: time,
        appointmentType: patient.type === 'Ortodoncio' ? 'orthodontic_treatment' : 'general_clinic',
        chair,
        treatmentType: patient.type === 'Ortodoncio' ? 'orthodontics' : 'general_clinic',
        status: status as any,
        duration: 60,
        notes: 'Test appointment',
      });

      count++;
      console.log(`  ✓ ${count}. ${patient.name} - ${date.toISOString().split('T')[0]} ${time} [${status}]`);
    }

    console.log(`\n✅ Created ${count} appointments\n`);
    console.log('🎉 Test data seeded successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Patients: ${createdPatients.length}`);
    console.log(`   - Appointments: ${count}`);
    console.log(`   - Dates: ${dates[0].toISOString().split('T')[0]} to ${dates[2].toISOString().split('T')[0]}`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

seed();
