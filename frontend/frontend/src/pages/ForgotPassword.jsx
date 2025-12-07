import { useState } from "react";
import { Link } from "react-router-dom";
import { solicitarRecuperacion } from "../services/userService";
import restaurantBg from "../assets/pizza_dashboard.jpg";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const handleEnviar = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    try {
      await solicitarRecuperacion(email);
      setMensaje("Correo enviado. Revisa tu bandeja de entrada.");
    } catch (err) {
      setError(
        err.response?.data?.error || "Error al enviar el correo"
      );
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
      style={{ backgroundImage: `url(${restaurantBg})` }}
    >
      <div className="absolute inset-0 bg-white/95"></div>
      <div className="relative z-10 max-w-md w-full">
        {/* Header */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full border-2 border-orange-500 flex items-center justify-center">
              <span className="text-orange-500 text-xl font-bold">🍔</span>
            </div>
            <span className="text-2xl font-bold text-orange-500">
              MESACLOUD
            </span>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
            Recuperar Contraseña
          </h2>
          <p className="text-gray-600 text-sm mb-6 text-center">
            Ingresa tu correo electrónico y te enviaremos un enlace para
            restablecer tu contraseña
          </p>

          {mensaje && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded">
              {mensaje}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleEnviar} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <input
                type="email"
                placeholder="Ingresa tu correo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg transition font-medium"
            >
              Enviar enlace
            </button>
          </form>

          <div className="text-center mt-6">
            <Link
              to="/login"
              className="text-sm text-orange-600 hover:underline"
            >
              ← Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

