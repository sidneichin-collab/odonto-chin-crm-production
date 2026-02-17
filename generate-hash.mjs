import bcryptjs from 'bcryptjs';

async function generateHash() {
  const password = 'Admin@2026';
  const hash = await bcryptjs.hash(password, 10);
  console.log('Password:', password);
  console.log('Hash:', hash);
}

generateHash();
