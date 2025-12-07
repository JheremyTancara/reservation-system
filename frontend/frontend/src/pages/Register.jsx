import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registrarUsuario } from "../services/userService";
import comida1 from "../../assets/comida1.jpg";
import comida2 from "../../assets/comida2.jpg";
import comida3 from "../../assets/comida3.jpg";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";

const initialState = {
  nombre: "",
  email: "",
  password: "",
  telefono: "",
  direccion: "",
};

const Register = () => {
  const [formData, setFormData] = useState(initialState);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    if (!formData.nombre.trim() || !formData.email.trim() || !formData.password.trim()) {
      setError("Nombre, email y contraseña son obligatorios");
      return;
    }

    try {
      setLoading(true);
      await registrarUsuario({
        nombre: formData.nombre.trim(),
        email: formData.email.trim(),
        password: formData.password,
        telefono: formData.telefono.trim() || null,
        direccion: formData.direccion.trim() || null,
      });

      setMensaje("Registro exitoso. Redirigiendo al login…");
      setFormData(initialState);

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      console.error("Error registrando usuario:", err);
      const msg = err.response?.data?.error || err.message || "No se pudo completar el registro";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const carruselImgs = [comida1, comida2, comida3];

  return (
    <div className="min-h-screen flex">
      <div className="hidden md:flex md:w-1/2 items-center justify-center bg-black">
        <Swiper
          effect="fade"
          autoplay={{ delay: 3000 }}
          modules={[EffectFade, Autoplay]}
          loop
          className="w-full h-full"
        >
          {carruselImgs.map((img, i) => (
            <SwiperSlide key={i}>
              <img src={img} alt={`Slide ${i + 1}`} className="w-full h-full object-cover" />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <div className="flex flex-col justify-center items-center w-full md:w-1/2 px-6 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="flex justify-between items-center mb-8">
            <Link
              to="/"
              className="flex items-center space-x-2 hover:opacity-80 transition cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full border-2 border-orange-500 flex items-center justify-center">
                <span className="text-orange-500 text-xl font-bold">🍔</span>
              </div>
              <span className="text-2xl font-bold text-orange-500">MESACLOUD</span>
            </Link>
            <Link to="/login" className="text-sm text-orange-600 hover:underline">
              ¿Ya tienes cuenta? Inicia sesión
            </Link>
          </div>

          <div className="bg-white/90 backdrop-blur p-8 rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold mb-2 text-gray-800">Crear cuenta</h2>
            <p className="text-gray-500 text-sm mb-6">
              Registra tu restaurante para comenzar a gestionar reservas, menú y mesas.
            </p>

            {mensaje && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                {mensaje}
              </div>
            )}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del restaurante *</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Ej: Guss Restobar"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Correo electrónico *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="restaurante@correo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña *</label>
                <div className="relative">
                  <input
                    type={mostrarPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="********"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-orange-600 hover:underline"
                    onClick={(e) => {
                      e.preventDefault();
                      setMostrarPassword((v) => !v);
                    }}
                  >
                    {mostrarPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="+51 999 999 999"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Av. Siempre Viva 742"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition font-medium disabled:opacity-60"
              >
                {loading ? "Registrando..." : "Crear cuenta"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
