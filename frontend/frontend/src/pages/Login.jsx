import { useState } from "react";
import { Link } from "react-router-dom";
import "swiper/css";
import "swiper/css/effect-fade";
import { Autoplay, EffectFade } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import comida1 from "../../assets/comida1.jpg";
import comida2 from "../../assets/comida2.jpg";
import comida3 from "../../assets/comida3.jpg";
import { loginUsuario } from "../services/userService";

const Login = () => {
  const [emailOrName, setEmailOrName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  // Carrusel de imágenes
  const carruselImgs = [comida1, comida2, comida3];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    // Validación manual
    const trimmedEmailOrName = emailOrName.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmailOrName) {
      setError("Email o nombre del restaurante es requerido");
      return;
    }

    if (!trimmedPassword) {
      setError("Password es requerido");
      return;
    }

    try {
      // Obtener puerto actual ANTES de hacer la petición
      const currentPort = window.location.port || "";
      const currentPortStr = String(currentPort).trim();
      
      console.log("🔍 Puerto actual detectado:", currentPortStr);
      console.log("🔍 URL completa:", window.location.href);
      
      const loginData = { 
        emailOrName: trimmedEmailOrName, 
        password: trimmedPassword,
        puerto: currentPortStr // Enviar puerto actual en la petición
      };
      
      console.log("🔐 Intentando login con:", { 
        emailOrName: trimmedEmailOrName, 
        passwordLength: trimmedPassword.length,
        puerto: currentPortStr,
        loginDataKeys: Object.keys(loginData),
        loginData: { ...loginData, password: "***" }
      });
      
      console.log("📤 JSON.stringify del loginData:", JSON.stringify(loginData));
      
      const res = await loginUsuario(loginData);
      
      console.log("✅ Respuesta del servidor:", res.data);

      if (!res.data || !res.data.user) {
        setError("Respuesta inválida del servidor");
        return;
      }

      // La verificación del puerto ya se hizo en el backend ANTES de verificar la contraseña
      // Si llegamos aquí, el login fue exitoso y el puerto coincide
      const userPort = res.data.user.puerto;
      
      if (!userPort || userPort === null || userPort === undefined || userPort === "null" || userPort === "undefined") {
        console.error("❌ El usuario no tiene puerto asignado");
        setError("El usuario no tiene puerto asignado. Contacta al administrador.");
        return;
      }

      // Si llegamos aquí, la verificación pasó, guardar datos
      localStorage.setItem("usuario", JSON.stringify(res.data.user));
      localStorage.setItem("token", res.data.token);

      setMensaje("Inicio de sesión exitoso");

      const userPortStr = String(userPort).trim();
      console.log(`🚀 Preparando redirección:`);
      console.log(`   - Puerto del usuario: ${userPortStr}`);

      // Redirigir al dashboard del tenant
      setTimeout(() => {
        const targetUrl = `http://localhost:${userPortStr}/dashboard`;
        console.log(`🚀 Redirigiendo a: ${targetUrl}`);
        window.location.href = targetUrl;
      }, 1500);
    } catch (err) {
      console.error("❌ Error completo en login:", err);
      console.error("❌ Error response:", err.response?.data);
      console.error("❌ Error status:", err.response?.status);
      
      // Obtener mensaje de error del servidor
      const errorMsg = err.response?.data?.error || err.message || "Error al iniciar sesión";
      
      // Si es un error 403 (acceso denegado), mostrar el mensaje completo
      if (err.response?.status === 403) {
        setError(errorMsg);
        // Limpiar cualquier dato que se haya guardado
        localStorage.removeItem("usuario");
        localStorage.removeItem("token");
      } else {
        setError(errorMsg);
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Carrusel lado izquierdo */}
      <div className="hidden md:flex md:w-1/2 items-center justify-center bg-black">
        <Swiper
          effect="fade"
          autoplay={{ delay: 3000 }}
          modules={[EffectFade, Autoplay]}
          loop={true}
          className="w-full h-full"
        >
          {carruselImgs.map((img, i) => (
            <SwiperSlide key={i}>
              <img
                src={img}
                alt={`Slide ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Formulario lado derecho */}
      <div className="flex flex-col justify-center items-center w-full md:w-1/2 px-6 bg-gray-50 relative">
        <div className="relative z-10 w-full max-w-md">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition cursor-pointer">
              <div className="w-10 h-10 rounded-full border-2 border-orange-500 flex items-center justify-center">
                <span className="text-orange-500 text-xl font-bold">🍔</span>
              </div>
              <span className="text-2xl font-bold text-orange-500">
                MESACLOUD
              </span>
            </Link>
          </div>

          <div className="bg-white/90 backdrop-blur p-8 rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold mb-2 text-gray-800">Bienvenido</h2>

            {mensaje && (
              <p className="text-green-600 text-sm text-center mb-4 p-2 bg-green-50 rounded">
                {mensaje}
              </p>
            )}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm font-semibold mb-1">❌ Error de acceso</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <form 
              onSubmit={handleSubmit} 
              className="space-y-4" 
              noValidate
              onKeyDown={(e) => {
                // Prevenir envío del formulario con Enter si el botón "Mostrar" tiene foco
                if (e.key === "Enter" && e.target.type === "button") {
                  e.preventDefault();
                }
              }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre o Correo Electrónico
                </label>
                <input
                  type="text"
                  placeholder="Nombre del restaurante o email"
                  value={emailOrName}
                  onChange={(e) => {
                    setEmailOrName(e.target.value);
                    setError(""); // Limpiar error al escribir
                  }}
                  className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(""); // Limpiar error al escribir
                    }}
                    className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-orange-600 hover:underline"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowPassword((v) => !v);
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                    }}
                    tabIndex={-1}
                  >
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm text-orange-600 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition font-medium"
              >
                Ingresar
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              ¿No tienes cuenta?{" "}
              <Link
                to="/register"
                className="text-orange-600 font-medium hover:underline"
              >
                Regístrate
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
