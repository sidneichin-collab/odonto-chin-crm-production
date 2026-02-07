-- Create super-admin user
INSERT INTO user (openId, name, email, role, createdAt)
VALUES ('super-admin-001', 'Super Admin', 'admin@odontochin.com', 'super-admin', NOW())
ON DUPLICATE KEY UPDATE 
  name = 'Super Admin',
  role = 'super-admin';

-- Create default clinic
INSERT INTO clinics (name, subdomain, whatsappApiUrl, whatsappApiKey, whatsappInstance, n8nWebhookUrl, createdAt)
VALUES ('Clínica Principal', 'principal', 'http://95.111.240.243:8080', 'OdontoChinSecretKey2026', 'CHINRMREPLIT', '', NOW())
ON DUPLICATE KEY UPDATE 
  name = 'Clínica Principal';

SELECT * FROM user WHERE email = 'admin@odontochin.com';
SELECT * FROM clinics WHERE subdomain = 'principal';
