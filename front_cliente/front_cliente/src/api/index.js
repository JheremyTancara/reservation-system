import axios from "axios";

// Configuración de axios - Siempre usar el backend del puerto actual
const port = window.location.port || 3000;
const API_URL = `http://localhost:${port}/`;

console.log("API URL:", API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
  timeout: 10000,
});

// Interceptor para logging
api.interceptors.request.use((request) => {
  console.log("Iniciando petición a:", request.url);
  console.log("Headers:", request.headers);
  return request;
});

api.interceptors.response.use(
  (response) => {
    console.log("Respuesta recibida:", {
      status: response.status,
      headers: response.headers,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error("Error en la petición:", {
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
      config: error.config,
    });
    if (error.response?.data?.includes("<!DOCTYPE html>")) {
      throw new Error(
        "El servidor devolvió una página HTML en lugar de datos JSON. Verifica que el servidor esté funcionando correctamente."
      );
    }
    return Promise.reject(error);
  }
);

// Funciones para obtener datos
export const fetchBranches = async () => {
  try {
    console.log("Intentando obtener sucursales...");
    const response = await api.get("/branches");

    if (!response.data) {
      throw new Error("No se recibieron datos del servidor");
    }

    if (!Array.isArray(response.data)) {
      console.error("La respuesta no es un array:", response.data);
      if (
        typeof response.data === "string" &&
        response.data.includes("<!DOCTYPE html>")
      ) {
        throw new Error(
          "El servidor devolvió una página HTML en lugar de datos JSON. Verifica que el servidor esté funcionando correctamente."
        );
      }
      throw new Error("Formato de respuesta inválido");
    }

    return response.data;
  } catch (error) {
    console.error("Error al obtener sucursales:", error);
    if (error.response) {
      // El servidor respondió con un código de error
      throw new Error(
        `Error del servidor: ${error.response.status} - ${
          error.response.data?.error || "Error desconocido"
        }`
      );
    } else if (error.request) {
      // La petición fue hecha pero no se recibió respuesta
      throw new Error(
        "No se pudo conectar con el servidor. Verifica que el backend esté funcionando."
      );
    } else {
      // Error al configurar la petición
      throw error;
    }
  }
};

export const fetchMenu = async (branchId) => {
  try {
    const response = await api.get(`/menu/${branchId}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener el menú:", error);
    throw error;
  }
};

export const fetchCategories = async (branchId) => {
  try {
    const response = await api.get(`/categorias/${branchId}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    throw error;
  }
};

export const fetchReservations = async (branchId) => {
  try {
    const response = await api.get(`/reservas/${branchId}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener reservas:", error);
    throw error;
  }
};

export const createReservation = async (reservationData) => {
  try {
    const response = await api.post("/reservas", reservationData);
    return response.data;
  } catch (error) {
    console.error("Error al crear reserva:", error);
    throw error;
  }
};

// Obtener mesas disponibles del backend
export const fetchAvailableTables = async (branchId) => {
  try {
    console.log("Obteniendo mesas disponibles para branch:", branchId);
    const response = await api.get(`/mesas/${branchId}`);
    console.log("Respuesta de mesas disponibles:", response.data);

    if (response.data && Array.isArray(response.data)) {
      return response.data;
    } else {
      console.error("Formato de respuesta de mesas inválido:", response.data);
      throw new Error("Error al cargar las mesas disponibles");
    }
  } catch (error) {
    console.error("Error al obtener mesas:", error);
    throw error;
  }
};
