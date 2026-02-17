// populate-clinics.mjs - Populate clinics table with 70 clinics
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./drizzle/schema.js";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { schema, mode: "default" });

const clinicsData = [
  // CENTRAL (Paraguai) - 14 clínicas
  { name: "LUQUE", country: "Paraguay", city: "Luque", timezone: "America/Asuncion", currency: "PYG" },
  { name: "CAPIATA", country: "Paraguay", city: "Capiatá", timezone: "America/Asuncion", currency: "PYG" },
  { name: "S LORENZO", country: "Paraguay", city: "San Lorenzo", timezone: "America/Asuncion", currency: "PYG" },
  { name: "V.MORRA", country: "Paraguay", city: "Villa Morra", timezone: "America/Asuncion", currency: "PYG" },
  { name: "ASUNCIÓN", country: "Paraguay", city: "Asunción", timezone: "America/Asuncion", currency: "PYG" },
  { name: "LAMBARE", country: "Paraguay", city: "Lambaré", timezone: "America/Asuncion", currency: "PYG" },
  { name: "MARIANO", country: "Paraguay", city: "Mariano Roque Alonso", timezone: "America/Asuncion", currency: "PYG" },
  { name: "LIMPIO", country: "Paraguay", city: "Limpio", timezone: "America/Asuncion", currency: "PYG" },
  { name: "NEMBY", country: "Paraguay", city: "Ñemby", timezone: "America/Asuncion", currency: "PYG" },
  { name: "ITAUGUA", country: "Paraguay", city: "Itauguá", timezone: "America/Asuncion", currency: "PYG" },
  { name: "FERNANDO D. M.", country: "Paraguay", city: "Fernando de la Mora", timezone: "America/Asuncion", currency: "PYG" },
  { name: "V.ELISA", country: "Paraguay", city: "Villa Elisa", timezone: "America/Asuncion", currency: "PYG" },
  { name: "AREGUA", country: "Paraguay", city: "Areguá", timezone: "America/Asuncion", currency: "PYG" },
  { name: "ITA", country: "Paraguay", city: "Itá", timezone: "America/Asuncion", currency: "PYG" },
  
  // INTERIOR (Paraguai) - 14 clínicas
  { name: "ENCARNACIÓN", country: "Paraguay", city: "Encarnación", timezone: "America/Asuncion", currency: "PYG" },
  { name: "CDE", country: "Paraguay", city: "Ciudad del Este", timezone: "America/Asuncion", currency: "PYG" },
  { name: "OVIEDO", country: "Paraguay", city: "Oviedo", timezone: "America/Asuncion", currency: "PYG" },
  { name: "CAAGUAZU", country: "Paraguay", city: "Caaguazú", timezone: "America/Asuncion", currency: "PYG" },
  { name: "HERNANDARIAS", country: "Paraguay", city: "Hernandarias", timezone: "America/Asuncion", currency: "PYG" },
  { name: "PJC", country: "Paraguay", city: "Pedro Juan Caballero", timezone: "America/Asuncion", currency: "PYG" },
  { name: "CONCEPCIÓN", country: "Paraguay", city: "Concepción", timezone: "America/Asuncion", currency: "PYG" },
  { name: "VILLARRICA", country: "Paraguay", city: "Villarrica", timezone: "America/Asuncion", currency: "PYG" },
  { name: "S.IGNACIO", country: "Paraguay", city: "San Ignacio", timezone: "America/Asuncion", currency: "PYG" },
  { name: "SANTANI", country: "Paraguay", city: "Santaní", timezone: "America/Asuncion", currency: "PYG" },
  { name: "CAACUPE", country: "Paraguay", city: "Caacupé", timezone: "America/Asuncion", currency: "PYG" },
  { name: "STA RITA", country: "Paraguay", city: "Santa Rita", timezone: "America/Asuncion", currency: "PYG" },
  { name: "PTE FRANCO", country: "Paraguay", city: "Presidente Franco", timezone: "America/Asuncion", currency: "PYG" },
  { name: "S. DEL GUAIRA", country: "Paraguay", city: "Salto del Guairá", timezone: "America/Asuncion", currency: "PYG" },
  
  // BOLIVIA - 27 clínicas
  { name: "RAMADA", country: "Bolivia", city: "La Paz", timezone: "America/La_Paz", currency: "BOB" },
  { name: "BARRIO LINDO", country: "Bolivia", city: "La Paz", timezone: "America/La_Paz", currency: "BOB" },
  { name: "MUTUALISTA", country: "Bolivia", city: "La Paz", timezone: "America/La_Paz", currency: "BOB" },
  { name: "LOS POZOS", country: "Bolivia", city: "Santa Cruz", timezone: "America/La_Paz", currency: "BOB" },
  { name: "EI PRADO", country: "Bolivia", city: "La Paz", timezone: "America/La_Paz", currency: "BOB" },
  { name: "BUSCH", country: "Bolivia", city: "Santa Cruz", timezone: "America/La_Paz", currency: "BOB" },
  { name: "EL ALTO", country: "Bolivia", city: "El Alto", timezone: "America/La_Paz", currency: "BOB" },
  { name: "LA CANCHA", country: "Bolivia", city: "Cochabamba", timezone: "America/La_Paz", currency: "BOB" },
  { name: "QUILLACOLLO", country: "Bolivia", city: "Quillacollo", timezone: "America/La_Paz", currency: "BOB" },
  { name: "SUCRE", country: "Bolivia", city: "Sucre", timezone: "America/La_Paz", currency: "BOB" },
  { name: "ORURO", country: "Bolivia", city: "Oruro", timezone: "America/La_Paz", currency: "BOB" },
  { name: "TARIJA", country: "Bolivia", city: "Tarija", timezone: "America/La_Paz", currency: "BOB" },
  { name: "MONTERO", country: "Bolivia", city: "Montero", timezone: "America/La_Paz", currency: "BOB" },
  { name: "WARNES", country: "Bolivia", city: "Warnes", timezone: "America/La_Paz", currency: "BOB" },
  { name: "SACABA", country: "Bolivia", city: "Sacaba", timezone: "America/La_Paz", currency: "BOB" },
  { name: "POTOSI", country: "Bolivia", city: "Potosí", timezone: "America/La_Paz", currency: "BOB" },
  { name: "COTA COTA", country: "Bolivia", city: "La Paz", timezone: "America/La_Paz", currency: "BOB" },
  { name: "TRINIDAD", country: "Bolivia", city: "Trinidad", timezone: "America/La_Paz", currency: "BOB" },
  { name: "4 DE NOVIEMBRE", country: "Bolivia", city: "Santa Cruz", timezone: "America/La_Paz", currency: "BOB" },
  { name: "COTOCA", country: "Bolivia", city: "Cotoca", timezone: "America/La_Paz", currency: "BOB" },
  { name: "RIBERALTA", country: "Bolivia", city: "Riberalta", timezone: "America/La_Paz", currency: "BOB" },
  { name: "PAMPA LA ISLA", country: "Bolivia", city: "Santa Cruz", timezone: "America/La_Paz", currency: "BOB" },
  { name: "C.VILLA LA ADELA", country: "Bolivia", city: "Santa Cruz", timezone: "America/La_Paz", currency: "BOB" },
  { name: "LA GUARDIA", country: "Bolivia", city: "La Guardia", timezone: "America/La_Paz", currency: "BOB" },
  { name: "COBIJA", country: "Bolivia", city: "Cobija", timezone: "America/La_Paz", currency: "BOB" },
  { name: "SAN IGNACIO DE V", country: "Bolivia", city: "San Ignacio de Velasco", timezone: "America/La_Paz", currency: "BOB" },
  { name: "EL TORNO", country: "Bolivia", city: "El Torno", timezone: "America/La_Paz", currency: "BOB" },
  
  // URUGUAY - 5 clínicas
  { name: "MALDONADO", country: "Uruguay", city: "Maldonado", timezone: "America/Montevideo", currency: "UYU" },
  { name: "P.MOLINO", country: "Uruguay", city: "Punta del Este", timezone: "America/Montevideo", currency: "UYU" },
  { name: "LAS PIEDRAS", country: "Uruguay", city: "Las Piedras", timezone: "America/Montevideo", currency: "UYU" },
  { name: "DE LA COSTA", country: "Uruguay", city: "Ciudad de la Costa", timezone: "America/Montevideo", currency: "UYU" },
  { name: "SAN CARLOS", country: "Uruguay", city: "San Carlos", timezone: "America/Montevideo", currency: "UYU" },
  
  // CHILE - 2 clínicas
  { name: "LA FLORIDA", country: "Chile", city: "La Florida", timezone: "America/Santiago", currency: "CLP" },
  { name: "BANDERA", country: "Chile", city: "Santiago", timezone: "America/Santiago", currency: "CLP" },
  
  // PANAMÁ - 3 clínicas
  { name: "LOS ANDES", country: "Panama", city: "Panama City", timezone: "America/Panama", currency: "PAB" },
  { name: "MEGAMALL", country: "Panama", city: "Panama City", timezone: "America/Panama", currency: "PAB" },
  { name: "ALBROOK", country: "Panama", city: "Panama City", timezone: "America/Panama", currency: "PAB" },
  
  // COLÔMBIA - 1 clínica
  { name: "BOGOTÁ", country: "Colombia", city: "Bogotá", timezone: "America/Bogota", currency: "COP" },
  
  // PERU - 1 clínica
  { name: "LIMA", country: "Peru", city: "Lima", timezone: "America/Lima", currency: "PEN" },
];

console.log(`🏥 Populando ${clinicsData.length} clínicas...`);

try {
  for (const clinic of clinicsData) {
    await db.insert(schema.clinics).values(clinic);
    console.log(`✅ ${clinic.name} (${clinic.country}) - inserida`);
  }
  
  console.log(`\n🎉 ${clinicsData.length} clínicas inseridas com sucesso!`);
  
  // Verificar total
  const total = await db.select().from(schema.clinics);
  console.log(`📊 Total de clínicas no banco: ${total.length}`);
  
} catch (error) {
  console.error("❌ Erro ao popular clínicas:", error);
} finally {
  await connection.end();
}
