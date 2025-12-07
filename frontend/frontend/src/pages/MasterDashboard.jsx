import axios from "axios";
import React, { useEffect, useState } from "react";

const MasterDashboard = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [systemStatus, setSystemStatus] = useState(null);

  // Formulario para crear restaurante
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    telefono: "",
    direccion: "",
  });

  const MASTER_API_URL = "http://localhost:3000/api";

  useEffect(() => {
    loadRestaurants();
    loadSystemStatus();
  }, []);

  const loadRestaurants = async () => {
    try {
      const response = await axios.get(`${MASTER_API_URL}/restaurants`);
      setRestaurants(response.data);
    } catch (error) {
      console.error("Error cargando restaurantes:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSystemStatus = async () => {
    try {
      const response = await axios.get(`${MASTER_API_URL}/system/status`);
      setSystemStatus(response.data);
    } catch (error) {
      console.error("Error cargando estado del sistema:", error);
    }
  };

  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${MASTER_API_URL}/restaurants`, formData);
      setFormData({
        nombre: "",
        email: "",
        password: "",
        telefono: "",
        direccion: "",
      });
      setShowCreateForm(false);
      loadRestaurants();
      loadSystemStatus();
    } catch (error) {
      console.error("Error creando restaurante:", error);
      alert("Error creando restaurante: " + error.response?.data?.error);
    }
  };

  const handleRestartInstance = async (restaurantId) => {
    try {
      await axios.post(`${MASTER_API_URL}/restaurants/${restaurantId}/restart`);
      loadRestaurants();
      loadSystemStatus();
    } catch (error) {
      console.error("Error reiniciando instancia:", error);
      alert("Error reiniciando instancia");
    }
  };

  const handleToggleActive = async (restaurant) => {
    try {
      await axios.put(`${MASTER_API_URL}/restaurants/${restaurant.id}`, {
        ...restaurant,
        activo: !restaurant.activo,
      });
      loadRestaurants();
      loadSystemStatus();
    } catch (error) {
      console.error("Error actualizando restaurante:", error);
      alert("Error actualizando restaurante");
    }
  };

  const handleDeleteRestaurant = async (restaurantId) => {
    if (
      !window.confirm(
        "¿Estás seguro de que quieres eliminar este restaurante? Esta acción no se puede deshacer."
      )
    ) {
      return;
    }

    try {
      await axios.delete(`${MASTER_API_URL}/restaurants/${restaurantId}`);
      loadRestaurants();
      loadSystemStatus();
    } catch (error) {
      console.error("Error eliminando restaurante:", error);
      alert("Error eliminando restaurante");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando panel de control...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Panel de Control Maestro
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Sistema Multi-Tenancy Gus Restaurant Group
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Nuevo Restaurante
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estado del Sistema */}
        {systemStatus && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Estado del Sistema
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {systemStatus.totalRestaurants}
                </div>
                <div className="text-sm text-gray-600">Total Restaurantes</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {systemStatus.activeInstances}
                </div>
                <div className="text-sm text-gray-600">Instancias Activas</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {systemStatus.masterPort}
                </div>
                <div className="text-sm text-gray-600">Puerto Maestro</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {systemStatus.totalRestaurants - systemStatus.activeInstances}
                </div>
                <div className="text-sm text-gray-600">Inactivos</div>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Restaurantes */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Restaurantes Registrados
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Restaurante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subdominio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Puerto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {restaurants.map((restaurant) => (
                  <tr key={restaurant.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {restaurant.nombre}
                        </div>
                        <div className="text-sm text-gray-500">
                          {restaurant.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {restaurant.subdominio}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {restaurant.puerto}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className={`w-2 h-2 rounded-full mr-2 ${
                            restaurant.instanceActive
                              ? "bg-green-400"
                              : "bg-red-400"
                          }`}
                        ></div>
                        <span
                          className={`text-sm ${
                            restaurant.instanceActive
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {restaurant.instanceActive ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <a
                          href={restaurant.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Acceder
                        </a>
                        <button
                          onClick={() => handleRestartInstance(restaurant.id)}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          Reiniciar
                        </button>
                        <button
                          onClick={() => handleToggleActive(restaurant)}
                          className={`${
                            restaurant.activo
                              ? "text-red-600 hover:text-red-900"
                              : "text-green-600 hover:text-green-900"
                          }`}
                        >
                          {restaurant.activo ? "Desactivar" : "Activar"}
                        </button>
                        <button
                          onClick={() => handleDeleteRestaurant(restaurant.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal para crear restaurante */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Crear Nuevo Restaurante
              </h3>
              <form onSubmit={handleCreateRestaurant}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Restaurante
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) =>
                      setFormData({ ...formData, telefono: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                  </label>
                  <textarea
                    value={formData.direccion}
                    onChange={(e) =>
                      setFormData({ ...formData, direccion: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Crear Restaurante
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterDashboard;
