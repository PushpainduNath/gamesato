-- Seed Default Super Admin User for Gamebite

INSERT INTO admin_users (name, email, role, password_hash, plain_password)
VALUES (
  'Super Admin', 
  'superadmin@gamebite.com', 
  'SUPER_ADMIN', 
  '$2a$10$52kpx.4v1R67lCg/iF0cVeHhJAGbFv1kK1wN1t7b4uP2uT7B2qB6G', -- bcrypt hash of gamebiteadminpassword123
  'gamebiteadminpassword123'
)
ON CONFLICT (email) 
DO UPDATE SET role = 'SUPER_ADMIN', name = 'Super Admin';
