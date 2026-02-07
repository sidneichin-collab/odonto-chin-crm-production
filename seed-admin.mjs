import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import bcrypt from 'bcrypt';
import { users, tenants } from './drizzle/schema.ts';

// Get DATABASE_URL from environment
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

// Create postgres client
const client = postgres(DATABASE_URL, { ssl: 'require' });
const db = drizzle(client);

async function createSuperAdmin() {
  try {
    console.log('🚀 Creating super-admin user...');

    // Hash password
    const hashedPassword = await bcrypt.hash('Admin123!', 10);

    // Create main tenant
    console.log('📦 Creating main tenant...');
    const [tenant] = await db.insert(tenants).values({
      name: 'Odonto Chin Master',
      email: 'admin@odontochin.com',
      phone: '+1234567890',
      address: 'Oficina Central',
      isActive: true,
    }).returning();

    console.log(`✅ Tenant created: ${tenant.name} (ID: ${tenant.id})`);

    // Create super-admin user
    console.log('👤 Creating super-admin user...');
    const [admin] = await db.insert(users).values({
      email: 'admin@odontochin.com',
      name: 'Super Admin',
      password: hashedPassword,
      role: 'super-admin',
      tenantId: tenant.id,
      isActive: true,
    }).returning();

    console.log(`✅ Super-admin created: ${admin.name} (ID: ${admin.id})`);
    console.log('\n📧 Login Credentials:');
    console.log('   Email: admin@odontochin.com');
    console.log('   Password: Admin123!');
    console.log('\n⚠️  IMPORTANT: Change password after first login!\n');

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating super-admin:', error);
    await client.end();
    process.exit(1);
  }
}

createSuperAdmin();
