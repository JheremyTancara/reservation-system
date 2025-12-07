import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';
import fondo from '../assets/fondo-dashboard.png';
import logo from '../assets/logo-guss.png';

const ResetPassword = () => {
  const { token } = useParams();
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    setMensaje('');
    setError('');

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/users/reset-password`, { token, nuevaPassword });
      setMensaje('¡Contraseña actualizada! Redirigiendo al login...');
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar contraseña');
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6 bg-cover bg-center" style={{ backgroundImage: `url(${fondo})` }}>
      <div className="max-w-md mx-auto bg-white/90 backdrop-blur p-6 rounded-xl shadow-lg">
        <div className="flex justify-center mb-6">
          <img src={logo} alt="Logo Gus's" className="w-32" />
        </div>
        <h2 className="text-2xl font-bold text-orange-600 mb-4 text-center">Nueva Contraseña</h2>

        {mensaje && <p className="text-green-600 text-sm mb-4 text-center">{mensaje}</p>}
        {error && <p className="text-red-600 text-sm mb-4 text-center">{error}</p>}

        <form onSubmit={handleReset} className="space-y-4">
          <input
            type="password"
            placeholder="Escribe la nueva contraseña"
            className="w-full px-4 py-2 border rounded focus:ring-2 ring-orange-500"
            value={nuevaPassword}
            onChange={(e) => setNuevaPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded transition"
          >
            Cambiar contraseña
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;

