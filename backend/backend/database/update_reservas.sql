-- Agregar columna total a la tabla reservas
ALTER TABLE reservas ADD COLUMN total DECIMAL(10,2) DEFAULT 0.00;

-- Crear tabla para los platos de cada reserva
CREATE TABLE IF NOT EXISTS reserva_platos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reserva_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    branch_id INT NOT NULL,
    FOREIGN KEY (reserva_id) REFERENCES reservas(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
); 