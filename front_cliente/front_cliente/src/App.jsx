import React, { useEffect, useState } from "react";
import "./App.css";
import fondo from "./assets/fondo-dashboard.png";
import logo from "./assets/logo-guss.png";
import pizzaBg from "./assets/pizza_dashboard.jpg";
import pizzaLogo from "./assets/pizza_logo.png";
import ChatBotSimple from "./components/ChatBotSimple";

function App() {
  const [currentRestaurant, setCurrentRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatStarted, setChatStarted] = useState(false);

  // Detectar restaurante desde la URL
  const getRestaurantPortFromURL = () => {
    const path = window.location.pathname;
    
    // Buscar patrones específicos: /3001-chat-client/ o /3002-chat-client/
    const match = path.match(/\/(3001|3002)-chat-client\/?/);
    if (match) {
      return match[1];
    }
    
    // Si no hay match, retornar null para mostrar error
    return null;
  };

  const restaurantPort = getRestaurantPortFromURL();
  const isPizza = restaurantPort === "3002";

  useEffect(() => {
    if (restaurantPort) {
      detectRestaurant();
    }
  }, []);

  const detectRestaurant = async () => {
    try {
      setLoading(true);
      const apiUrl = `http://localhost:${restaurantPort}/api`;
      let restaurantInfo = null;
      try {
        const res = await fetch(`${apiUrl}/tenant/info`);
        restaurantInfo = await res.json();
      } catch (e) {
        // Fallback con nombre genérico si no se puede obtener del backend
        const restaurantNames = {
          '3001': 'Gus\'s Restaurant',
          '3002': 'Pizza Palace',
        };
        restaurantInfo = { 
          name: restaurantNames[restaurantPort] || `Restaurante ${restaurantPort}`, 
          id: restaurantPort 
        };
      }
      setCurrentRestaurant({
        ...restaurantInfo,
        port: restaurantPort,
        apiUrl,
      });
    } catch (error) {
      setError("Error conectando con el restaurante");
    } finally {
      setLoading(false);
    }
  };

  // Si no hay puerto válido, mostrar error con URLs correctas
  if (!restaurantPort) {
    return (
      <div
        className="min-h-screen w-full flex flex-col items-center justify-center"
        style={{
          backgroundImage: `url(${fondo})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="bg-white/95 rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              URL no válida
            </h1>
            <p className="text-gray-600 mb-6">
              Por favor, accede a través de una de estas URLs:
            </p>
          </div>
          <div className="space-y-3">
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <img src={logo} alt="Gus's" className="w-8 h-8 rounded-full" />
                <span className="font-semibold text-orange-700">Gus's Restaurant</span>
              </div>
              <code className="text-sm text-gray-700 break-all block">
                http://localhost:5174/3001-chat-client/
              </code>
            </div>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <img src={pizzaLogo} alt="Pizza" className="w-8 h-8 rounded-full" />
                <span className="font-semibold text-red-700">Pizza Palace</span>
              </div>
              <code className="text-sm text-gray-700 break-all block">
                http://localhost:5174/3002-chat-client/
              </code>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black/50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Conectando con el restaurante...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black/50">
        <div className="text-center bg-red-900/50 p-8 rounded-lg">
          <h2 className="text-white text-xl mb-4">Error de Conexión</h2>
          <p className="text-white mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!currentRestaurant) {
    return null;
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center"
      style={{
        backgroundImage: `url(${isPizza ? pizzaBg : fondo})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="flex flex-col items-center justify-center w-full max-w-3xl mx-auto bg-white/80 rounded-lg shadow-lg mt-8 mb-8 p-0">
        <div className="w-full flex flex-col items-center justify-center bg-white/90 rounded-t-lg py-6 border-b">
          <img
            src={isPizza ? pizzaLogo : logo}
            alt="Logo"
            className="w-16 h-16 mb-2"
          />
          <h1
            className={`text-2xl font-bold mb-1 ${
              isPizza ? "text-red-700" : "text-orange-700"
            }`}
          >
            {currentRestaurant.name}
          </h1>
          <p className="text-gray-600 text-sm">Sistema de Reservas y Chatbot</p>
        </div>
        {/* Mostrar botón para empezar a chatear */}
        {!chatStarted && (
          <div className="w-full flex flex-col items-center justify-center py-12">
            <button
              onClick={() => setChatStarted(true)}
              className={`px-8 py-4 rounded-lg text-xl font-bold shadow-lg transition text-white ${
                isPizza
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-orange-500 hover:bg-orange-600"
              }`}
            >
              Empezar a chatear
            </button>
          </div>
        )}
        {/* Mostrar ChatBot solo si se ha hecho clic en el botón */}
        {chatStarted && (
          <div className="w-full">
            <ChatBotSimple restaurant={currentRestaurant} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
