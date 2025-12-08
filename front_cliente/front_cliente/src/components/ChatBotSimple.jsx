import axios from "axios";
import React, { useEffect, useRef, useState } from "react";

const ChatBotSimple = ({ restaurant }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const isPizza = restaurant?.port === "3002";

  // Scroll al final cuando hay nuevos mensajes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mensaje de bienvenida hardcodeado
  useEffect(() => {
    // Limpiar sesión anterior cuando se carga el componente
    const clearSession = async () => {
      try {
        await axios.post(`http://localhost:4000/api/chat/clear-session`, {
          userId: restaurant?.id || 'web-user',
        });
        console.log('✅ Sesión anterior limpiada');
      } catch (error) {
        console.error('Error limpiando sesión:', error);
      }
    };
    
    clearSession();
    
    setMessages([
      {
        type: "bot",
        text: `¡Hola! Bienvenido a ${restaurant?.name || "nuestro restaurante"}. ¿En qué puedo ayudarte hoy?`,
        timestamp: new Date(),
      },
    ]);
  }, [restaurant]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      type: "user",
      text: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Enviar al virtual_assistant que luego llama al backend del restaurante
      const response = await axios.post(`http://localhost:4000/api/chat`, {
        message: input,
        restaurantId: restaurant.id,
      });

      const botMessage = {
        type: "bot",
        text: response.data.response || response.data.message || "Lo siento, no pude procesar tu mensaje.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error enviando mensaje:", error);
      
      const errorMessage = {
        type: "bot",
        text: "Lo siento, hubo un error al procesar tu mensaje. Por favor intenta de nuevo.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[600px] w-full">
      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                msg.type === "user"
                  ? isPizza
                    ? "bg-red-600 text-white"
                    : "bg-orange-600 text-white"
                  : "bg-white text-gray-800 border border-gray-200"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              <span className="text-xs opacity-70 mt-1 block">
                {msg.timestamp.toLocaleTimeString("es-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 border border-gray-200 rounded-lg px-4 py-2">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Área de input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu mensaje..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 text-gray-900 bg-white"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className={`px-6 py-2 rounded-lg text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${
              isPizza
                ? "bg-red-600 hover:bg-red-700"
                : "bg-orange-600 hover:bg-orange-700"
            }`}
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBotSimple;
