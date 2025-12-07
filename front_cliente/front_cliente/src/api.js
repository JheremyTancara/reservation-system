import axios from "axios";

// Función para obtener la URL base de la API dinámicamente
const getApiUrl = () => {
  const port = window.location.port;
  return `http://localhost:${port}/api`;
};

export const getSucursales = () => {
  const API_URL = getApiUrl();
  return axios.get(`${API_URL}/branches`);
};

export const getMenus = (branchId) => {
  const API_URL = getApiUrl();
  return axios.get(`${API_URL}/menu?branch_id=${branchId}`);
};

export const getRestaurantInfo = () => {
  const API_URL = getApiUrl();
  return axios.get(`${API_URL}/tenant/info`);
};

export const createReservation = (reservationData) => {
  const API_URL = getApiUrl();
  return axios.post(`${API_URL}/reservas`, reservationData);
};

export const getAvailableTables = (branchId) => {
  const API_URL = getApiUrl();
  return axios.get(`${API_URL}/mesas?branch_id=${branchId}`);
};
