import React, { useEffect, useState } from "react";

const RestaurantSelector = ({ onSelect }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      const port = window.location.port || 3000;
      const response = await fetch(`http://localhost:${port}/api/restaurants`);

      if (!response.ok) {
        throw new Error("Error cargando restaurantes");
      }

      const data = await response.json();
      const activeRestaurants = data.filter(
        (r) => r.activo && r.instanceActive
      );
      setRestaurants(activeRestaurants);
    } catch (error) {
      console.error("Error cargando restaurantes:", error);
      setError("No se pudieron cargar los restaurantes");
    } finally {
      setLoading(false);
    }
  };

  const handleRestaurantClick = (restaurant) => {
    // Redirigir al subdominio del restaurante
    const url = `http://${restaurant.subdominio}.localhost:${restaurant.puerto}`;
    window.location.href = url;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black/50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Cargando restaurantes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black/50">
        <div className="text-center bg-red-900/50 p-8 rounded-lg">
          <h2 className="text-white text-xl mb-4">Error</h2>
          <p className="text-white mb-4">{error}</p>
          <button
            onClick={loadRestaurants}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black/50 p-4">
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <img
            src="/src/assets/logo-guss.png"
            alt="Logo Guss"
            className="w-32 mx-auto mb-4"
          />
          <h1 className="text-white text-3xl font-bold mb-2">
            Gus Restaurant Group
          </h1>
          <p className="text-gray-300 text-lg">
            Selecciona tu restaurante preferido
          </p>
        </div>

        {restaurants.length === 0 ? (
          <div className="text-center">
            <p className="text-white text-lg mb-4">
              No hay restaurantes disponibles en este momento
            </p>
            <button
              onClick={loadRestaurants}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Actualizar
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {restaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                onClick={() => handleRestaurantClick(restaurant)}
                className="bg-white/20 backdrop-blur-sm rounded-lg p-6 cursor-pointer hover:bg-white/30 transition-all duration-200 border border-white/20"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white text-xl font-semibold">
                    {restaurant.nombre}
                  </h3>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                    <span className="text-green-400 text-sm">Activo</span>
                  </div>
                </div>

                <div className="space-y-2 text-gray-300">
                  <p className="text-sm">
                    <span className="font-medium">Subdominio:</span>{" "}
                    {restaurant.subdominio}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Puerto:</span>{" "}
                    {restaurant.puerto}
                  </p>
                  {restaurant.telefono && (
                    <p className="text-sm">
                      <span className="font-medium">Teléfono:</span>{" "}
                      {restaurant.telefono}
                    </p>
                  )}
                  {restaurant.direccion && (
                    <p className="text-sm">
                      <span className="font-medium">Dirección:</span>{" "}
                      {restaurant.direccion}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-white/20">
                  <p className="text-white/80 text-sm">
                    Haz clic para acceder al sistema de reservas y chatbot
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            ¿No ves tu restaurante? Contacta al administrador del sistema.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RestaurantSelector;
