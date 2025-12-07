import axios from "axios";
import { useMemo } from "react";

export const useApi = () => {
  const api = useMemo(() => {
    const port = window.location.port;
    const baseURL = `http://localhost:${port}/api`;

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