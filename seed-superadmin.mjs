import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./drizzle/schema.ts";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection, { schema, mode: "default" });

console.log("Creating super-admin user...");

// Create super-admin user
const superAdmin = await db.insert(schema.user).values({
  openId: "super-admin-001",
  name: "Super Admin",
  email: "admin@odontochin.com",
  role: "super-admin",
  createdAt: new Date(),
}).onDuplicateKeyUpdate({
  set: {
    name: "Super Admin",
    role: "super-admin",
  },
});

console.log("✅ Super-admin user created:", superAdmin);

// Create default clinic
const clinic = await db.insert(schema.clinics).values({
  name: "Clínica Principal",
  subdomain: "principal",
  whatsappApiUrl: "http://95.111.240.243:8080",
  whatsappApiKey: "OdontoChinSecretKey2026",
  whatsappInstance: "CHINRMREPLIT",
  n8nWebhookUrl: "",
  createdAt: new Date(),
}).onDuplicateKeyUpdate({
  set: {
    name: "Clínica Principal",
  },
});

console.log("✅ Default clinic created:", clinic);

await connection.end();
console.log("✅ Seed completed!");
