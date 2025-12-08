import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import restaurantImage from "../../assets/image.png";
import { getRestaurantLogo } from "../utils/restaurantLogos";

// Usar logo desde public
const logoMesaCloud = "/logo-guss.png"; // temporal hasta que subas el logo correcto

const Home = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    // Cargar restaurantes desde el backend
    const fetchRestaurants = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/restaurants");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // Asegurarse de que data es un array
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
        setRestaurants([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  // Funciones del carrusel
  const activeRestaurants = restaurants.filter((r) => r.activo);
  const itemsPerSlide = 3;
  const totalSlides = Math.ceil(activeRestaurants.length / itemsPerSlide);
  const canNavigate = activeRestaurants.length > itemsPerSlide;

  const nextSlide = () => {
    if (canNavigate) {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }
  };

  const prevSlide = () => {
    if (canNavigate) {
      setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
    }
  };

  const getCurrentRestaurants = () => {
    const start = currentSlide * itemsPerSlide;
    const end = start + itemsPerSlide;
    return activeRestaurants.slice(start, end);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
      {/* Header con Logo */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src={logoMesaCloud} 
              alt="MesaCloud Logo" 
              className="w-12 h-12 object-contain"
            />
            <span className="text-2xl font-bold text-gray-800">MesaCloud</span>
          </div>
          <nav className="flex items-center space-x-4">
            <Link
              to="/restaurants"
              className="text-gray-600 hover:text-orange-600 font-medium transition"
            >
              Mis Restaurantes
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 border border-orange-500 text-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition"
            >
              Registrar
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

      {/* Sección Principal */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Texto Principal */}
          <div className="space-y-6">
            <h1 className="text-5xl font-extrabold text-gray-900 leading-tight">
              SISTEMA DE RESERVAS
            </h1>
            <p className="text-xl text-gray-600">
              Gestiona las reservas de tu restaurante de forma fácil y segura.
            </p>
            <p className="text-2xl font-bold text-orange-600">
              14 Días Gratis.
            </p>
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="px-8 py-4 bg-orange-500 text-white rounded-lg font-semibold text-lg hover:bg-orange-600 transition shadow-lg"
              >
                INICIAR SESIÓN
              </Link>
              <Link
                to="/register"
                className="px-8 py-4 bg-red-500 text-white rounded-lg font-semibold text-lg hover:bg-red-600 transition shadow-lg"
              >
                REGISTRARSE
              </Link>
            </div>
          </div>

          {/* Imagen del Restaurante */}
          <div className="flex justify-center">
            <img
              src={restaurantImage}
              alt="Restaurante"
              className="rounded-lg shadow-2xl w-full max-w-md object-cover"
            />
          </div>
        </div>
      </section>

      {/* Sección: Restaurantes Registrados */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Restaurantes que Usan Nuestro Servicio
          </h2>

          {loading ? (
            <div className="text-center text-gray-600">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
              <p className="mt-4">Cargando restaurantes...</p>
            </div>
          ) : restaurants.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {restaurants.map((restaurant) => (
                <div
                  key={restaurant.id}
                  className="bg-gradient-to-br from-orange-100 to-white p-6 rounded-lg shadow-lg hover:shadow-xl transition transform hover:-translate-y-1"
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <img
                      src={getRestaurantLogo(restaurant.nombre)}
                      alt={`${restaurant.nombre} logo`}
                      className="w-16 h-16 object-contain rounded-full bg-white p-2 border-2 border-orange-200"
                      onError={(e) => {
                        e.target.src = logoMesaCloud;
                      }}
                    />
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {restaurant.nombre}
                      </h3>
                      <p className="text-sm text-gray-600">{restaurant.email}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p>
                      <span className="font-semibold">📍 Dirección:</span>{" "}
                      {restaurant.direccion}
                    </p>
                    <p>
                      <span className="font-semibold">📞 Teléfono:</span>{" "}
                      {restaurant.telefono}
                    </p>
                    <p>
                      <span className="font-semibold">🌐 Subdominio:</span>{" "}
                      <span className="text-orange-600">
                        {restaurant.subdominio}
                      </span>
                    </p>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          restaurant.activo
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {restaurant.activo ? "✓ Activo" : "✗ Inactivo"}
                      </span>
                      <a
                        href={`http://localhost:${restaurant.puerto}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-orange-500 text-white text-sm rounded-lg font-semibold hover:bg-orange-600 transition"
                      >
                        Ingresar →
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600">
              No hay restaurantes registrados aún.
            </p>
          )}
        </div>
      </section>

      {/* Sección: Restaurantes Más Visitados - Carrusel */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
          RESTAURANTES MÁS VISITADOS
        </h2>

        {loading ? (
          <div className="text-center text-gray-600">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4">Cargando estadísticas...</p>
          </div>
        ) : activeRestaurants.length > 0 ? (
          <div className="relative">
            {/* Botón Anterior */}
            {canNavigate && (
              <button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white hover:bg-orange-500 text-orange-500 hover:text-white rounded-full p-3 shadow-lg transition-all transform hover:scale-110"
                aria-label="Anterior"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            )}

            {/* Contenedor del Carrusel */}
            <div className="overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {getCurrentRestaurants().map((restaurant, index) => (
                  <div
                    key={restaurant.id}
                    className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition transform hover:-translate-y-2"
                  >
                    <div className="relative h-48 bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center overflow-hidden">
                      {/* Intentar mostrar logo, si falla mostrar letra */}
                      <img
                        src={getRestaurantLogo(restaurant.nombre)}
                        alt={`${restaurant.nombre} logo`}
                        className="w-40 h-40 object-contain drop-shadow-2xl z-10 bg-white rounded-full p-4"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const fallback = e.target.nextElementSibling;
                          if (fallback) fallback.style.display = 'block';
                        }}
                      />
                      <span 
                        className="text-white text-6xl font-bold opacity-30 absolute inset-0 flex items-center justify-center"
                        style={{ display: 'none' }}
                      >
                        {restaurant.nombre.charAt(0)}
                      </span>
                      <div className="absolute top-4 right-4 bg-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-orange-600 shadow-lg z-20">
                        #{currentSlide * itemsPerSlide + index + 1}
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {restaurant.nombre}
                      </h3>
                      <p className="text-gray-600 mb-4">{restaurant.direccion}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1 text-yellow-500">
                          {"⭐".repeat(5)}
                        </div>
                        <span className="text-sm text-gray-500">
                          {Math.floor(Math.random() * 1000)} visitas
                        </span>
                      </div>
                      <a
                        href={`http://localhost:${restaurant.puerto}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 block w-full text-center px-4 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition"
                      >
                        Ingresar al Restaurante
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Botón Siguiente */}
            {canNavigate && (
              <button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white hover:bg-orange-500 text-orange-500 hover:text-white rounded-full p-3 shadow-lg transition-all transform hover:scale-110"
                aria-label="Siguiente"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            )}

            {/* Indicadores de Slide (solo si hay más de 3) */}
            {canNavigate && (
              <div className="flex justify-center mt-8 space-x-2">
                {Array.from({ length: totalSlides }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      currentSlide === index
                        ? "bg-orange-500 w-8"
                        : "bg-gray-300 hover:bg-gray-400"
                    }`}
                    aria-label={`Ir a slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-gray-600">
            No hay restaurantes activos para mostrar.
          </p>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img 
              src={logoMesaCloud} 
              alt="MesaCloud Logo" 
              className="w-10 h-10 object-contain"
            />
            <span className="text-xl font-bold">MesaCloud</span>
          </div>
          <p className="text-gray-400">
            © 2025 MesaCloud. Todos los derechos reservados.
          </p>
          <div className="mt-4 space-x-4">
            <Link to="/master" className="text-orange-500 hover:text-orange-400">
              Admin Master
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

export default Home;

