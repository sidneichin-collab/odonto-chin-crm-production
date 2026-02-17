/**
 * Script to create realistic test data for Odonto Chin CRM
 * 10 Paraguayan patients + 20 appointments across 3 days
 */

import { db } from "../server/db";
import { patients, appointments, clinics } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// Realistic Paraguayan names
const paraguayanPatients = [
  { firstName: "María", lastName: "González", phone: "+595981234567" },
  { firstName: "Carlos", lastName: "Rodríguez", phone: "+595982345678" },
  { firstName: "Ana", lastName: "Martínez", phone: "+595983456789" },
  { firstName: "José", lastName: "López", phone: "+595984567890" },
  { firstName: "Rosa", lastName: "Fernández", phone: "+595985678901" },
  { firstName: "Pedro", lastName: "García", phone: "+595986789012" },
  { firstName: "Carmen", lastName: "Benítez", phone: "+595987890123" },
  { firstName: "Luis", lastName: "Ramírez", phone: "+595988901234" },
  { firstName: "Elena", lastName: "Torres", phone: "+595989012345" },
  { firstName: "Miguel", lastName: "Sánchez", phone: "+595990123456" },
];

// Treatment types
const treatmentTypes = ["Ortodoncio", "Clínico"];

// Sillones
const sillones = ["Sillón 1 Oro", "Sillón 2 Oro", "Sillón 3 Oro", "Sillón 1 Clínico"];

// Time slots (08:00 - 18:00, 20min intervals)
const timeSlots = [
  "08:00", "08:20", "08:40", "09:00", "09:20", "09:40",
  "10:00", "10:20", "10:40", "11:00", "11:20", "11:40",
  "12:00", "12:20", "12:40", "13:00", "13:20", "13:40",
  "14:00", "14:20", "14:40", "15:00", "15:20", "15:40",
  "16:00", "16:20", "16:40", "17:00", "17:20", "17:40"
];

// Statuses
const statuses = ["scheduled", "confirmed", "completed", "cancelled", "rescheduled"];

async function createTestData() {
  console.log("🚀 Creating test data for Odonto Chin CRM...\n");

  try {
    // Get first clinic
    const [clinic] = await db.select().from(clinics).limit(1);
    if (!clinic) {
      console.error("❌ No clinic found! Please create a clinic first.");
      return;
    }

    console.log(`✅ Using clinic: ${clinic.name} (ID: ${clinic.id})\n`);

    // Create 10 patients
    console.log("👥 Creating 10 patients...");
    const createdPatients = [];

    for (const patient of paraguayanPatients) {
      const treatmentType = treatmentTypes[Math.floor(Math.random() * treatmentTypes.length)];
      
      const [newPatient] = await db.insert(patients).values({
        clinicId: clinic.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        fullName: `${patient.firstName} ${patient.lastName}`,
        phone: patient.phone,
        emergencyPhone: patient.phone.replace(/\d{3}$/, "999"), // Different last 3 digits
        email: `${patient.firstName.toLowerCase()}.${patient.lastName.toLowerCase()}@example.com`,
        treatmentType,
        origin: "Referido",
        ubicacion: "Asunción, Paraguay",
        notes: `Paciente de prueba - ${treatmentType}`,
      }).$returningId();

      createdPatients.push({
        id: newPatient.id,
        name: `${patient.firstName} ${patient.lastName}`,
        phone: patient.phone,
        treatmentType,
      });

      console.log(`  ✓ ${patient.firstName} ${patient.lastName} (${treatmentType})`);
    }

    console.log(`\n✅ Created ${createdPatients.length} patients\n`);

    // Create 20 appointments across 3 days
    console.log("📅 Creating 20 appointments across 3 days...");

    const today = new Date();
    const dates = [
      new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
      new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
      new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    ];

    let appointmentCount = 0;

    for (let i = 0; i < 20; i++) {
      const patient = createdPatients[i % createdPatients.length];
      const date = dates[i % dates.length];
      const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
      const sillon = sillones[Math.floor(Math.random() * sillones.length)];
      const status = i < 10 ? "scheduled" : statuses[Math.floor(Math.random() * statuses.length)];

      const dateStr = date.toISOString().split('T')[0];
      const appointmentDateTime = `${dateStr}T${timeSlot}:00`;

      await db.insert(appointments).values({
        clinicId: clinic.id,
        patientId: patient.id,
        patientName: patient.name,
        patientPhone: patient.phone,
        appointmentDate: appointmentDateTime,
        appointmentTime: timeSlot,
        appointmentType: patient.treatmentType === "Ortodoncio" ? "orthodontic_treatment" : "general_clinic",
        chair: sillon,
        treatmentType: patient.treatmentType,
        status,
        duration: 60,
        notes: `Cita de prueba - ${status}`,
      });

      appointmentCount++;
      console.log(`  ✓ Appointment ${appointmentCount}: ${patient.name} - ${dateStr} ${timeSlot} (${sillon}) [${status}]`);
    }

    console.log(`\n✅ Created ${appointmentCount} appointments\n`);
    console.log("🎉 Test data creation complete!\n");
    console.log("📊 Summary:");
    console.log(`   - Clinic: ${clinic.name}`);
    console.log(`   - Patients: ${createdPatients.length}`);
    console.log(`   - Appointments: ${appointmentCount}`);
    console.log(`   - Date range: ${dates[0].toISOString().split('T')[0]} to ${dates[2].toISOString().split('T')[0]}`);
    console.log("\n✨ You can now test the Kanban views with realistic data!");

  } catch (error) {
    console.error("❌ Error creating test data:", error);
    throw error;
  }
}

// Run the script
createTestData()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
