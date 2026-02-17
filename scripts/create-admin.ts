import { db } from "../server/db";
import { users } from "../drizzle/schema";
import bcrypt from "bcryptjs";

async function createAdmin() {
  const email = "admin@odontochin.com";
  const password = "Admin@2026";
  
  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);
  
  // Insert admin user
  await db.insert(users).values({
    openId: `admin-${Date.now()}`,
    email,
    password_hash: passwordHash,
    role: "admin",
    account_status: "active",
    login_method: "email",
  });
  
  console.log("✅ Admin user created successfully!");
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  
  process.exit(0);
}

createAdmin().catch((err) => {
  console.error("❌ Error creating admin:", err);
  process.exit(1);
});
