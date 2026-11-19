CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_number VARCHAR(20) UNIQUE NOT NULL,
  capacity INT NOT NULL DEFAULT 2,
  monthly_rent DECIMAL(10,2) NOT NULL DEFAULT 0,
  status ENUM('vacant','occupied','maintenance') NOT NULL DEFAULT 'vacant',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tenants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  contact_number VARCHAR(20),
  email VARCHAR(100),
  guardian_name VARCHAR(100),
  guardian_contact VARCHAR(20),
  room_id INT NULL,
  move_in_date DATE NOT NULL,
  move_out_date DATE NULL,
  status ENUM('active','moved_out') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  method ENUM('cash','gcash') NOT NULL DEFAULT 'cash',
  gcash_reference VARCHAR(50) NULL,
  period_month VARCHAR(7) NOT NULL,
  paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes VARCHAR(255),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
