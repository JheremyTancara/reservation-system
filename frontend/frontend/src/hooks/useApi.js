import axios from "axios";
import { useMemo } from "react";

export const useApi = () => {
  const api = useMemo(() => {
    // Detectar puerto correcto del tenant: priorizar el puerto guardado del usuario
    const portActual = window.location.port;
    let portUsuario = null;
    try {
      const storedUser = localStorage.getItem("usuario");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        portUsuario = parsed?.puerto || null;
      }
    } catch (e) {
      console.warn("No se pudo leer usuario de localStorage:", e);
    }
    const basePort = portUsuario || portActual || "3001";
    const baseURL = `http://localhost:${basePort}/api`;

    const instance = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Interceptor para agregar token a las peticiones
    instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          // Asegurar que el header esté correctamente formateado
          if (!config.headers) {
            config.headers = {};
          }
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          console.warn("⚠️ No hay token en localStorage para la petición:", config.url);
        }

        // Si el body es FormData, dejar que el navegador ponga el boundary
        if (config.data instanceof FormData) {
          if (config.headers) {
            delete config.headers["Content-Type"];
          }
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor para manejar errores de autenticación
    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.error("❌ Error 401: Token inválido o expirado");
          localStorage.removeItem("token");
          localStorage.removeItem("usuario");
          // No redirigir, solo dejar que el frontend maneje el error
        } else if (error.response?.status === 403) {
          console.error("❌ Error 403: Acceso denegado", {
            url: error.config?.url,
            details: error.response?.data
          });
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }, []);

  return api;
};