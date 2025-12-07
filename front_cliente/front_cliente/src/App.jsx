import React, { useEffect, useState } from "react";
import "./App.css";
import fondo from "./assets/fondo-dashboard.png";
import logo from "./assets/logo-guss.png";
import pizzaBg from "./assets/pizza_dashboard.jpg";
import pizzaLogo from "./assets/pizza_logo.png";
import ChatBot from "./components/ChatBot";

function App() {
  const [currentRestaurant, setCurrentRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatStarted, setChatStarted] = useState(false);

  // Detecta el puerto
  const port = window.location.port;
  const isPizza = port === "3002";

  useEffect(() => {
    detectRestaurant();
  }, []);

  const detectRestaurant = async () => {
    try {
      setLoading(true);
      const apiUrl = `http://localhost:${port}/api`;
      let restaurantInfo = null;
      try {
        const res = await fetch(`${apiUrl}/tenant/info`);
        restaurantInfo = await res.json();
      } catch (e) {
        restaurantInfo = { name: `Restaurante ${port}`, id: port };
      }
      setCurrentRestaurant({
        ...restaurantInfo,
        port,
        apiUrl,
      });
    } catch (error) {
      setError("Error conectando con el restaurante");
    } finally {
      setLoading(false);
    }
  };

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
            <ChatBot restaurant={currentRestaurant} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
