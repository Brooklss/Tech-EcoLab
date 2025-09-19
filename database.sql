-- Create database (run this manually in PostgreSQL)
-- CREATE DATABASE tech_ecolab;

-- Connect to tech_ecolab database and run the following:

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    stock_quantity INTEGER DEFAULT 0,
    image_url VARCHAR(500),
    specifications JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample categories
INSERT INTO categories (name, description) VALUES
('Desktops', 'Complete desktop computers and workstations'),
('Laptops', 'Portable computers and notebooks'),
('Monitors', 'Computer displays and screens'),
('Cables', 'Various computer cables and connectors'),
('Peripherals', 'Keyboards, mice, and other input devices'),
('Storage', 'Hard drives, SSDs, and storage solutions'),
('Components', 'CPUs, GPUs, RAM, and other computer parts')
ON CONFLICT (name) DO NOTHING;

-- Insert sample products
INSERT INTO products (name, description, price, category_id, stock_quantity, image_url, specifications) VALUES
('Gaming Desktop Pro', 'High-performance gaming desktop with RTX 4070', 1299.99, 1, 15, '/images/gaming-desktop.jpg', '{"cpu": "Intel i7-13700K", "gpu": "RTX 4070", "ram": "32GB DDR5", "storage": "1TB NVMe SSD"}'),
('MacBook Air M2', 'Apple MacBook Air with M2 chip', 1099.99, 2, 8, '/images/macbook-air.jpg', '{"cpu": "Apple M2", "ram": "8GB", "storage": "256GB SSD", "display": "13.6-inch Liquid Retina"}'),
('4K UltraWide Monitor', '34-inch curved 4K monitor for professionals', 599.99, 3, 12, '/images/ultrawide-monitor.jpg', '{"size": "34-inch", "resolution": "3440x1440", "refresh_rate": "100Hz", "panel": "IPS"}'),
('USB-C Hub', 'Multi-port USB-C hub with HDMI and USB 3.0', 49.99, 4, 25, '/images/usb-c-hub.jpg', '{"ports": ["USB-C", "HDMI", "USB 3.0 x3", "SD Card"], "power_delivery": "100W"}'),
('Mechanical Keyboard', 'RGB mechanical keyboard with Cherry MX switches', 129.99, 5, 20, '/images/mechanical-keyboard.jpg', '{"switches": "Cherry MX Red", "backlight": "RGB", "connectivity": "USB-C", "layout": "Full-size"}'),
('Wireless Gaming Mouse', 'High-precision wireless gaming mouse', 79.99, 5, 18, '/images/gaming-mouse.jpg', '{"dpi": "16000", "connectivity": "Wireless 2.4GHz", "battery": "70 hours", "buttons": "6 programmable"}'),
('1TB NVMe SSD', 'High-speed NVMe SSD for fast storage', 89.99, 6, 30, '/images/nvme-ssd.jpg', '{"capacity": "1TB", "interface": "PCIe 4.0", "read_speed": "7000 MB/s", "write_speed": "6000 MB/s"}'),
('32GB DDR5 RAM', 'High-performance DDR5 memory kit', 149.99, 7, 22, '/images/ddr5-ram.jpg', '{"capacity": "32GB", "speed": "DDR5-5600", "latency": "CL36", "modules": "2x16GB"}'),
('Gaming Laptop RTX 4060', 'Portable gaming laptop with RTX 4060', 999.99, 2, 10, '/images/gaming-laptop.jpg', '{"cpu": "Intel i5-13500H", "gpu": "RTX 4060", "ram": "16GB DDR5", "storage": "512GB SSD"}'),
('27-inch 4K Monitor', 'Professional 4K monitor with color accuracy', 399.99, 3, 14, '/images/4k-monitor.jpg', '{"size": "27-inch", "resolution": "3840x2160", "color_gamut": "99% sRGB", "panel": "IPS"}');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
