import api from "../config/api";

export const registrarUsuario = async (datos) => {
  return await api.post("/auth/register", datos);
};

export const loginUsuario = async ({ emailOrName, password, puerto }) => {
  if (!emailOrName || !password) {
    throw new Error("Email y password son requeridos");
  }
  
  const payload = { 
    emailOrName: String(emailOrName).trim(), 
    password: String(password).trim(),
    puerto: puerto ? String(puerto).trim() : null // Incluir puerto si está disponible
  };
  
  console.log("📤 Enviando datos de login:", { 
    emailOrName: payload.emailOrName, 
    passwordLength: payload.password.length,
    puerto: payload.puerto
  });
  
  try {
    const response = await api.post("/auth/login", payload);
    return response;
  } catch (error) {
    console.error("❌ Error en loginUsuario:", error);
    if (error.response) {
      console.error("❌ Response data:", error.response.data);
      console.error("❌ Response status:", error.response.status);
    }
    throw error;
  }
};

export const solicitarRecuperacion = async (email) => {
  return await api.post("/auth/forgot-password", { email });
};

export const resetearContrasena = async (token, nuevaPassword) => {
  return await api.post("/auth/reset-password", { token, nuevaPassword });
};

export const obtenerRestaurantes = async () => {
  return await api.get("/auth/restaurants");
};

export const obtenerSucursales = async (restaurantId) => {
  return await api.get(`/auth/branches/${restaurantId}`);
};

export const verificarToken = async () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const response = await api.get("/auth/verify", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    return null;
  }
};