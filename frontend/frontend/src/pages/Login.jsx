import { useState } from "react";
import { Link } from "react-router-dom";
import "swiper/css";
import "swiper/css/effect-fade";
import { Autoplay, EffectFade } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import comida1 from "../../assets/comida1.jpg";
import comida2 from "../../assets/comida2.jpg";
import comida3 from "../../assets/comida3.jpg";
import { loginUsuario, loginRestaurante } from "../services/userService";

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
      const currentPort = window.location.port || "5173";
      const currentPortStr = String(currentPort).trim();
      const isMainPort = currentPortStr === "5173" || currentPortStr === "5174";
      const isRestaurantPort = parseInt(currentPortStr) >= 3001;
      
      console.log("🔍 Puerto actual detectado:", currentPortStr);
      console.log("🔍 Es puerto principal:", isMainPort);
      console.log("🔍 Es puerto de restaurante:", isRestaurantPort);
      
      let res;
      
      // Si es puerto principal (5173), usar login de usuarios regulares
      if (isMainPort) {
        const loginData = { 
          email: trimmedEmailOrName, 
          password: trimmedPassword
        };
        
        res = await loginUsuario(loginData);
        
        // Guardar datos del usuario
        localStorage.setItem("usuario", JSON.stringify(res.data.user));
        localStorage.setItem("token", res.data.token);
        setMensaje("Inicio de sesión exitoso");
        
        // Redirigir a la página principal (localhost:5173)
        setTimeout(() => {
          window.location.href = "http://localhost:5173/";
        }, 1000);
        return;
      }
      
      // Si es puerto de restaurante (3001+), usar login de restaurante
      if (isRestaurantPort) {
      const loginData = { 
        emailOrName: trimmedEmailOrName, 
        password: trimmedPassword,
          puerto: currentPortStr
      };
      
        res = await loginRestaurante(loginData);
      
      console.log("==========================================");
      console.log("✅ RESPUESTA COMPLETA DEL SERVIDOR:");
      console.log("==========================================");
      console.log("res.data:", res.data);
      console.log("res.data.user:", res.data.user);
      console.log("res.data.user.puerto:", res.data.user.puerto);
      console.log("Tipo de puerto:", typeof res.data.user.puerto);
      console.log("==========================================");

      if (!res.data || !res.data.user) {
        setError("Respuesta inválida del servidor");
        return;
      }

      // La verificación del puerto ya se hizo en el backend ANTES de verificar la contraseña
      // Si llegamos aquí, el login fue exitoso y el puerto coincide
      const userPort = res.data.user.puerto;
      
      console.log(`🔍 Puerto extraído del usuario:`, {
        puerto: userPort,
        tipo: typeof userPort,
        esNulo: userPort === null,
        esUndefined: userPort === undefined,
        valor: userPort
      });
      
      if (!userPort || userPort === null || userPort === undefined || userPort === "null" || userPort === "undefined" || userPort === 3000) {
        console.error("❌ El usuario no tiene puerto asignado o puerto inválido:", userPort);
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
      console.log(`   - Puerto actual: ${currentPortStr}`);
      console.log(`   - URL de redirección: http://localhost:${userPortStr}/dashboard`);

      // Redirigir al dashboard del puerto específico del restaurante
      setTimeout(() => {
        // Siempre redirigir al puerto del restaurante (3001, 3002, etc.)
        const targetUrl = `http://localhost:${userPortStr}/dashboard`;
        console.log(`🚀 EJECUTANDO REDIRECCIÓN A: ${targetUrl}`);
        console.log(`🚀 Tipo de userPortStr: ${typeof userPortStr}, valor: "${userPortStr}"`);
        
        // Usar window.location.replace en lugar de href para forzar la redirección
        alert(`Redirigiendo a: ${targetUrl}`); // Para confirmar la URL
        window.location.replace(targetUrl);
      }, 1500);
      }
    } catch (err) {
      console.error("❌ Error completo en login:", err);
      console.error("❌ Error response:", err.response?.data);
      console.error("❌ Error status:", err.response?.status);
      console.error("❌ Error URL:", err.config?.url);
      
      // Obtener mensaje de error del servidor
      let errorMsg = err.response?.data?.error || err.message || "Error al iniciar sesión";
      
      // Si es un error 404, dar un mensaje más específico
      if (err.response?.status === 404) {
        errorMsg = "El servidor no está respondiendo. Por favor, verifica que el servidor esté corriendo en el puerto 3000.";
      }
      
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
                  {(() => {
                    const currentPort = window.location.port || "5173";
                    const isMainPort = currentPort === "5173" || currentPort === "5174";
                    return isMainPort ? "Correo Electrónico" : "Nombre o Correo Electrónico";
                  })()}
                </label>
                <input
                  type={(() => {
                    const currentPort = window.location.port || "5173";
                    const isMainPort = currentPort === "5173" || currentPort === "5174";
                    return isMainPort ? "email" : "text";
                  })()}
                  placeholder={(() => {
                    const currentPort = window.location.port || "5173";
                    const isMainPort = currentPort === "5173" || currentPort === "5174";
                    return isMainPort ? "usuario@correo.com" : "Nombre del restaurante o email";
                  })()}
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
