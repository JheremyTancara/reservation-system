import api from "../config/api";
import axios from "axios";

// Funciones para usuarios regulares (saas-users)
export const registrarUsuario = async (datos) => {
  return await api.post("/saas-users/register", datos);
};

export const loginUsuario = async ({ email, password }) => {
  if (!email || !password) {
    throw new Error("Email y password son requeridos");
  }
  
  const payload = { 
    email: String(email).trim(), 
    password: String(password).trim()
  };
  
  try {
    const response = await api.post("/saas-users/login", payload);
    return response;
  } catch (error) {
    console.error("❌ Error en loginUsuario:", error);
    throw error;
  }
};

// Funciones para restaurantes (auth)
export const loginRestaurante = async ({ emailOrName, password, puerto }) => {
  if (!emailOrName || !password) {
    throw new Error("Email y password son requeridos");
  }
  
  const payload = { 
    emailOrName: String(emailOrName).trim(), 
    password: String(password).trim(),
    puerto: puerto ? String(puerto).trim() : null
  };
  
  try {
    // Si estamos en un puerto de tenant (3001+), usar la API del tenant directamente
    const currentPort = window.location.port || "5173";
    const isRestaurantPort = parseInt(currentPort) >= 3001;
    
    if (isRestaurantPort && puerto) {
      // Conectar directamente al tenant en su puerto
      const tenantApiUrl = `http://localhost:${puerto}/api`;
      const response = await axios.post(`${tenantApiUrl}/auth/login`, payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response;
    } else {
      // Usar el master server (puerto 3000)
      const response = await api.post("/auth/login", payload);
      return response;
    }
  } catch (error) {
    console.error("❌ Error en loginRestaurante:", error);
    throw error;
  }
};

export const registrarRestaurante = async (datos) => {
  return await api.post("/auth/register", datos);
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

// Funciones para perfil de usuario
export const obtenerPerfil = async () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No hay token");
  
  return await api.get("/saas-users/profile", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const actualizarPerfil = async (datos, foto) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No hay token");
  
  const formData = new FormData();
  formData.append("full_name", datos.full_name);
  if (datos.phone) formData.append("phone", datos.phone);
  if (foto) formData.append("profile_photo", foto);
  
  return await api.put("/saas-users/profile", formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
};

// Funciones para suscripciones de restaurantes
export const registrarRestauranteConPago = async (formData) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No hay token");
  
  return await api.post("/subscriptions/register-restaurant", formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
};

export const obtenerSolicitudes = async () => {
  return await api.get("/subscriptions/subscription-requests");
};

// Obtener restaurantes pendientes directamente
export const obtenerRestaurantesPendientes = async () => {
  const response = await fetch('http://localhost:3000/api/restaurants');
  const data = await response.json();
  const pending = data.filter(r => r.subscription_status === 'pending');
  return { data: { requests: pending } };
};

export const aprobarSolicitud = async (id, adminNotes) => {
  return await api.post(`/subscriptions/approve-subscription/${id}`, { admin_notes: adminNotes });
};

export const rechazarSolicitud = async (id, adminNotes) => {
  return await api.post(`/subscriptions/reject-subscription/${id}`, { admin_notes: adminNotes });
};

// Obtener todos los usuarios (para admin)
export const obtenerTodosUsuarios = async () => {
  return await api.get("/saas-users/all");
};