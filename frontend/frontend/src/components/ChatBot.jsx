import React from "react";

const ChatBot = () => {
  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-orange-600 mb-4">
          Chat del Restaurante
        </h2>
        {usuario ? (
          <>
            <p className="mb-2">
              Bienvenido,{" "}
              <span className="font-semibold">{usuario.nombre}</span>
            </p>
            <p className="mb-2">
              Email: <span className="font-mono">{usuario.email}</span>
            </p>
            <p className="mb-2">
              Puerto: <span className="font-mono">{usuario.puerto}</span>
            </p>
            <p className="mb-2">
              Subdominio:{" "}
              <span className="font-mono">{usuario.subdominio}</span>
            </p>
            <div className="mt-4 p-4 bg-orange-50 rounded">
              <p className="text-orange-700">
                ¡Aquí irá el chat del restaurante!
              </p>
            </div>
          </>
        ) : (
          <p className="text-red-600">No has iniciado sesión.</p>
        )}
      </div>
    </div>
  );
};

export default ChatBot;
