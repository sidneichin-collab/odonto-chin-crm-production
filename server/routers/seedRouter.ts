import { router, adminProcedure } from "../_core/trpc";
import * as db from "../db";

export const seedRouter = router({
  createTestData: adminProcedure.mutation(async ({ ctx }) => {
    // Get first clinic
    const clinics = await db.listClinics();
    if (clinics.length === 0) {
      throw new Error("No clinics found. Create a clinic first.");
    }
    const clinic = clinics[0];

    // Create 10 test patients
    const testPatients = [
      { name: 'María González', ci: '4567890', phone: '+595981234567', email: 'maria@example.com', birthDate: '1990-05-15', treatmentType: 'Ortodoncio' },
      { name: 'Carlos Benítez', ci: '5678901', phone: '+595982345678', email: 'carlos@example.com', birthDate: '1985-08-22', treatmentType: 'Clínico' },
      { name: 'Ana Rodríguez', ci: '6789012', phone: '+595983456789', email: 'ana@example.com', birthDate: '1995-03-10', treatmentType: 'Ortodoncio' },
      { name: 'José Martínez', ci: '7890123', phone: '+595984567890', email: 'jose@example.com', birthDate: '1988-11-30', treatmentType: 'Clínico' },
      { name: 'Laura Fernández', ci: '8901234', phone: '+595985678901', email: 'laura@example.com', birthDate: '1992-07-18', treatmentType: 'Marketing' },
      { name: 'Pedro Sánchez', ci: '9012345', phone: '+595986789012', email: 'pedro@example.com', birthDate: '1987-02-25', treatmentType: 'Ortodoncio' },
      { name: 'Sofía López', ci: '1234567', phone: '+595987890123', email: 'sofia@example.com', birthDate: '1993-09-14', treatmentType: 'Clínico' },
      { name: 'Diego Ramírez', ci: '2345678', phone: '+595988901234', email: 'diego@example.com', birthDate: '1991-12-05', treatmentType: 'Ortodoncio' },
      { name: 'Valentina Torres', ci: '3456789', phone: '+595989012345', email: 'valentina@example.com', birthDate: '1994-04-20', treatmentType: 'Marketing' },
      { name: 'Mateo Silva', ci: '4567891', phone: '+595990123456', email: 'mateo@example.com', birthDate: '1989-06-08', treatmentType: 'Clínico' }
    ];

    const createdPatients = [];
    for (const p of testPatients) {
      const patient = await db.createPatient({
        clinicId: clinic.id,
        fullName: p.name,
        ci: p.ci,
        phone: p.phone,
        email: p.email,
        birthDate: p.birthDate,
        treatmentType: p.treatmentType as any,
        origin: 'Test'
      });
      createdPatients.push(patient);
    }

    // Create 20 test appointments
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);

    const dates = [today, tomorrow, dayAfter];
    const times = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
    const sillones = ['Sillón 1 Oro', 'Sillón 2 Oro', 'Sillón 3 Oro', 'Sillón 1 Clínico', 'Evaluación Marketing'];
    const statuses = ['scheduled', 'confirmed', 'scheduled', 'confirmed', 'scheduled'];

    const createdAppointments = [];
    for (let i = 0; i < 20; i++) {
      const patient = createdPatients[i % createdPatients.length];
      const date = dates[i % dates.length];
      const time = times[i % times.length];
      const sillon = sillones[i % sillones.length];
      const status = statuses[i % statuses.length];
      
      const appointmentDate = new Date(date);
      const [hours, minutes] = time.split(':');
      appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      const appointment = await db.createAppointment({
        clinicId: clinic.id,
        patientId: patient.id,
        appointmentDate,
        appointmentTime: time,
        sillon,
        treatmentType: patient.treatmentType,
        status: status as any
      });
      
      createdAppointments.push(appointment);
    }

    return {
      success: true,
      patientsCreated: createdPatients.length,
      appointmentsCreated: createdAppointments.length,
      message: `✅ Created ${createdPatients.length} patients and ${createdAppointments.length} appointments`
    };
  })
});
