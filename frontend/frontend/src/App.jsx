import { BrowserRouter, Route, Routes } from "react-router-dom";
import Configuracion from "./pages/Configuracion";
import CrearReserva from "./pages/CrearReserva";
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";
import Home from "./pages/Home";
import Login from "./pages/Login";
import MasterDashboard from "./pages/MasterDashboard";
import Menu from "./pages/Menu";
import Mesas from "./pages/Mesas";
import Register from "./pages/Register";
import Reservas from "./pages/Reservas";
import ResetPassword from "./pages/ResetPassword";
import Restaurants from "./pages/Restaurants";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/restaurants" element={<Restaurants />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/configuracion" element={<Configuracion />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/mesas" element={<Mesas />} />
        <Route path="/reservas" element={<Reservas />} />
        <Route path="/crear-reserva" element={<CrearReserva />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/master" element={<MasterDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;