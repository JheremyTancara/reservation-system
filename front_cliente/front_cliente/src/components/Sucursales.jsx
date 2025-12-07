import React, { useEffect, useState } from 'react';
import { getSucursales } from '../api';

const Sucursales = () => {
  const [sucursales, setSucursales] = useState([]);

  useEffect(() => {
    getSucursales()
      .then(response => setSucursales(response.data))
      .catch(error => console.error('Error:', error));
  }, []);

  return (
    <div>
      {sucursales.map(sucursal => (
        <div key={sucursal.id}>{sucursal.nombre}</div>
      ))}
    </div>
  );
};

export default Sucursales; 