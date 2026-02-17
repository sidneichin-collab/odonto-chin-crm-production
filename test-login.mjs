const BASE_URL = 'http://localhost:3003';

async function testLogin() {
  try {
    console.log('🔐 Testando login...');
    
    const response = await fetch(`${BASE_URL}/api/trpc/auth.login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: {
          email: 'admin@odontochin.com',
          password: 'Admin@2026'
        }
      })
    });

    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.result && data.result.data && data.result.data.json && data.result.data.json.success) {
      console.log('✅ Login bem-sucedido!');
    } else if (data.error) {
      console.log('❌ Erro no login:', data.error.json.message);
    }
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

testLogin();
