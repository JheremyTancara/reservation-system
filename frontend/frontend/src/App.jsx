import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import Configuracion from "./pages/Configuracion";
import CrearReserva from "./pages/CrearReserva";
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";
import Home from "./pages/Home";
import Login from "./pages/Login";
import MasterDashboard from "./pages/MasterDashboard";
import AdminPanel from "./pages/AdminPanel";
import Menu from "./pages/Menu";
import Mesas from "./pages/Mesas";
import Register from "./pages/Register";
import Reservas from "./pages/Reservas";
import ResetPassword from "./pages/ResetPassword";
import Restaurants from "./pages/Restaurants";
import UserProfile from "./pages/UserProfile";
import RestaurantRegister from "./pages/RestaurantRegister";

function App() {
  const [currentPort, setCurrentPort] = useState(null);

  useEffect(() => {
    // Detectar el puerto actual
    const port = window.location.port || '5173';
    setCurrentPort(port);
  }, []);

  // Puerto 5173: Login/Register para CUALQUIER restaurante + Home
  // Puertos 3001, 3002, etc.: Login específico solo para ese restaurante
  
  const isMainPort = currentPort === '5173' || currentPort === '5174';
  const isRestaurantPort = currentPort && parseInt(currentPort) >= 3001;

  return (
    <BrowserRouter>
      <Routes>
        {/* Puerto 5173 - Página Principal: Login/Register general + Home */}
        {isMainPort && (
          <>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/restaurants" element={<Restaurants />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/restaurant-register" element={<RestaurantRegister />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/master" element={<MasterDashboard />} />
          </>
        )}

        {/* Puertos 3001, 3002, etc. - Login específico de cada restaurante */}
        {isRestaurantPort && (
          <>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
          </>
        )}

        {/* Rutas comunes para todos los puertos */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/configuracion" element={<Configuracion />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/mesas" element={<Mesas />} />
        <Route path="/reservas" element={<Reservas />} />
        <Route path="/crear-reserva" element={<CrearReserva />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;