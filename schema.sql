CREATE TABLE Pacientes (
    paciente_id INT PRIMARY KEY AUTO_INCREMENT,
    nombre_completo VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefono VARCHAR(20) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE Disponibilidad (
    slot_id INT PRIMARY KEY AUTO_INCREMENT,
    fecha_hora_inicio DATETIME NOT NULL,
    esta_disponible BOOLEAN DEFAULT TRUE
);
CREATE TABLE Citas (
    cita_id INT PRIMARY KEY AUTO_INCREMENT,
    paciente_id INT,
    slot_id INT,
    estado VARCHAR(50) DEFAULT 'Confirmada',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES Pacientes(paciente_id),
    FOREIGN KEY (slot_id) REFERENCES Disponibilidad(slot_id)
);