import React, { useState } from 'react';
import axios from 'axios';

const ReservaForm = () => {
  const [formData, setFormData] = useState({
    cliente_nombre: '',
    personas: '',
    fecha: '',
    hora: '',
    tenant_id: 1, // Ajusta esto según sea necesario
    mesa_id: 1 // Ajusta esto según sea necesario
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('https://backend-swqp.onrender.com/api/reservas', formData);
      alert('Reserva guardada con éxito');
    } catch (error) {
      console.error('Error al guardar la reserva:', error);
      alert('Error al guardar la reserva');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" name="cliente_nombre" placeholder="Nombre del cliente" onChange={handleChange} required />
      <input type="number" name="personas" placeholder="Número de personas" onChange={handleChange} required />
      <input type="date" name="fecha" onChange={handleChange} required />
      <input type="time" name="hora" onChange={handleChange} required />
      <button type="submit">Reservar</button>
    </form>
  );
};

export default ReservaForm; 