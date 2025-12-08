import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getRestaurantLogo } from "../utils/restaurantLogos";

// Usar logo desde public
const logoMesaCloud = "/logo-guss.png"; // temporal hasta que subas el logo correcto

const Restaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/restaurants");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        if (Array.isArray(data)) {
          setRestaurants(data);
        } else if (data.restaurants && Array.isArray(data.restaurants)) {
          setRestaurants(data.restaurants);
        } else {
          console.error("La respuesta no es un array:", data);
          setRestaurants([]);
        }
      } catch (error) {
        console.error("Error al cargar restaurantes:", error);
        setError(error.message);
        setRestaurants([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Cargando restaurantes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="bg-white shadow-lg rounded-lg p-8 max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error al cargar</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to="/"
            className="px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition"
          >
            Volver al Inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src={logoMesaCloud} 
              alt="MesaCloud Logo" 
              className="w-12 h-12 object-contain"
            />
            <span className="text-2xl font-bold text-gray-800">MesaCloud</span>
          </Link>
          <nav className="flex items-center space-x-4">
            <Link
              to="/"
              className="text-gray-600 hover:text-orange-600 font-medium transition"
            >
              Inicio
            </Link>
            <Link
              to="/login"
              className="px-4 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition"
            >
              Iniciar Sesión
            </Link>
          </nav>
        </div>
      </header>

      {/* Contenido Principal */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
            Restaurantes Registrados
          </h1>
          <p className="text-xl text-gray-600">
            {restaurants.length} restaurante{restaurants.length !== 1 ? "s" : ""} usando MesaCloud
          </p>
        </div>

        {restaurants.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center max-w-2xl mx-auto">
            <div className="text-gray-400 text-6xl mb-6">🍽️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              No hay restaurantes registrados
            </h2>
            <p className="text-gray-600 mb-8">
              Sé el primero en unirte a nuestra plataforma
            </p>
            <Link
              to="/register"
              className="inline-block px-8 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition"
            >
              Registrar Restaurante
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {restaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition-all transform hover:-translate-y-2"
              >
                {/* Header Card */}
                <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <img
                      src={getRestaurantLogo(restaurant.nombre)}
                      alt={`${restaurant.nombre} logo`}
                      className="w-16 h-16 object-contain bg-white rounded-full p-2"
                      onError={(e) => {
                        e.target.src = logoMesaCloud;
                      }}
                    />
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        restaurant.activo
                          ? "bg-green-500 text-white"
                          : "bg-gray-500 text-white"
                      }`}
                    >
                      {restaurant.activo ? "✓ Activo" : "✗ Inactivo"}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{restaurant.nombre}</h3>
                  <p className="text-orange-100 text-sm">{restaurant.email}</p>
                </div>

                {/* Body Card */}
                <div className="p-6 space-y-3">
                  <div className="flex items-start space-x-3">
                    <span className="text-orange-500 text-xl">📍</span>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">DIRECCIÓN</p>
                      <p className="text-gray-700">{restaurant.direccion}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <span className="text-orange-500 text-xl">📞</span>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">TELÉFONO</p>
                      <p className="text-gray-700">{restaurant.telefono}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <span className="text-orange-500 text-xl">🌐</span>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">SUBDOMINIO</p>
                      <p className="text-orange-600 font-semibold">
                        {restaurant.subdominio}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <span className="text-orange-500 text-xl">🔌</span>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">PUERTO</p>
                      <p className="text-gray-700">{restaurant.puerto}</p>
                    </div>
                  </div>

                  {restaurant.instanceActive !== undefined && (
                    <div className="flex items-center space-x-2 pt-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          restaurant.instanceActive ? "bg-green-500 animate-pulse" : "bg-gray-400"
                        }`}
                      ></div>
                      <span className="text-sm text-gray-600">
                        Instancia {restaurant.instanceActive ? "en línea" : "detenida"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer Card */}
                <div className="p-6 bg-gray-50 border-t">
                  {restaurant.activo && restaurant.url ? (
                    <a
                      href={restaurant.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center px-4 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition"
                    >
                      🌐 Visitar Sitio
                    </a>
                  ) : (
                    <button
                      disabled
                      className="block w-full text-center px-4 py-3 bg-gray-300 text-gray-500 rounded-lg font-semibold cursor-not-allowed"
                    >
                      Restaurante Inactivo
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img 
              src={logoMesaCloud} 
              alt="MesaCloud Logo" 
              className="w-10 h-10 object-contain"
            />
            <span className="text-xl font-bold">MesaCloud</span>
          </div>
          <p className="text-gray-400 mb-4">
            © 2025 MesaCloud. Sistema de Gestión de Restaurantes.
          </p>
          <div className="space-x-4">
            <Link to="/" className="text-orange-500 hover:text-orange-400">
              Inicio
            </Link>
            <Link to="/register" className="text-orange-500 hover:text-orange-400">
              Registrarse
            </Link>
            <Link to="/login" className="text-orange-500 hover:text-orange-400">
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Restaurants;



