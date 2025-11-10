
CREATE DATABASE dentafunnel_db; 
USE dentafunnel_db;

-- Crear la tabla para almacenar la información de los pacientes
CREATE TABLE Pacientes (
    paciente_id INT PRIMARY KEY AUTO_INCREMENT,
    nombre_completo VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefono VARCHAR(20) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear la tabla para gestionar los horarios disponibles
CREATE TABLE Disponibilidad (
    slot_id INT PRIMARY KEY AUTO_INCREMENT,
    fecha_hora_inicio DATETIME NOT NULL,
    esta_disponible BOOLEAN DEFAULT TRUE
);

-- Crear la tabla principal que relaciona pacientes y horarios
CREATE TABLE Citas (
    cita_id INT PRIMARY KEY AUTO_INCREMENT,
    paciente_id INT,
    slot_id INT,
    estado VARCHAR(50) DEFAULT 'Confirmada',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES Pacientes(paciente_id),
    FOREIGN KEY (slot_id) REFERENCES Disponibilidad(slot_id)
);