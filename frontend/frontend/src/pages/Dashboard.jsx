import { LogOut, Menu, X } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import bg from "../assets/fondo-dashboard.png";
import logoGuss from "../assets/logo-guss.png";
import pizzaBg from "../assets/pizza_dashboard.jpg";
import pizzaLogo from "../assets/pizza_logo.png";
import { useApi } from "../hooks/useApi";

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [estadisticas, setEstadisticas] = useState({
    total_reservas: 0,
    total_mesas: 0,
    total_platos: 0,
  });
  const [contextoBot, setContextoBot] = useState("");
  const [guardandoBot, setGuardandoBot] = useState(false);
  const [mensajeBot, setMensajeBot] = useState("");
  const [branches, setBranches] = useState([]);
  const [cargandoSucursales, setCargandoSucursales] = useState(false);
  const [branchForm, setBranchForm] = useState({
    id: null,
    nombre: "",
    email: "",
    telefono: "",
    direccion: "",
  });
  const [guardandoSucursal, setGuardandoSucursal] = useState(false);
  const [mensajeSucursal, setMensajeSucursal] = useState("");
  const [telefonoBot, setTelefonoBot] = useState("");
  const [menuTags, setMenuTags] = useState([]);
  const [nuevoTag, setNuevoTag] = useState({
    nombre: "",
    precio: "",
    branch_id: "",
  });
  const [mensajeTag, setMensajeTag] = useState("");
  const [guardandoTelefono, setGuardandoTelefono] = useState(false);
  const [guardandoContexto, setGuardandoContexto] = useState(false);
  const [showMenuPopup, setShowMenuPopup] = useState(false);
  const [configuracion, setConfiguracion] = useState({
    platosMinimos: 5,
    colorTema: "#ea580c", // orange-600
    logoUrl: logoGuss, // Logo predeterminado de Gus's
    fondoUrl: bg, // Fondo predeterminado de Gus's
  });
  const [guardandoConfiguracion, setGuardandoConfiguracion] = useState(false);
  const [mensajeConfiguracion, setMensajeConfiguracion] = useState("");
  const api = useApi();

  // Detectar puerto
  const port = window.location.port;
  const isPizza = port === "3002";

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Función para convertir color hex a rgba con opacidad
  const hexToRgba = (hex, alpha = 0.15) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Función para ajustar brillo del color (crear tonalidades)
  const adjustBrightness = (hex, percent) => {
    const num = parseInt(hex.slice(1), 16);
    const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + percent));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + percent));
    const b = Math.min(255, Math.max(0, (num & 0xff) + percent));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };

  // Función para generar color complementario (opuesto)
  const getComplementaryColor = (hex) => {
    const num = parseInt(hex.slice(1), 16);
    const r = 255 - ((num >> 16) & 0xff);
    const g = 255 - ((num >> 8) & 0xff);
    const b = 255 - (num & 0xff);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };

  // Función para generar un color análogo diferente (verde para naranja, etc)
  const getAnalogousColor = (hex) => {
    const num = parseInt(hex.slice(1), 16);
    const r = (num >> 16) & 0xff;
    const g = (num >> 8) & 0xff;
    const b = num & 0xff;
    
    // Rotar el matiz aproximadamente 120 grados (un tercio del círculo cromático)
    // Esto convierte naranja->verde, rojo->azul, azul->naranja, etc.
    const newR = Math.min(255, Math.floor(b * 0.6 + g * 0.2));
    const newG = Math.min(255, Math.floor(r * 0.5 + 60));
    const newB = Math.min(255, Math.floor(g * 0.4 + r * 0.15));
    
    return `#${((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1)}`;
  };

  // Función para verificar si el bot puede ser entrenado
  const isBotReady = () => {
    // Validar teléfono y contexto
    if (!telefonoBot.trim() || !contextoBot.trim()) {
      return false;
    }

    // Si hay sucursales, validar que cada una tenga la cantidad mínima
    if (branches && branches.length > 0) {
      for (const branch of branches) {
        const platosEnSucursal = menuTags.filter(tag => tag.branch_id === branch.id);
        if (platosEnSucursal.length < configuracion.platosMinimos) {
          return false;
        }
      }
      return true;
    } else {
      // Si no hay sucursales, validar el total
      return menuTags.length >= configuracion.platosMinimos;
    }
  };

  const cargarSucursales = useCallback(async () => {
    try {
      setCargandoSucursales(true);
      const res = await api.get("/branches");
      
      // Asegurar que sea un array
      const branchesData = Array.isArray(res.data) ? res.data : [];
      setBranches(branchesData);
      
      if (branchesData.length > 0) {
        setNuevoTag((prev) => ({
          ...prev,
          branch_id: prev.branch_id || String(branchesData[0].id),
        }));
      }
    } catch (err) {
      console.error("Error obteniendo sucursales:", err);
      setBranches([]);
    } finally {
      setCargandoSucursales(false);
    }
  }, [api]);

  const cargarContextoBot = useCallback(async () => {
    try {
      const res = await api.get("/bot/context");
      setContextoBot(res.data.contexto || "");
      setTelefonoBot(res.data.telefono || "");
      const tags = Array.isArray(res.data.menuEntrenamiento)
        ? res.data.menuEntrenamiento
        : [];
      setMenuTags(
        tags.map((tag, idx) => ({
          id: tag.id || `${Date.now()}-${idx}`,
          nombre: tag.nombre,
          precio: tag.precio,
          branch_id: tag.branch_id,
          branch_nombre: tag.branch_nombre || "Sucursal",
        }))
      );
    } catch (err) {
      console.error("Error cargando contexto del bot:", err);
    }
  }, [api]);

  useEffect(() => {
    // Verificar si hay usuario logueado
    const usuarioGuardado = localStorage.getItem("usuario");
    if (!usuarioGuardado) {
      window.location.href = "http://localhost:3000";
      return;
    }

    const userData = JSON.parse(usuarioGuardado);
    setUsuario(userData);

    // Cargar configuración guardada
    const configGuardada = localStorage.getItem(`config_${userData.id}`);
    if (configGuardada) {
      try {
        setConfiguracion(JSON.parse(configGuardada));
      } catch (err) {
        console.error("Error al cargar configuración:", err);
      }
    }

    // Obtener estadísticas del restaurante
    const obtenerEstadisticas = async () => {
      try {
        const res = await api.get(
          `/dashboard/estadisticas/${userData.restaurant_id}`
        );
        setEstadisticas(res.data);
      } catch (err) {
        console.error("Error al obtener estadísticas:", err);
        // Establecer valores por defecto en caso de error
        setEstadisticas({
          total_reservas: 0,
          total_mesas: 0,
          total_platos: 0,
        });
      }
    };

    obtenerEstadisticas();
    cargarContextoBot();
    cargarSucursales();
  }, [api, cargarContextoBot, cargarSucursales]);

  const handleLogout = () => {
    localStorage.removeItem("usuario");
    localStorage.removeItem("token");
    window.location.href = "http://localhost:3000";
  };

  const resetBranchForm = () =>
    setBranchForm({ id: null, nombre: "", email: "", telefono: "", direccion: "" });

  const handleSucursalSubmit = async (e) => {
    e.preventDefault();
    setMensajeSucursal("");
    const payload = {
      nombre: branchForm.nombre.trim(),
      email: branchForm.email.trim(),
      telefono: branchForm.telefono.trim(),
      direccion: branchForm.direccion.trim(),
    };

    if (!payload.nombre || !payload.email) {
      setMensajeSucursal("Nombre y email son obligatorios");
      return;
    }

    try {
      setGuardandoSucursal(true);
      if (branchForm.id) {
        await api.put(`/branches/${branchForm.id}`, payload);
        setMensajeSucursal("Sucursal actualizada correctamente");
      } else {
        await api.post("/branches", payload);
        setMensajeSucursal("Sucursal creada correctamente");
      }
      resetBranchForm();
      await cargarSucursales();
    } catch (err) {
      console.error("Error guardando sucursal:", err);
      const msg = err.response?.data?.error || "Error al guardar la sucursal";
      setMensajeSucursal(msg);
    } finally {
      setGuardandoSucursal(false);
      setTimeout(() => setMensajeSucursal(""), 3000);
    }
  };

  const handleEliminarSucursal = async (id) => {
    const confirmar = window.confirm("¿Eliminar esta sucursal? Esta acción es permanente.");
    if (!confirmar) return;
    try {
      await api.delete(`/branches/${id}`);
      if (branchForm.id === id) {
        resetBranchForm();
      }
      await cargarSucursales();
      setMensajeSucursal("Sucursal eliminada correctamente");
      setTimeout(() => setMensajeSucursal(""), 3000);
    } catch (err) {
      console.error("Error eliminando sucursal:", err);
      const msg =
        err.response?.data?.error ||
        "No se pudo eliminar la sucursal. Retira mesas o reservas asociadas.";
      setMensajeSucursal(msg);
    }
  };

  const handleAgregarTag = (e) => {
    e.preventDefault();
    setMensajeTag("");

    if (!nuevoTag.nombre.trim() || !nuevoTag.precio || !nuevoTag.branch_id) {
      setMensajeTag("Completa nombre, precio y sucursal");
      return;
    }

    const branch = branches.find((b) => String(b.id) === String(nuevoTag.branch_id));
    setMenuTags((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        nombre: nuevoTag.nombre.trim(),
        precio: Number(nuevoTag.precio),
        branch_id: Number(nuevoTag.branch_id),
        branch_nombre: branch?.nombre || "Sucursal",
      },
    ]);
    setNuevoTag((prev) => ({
      ...prev,
      nombre: "",
      precio: "",
    }));
    setMensajeTag("Plato agregado al entrenamiento");
    setTimeout(() => setMensajeTag(""), 3000);
  };

  const handleEliminarTag = (id) => {
    setMenuTags((prev) => prev.filter((tag) => tag.id !== id));
  };

  const handleEntrenarBot = async () => {
    // Validar teléfono y contexto
    if (!telefonoBot.trim() || !contextoBot.trim()) {
      alert("No se pudo completar el entrenamiento. Verifica que hayas configurado toda la información necesaria.");
      return;
    }

    // Validar que cada sucursal tenga al menos la cantidad mínima de platos
    if (branches && branches.length > 0) {
      for (const branch of branches) {
        const platosEnSucursal = menuTags.filter(tag => tag.branch_id === branch.id);
        if (platosEnSucursal.length < configuracion.platosMinimos) {
          alert(`No se pudo completar el entrenamiento. La sucursal "${branch.nombre}" necesita al menos ${configuracion.platosMinimos} platos (tiene ${platosEnSucursal.length}).`);
          return;
        }
      }
    } else {
      // Si no hay sucursales, validar el total de platos
      if (menuTags.length < configuracion.platosMinimos) {
        alert("No se pudo completar el entrenamiento. Verifica que hayas configurado toda la información necesaria.");
        return;
      }
    }

    setGuardandoBot(true);
    setMensajeBot("");
    try {
      await api.post("/bot/train", {
        contexto: contextoBot,
        telefono: telefonoBot,
        menuEntrenamiento: menuTags.map(
          ({ nombre, precio, branch_id, branch_nombre }) => ({
            nombre,
            precio,
            branch_id,
            branch_nombre,
          })
        ),
      });
      setMensajeBot("Entrenamiento guardado correctamente");
      setTimeout(() => setMensajeBot(""), 3000);
    } catch (err) {
      console.error("Error entrenando bot:", err);
      setMensajeBot("Error al entrenar el bot");
    } finally {
      setGuardandoBot(false);
    }
  };

  const handleGuardarTelefono = async () => {
    setGuardandoTelefono(true);
    setMensajeBot("");
    try {
      await api.post("/bot/train", {
        contexto: contextoBot,
        telefono: telefonoBot,
        menuEntrenamiento: menuTags.map(
          ({ nombre, precio, branch_id, branch_nombre }) => ({
            nombre,
            precio,
            branch_id,
            branch_nombre,
          })
        ),
      });
      setMensajeBot("Teléfono guardado correctamente");
      setTimeout(() => setMensajeBot(""), 3000);
    } catch (err) {
      console.error("Error guardando teléfono:", err);
      setMensajeBot("Error al guardar el teléfono");
    } finally {
      setGuardandoTelefono(false);
    }
  };

  const handleGuardarContexto = async () => {
    setGuardandoContexto(true);
    setMensajeBot("");
    try {
      await api.post("/bot/train", {
        contexto: contextoBot,
        telefono: telefonoBot,
        menuEntrenamiento: menuTags.map(
          ({ nombre, precio, branch_id, branch_nombre }) => ({
            nombre,
            precio,
            branch_id,
            branch_nombre,
          })
        ),
      });
      setMensajeBot("Contexto guardado correctamente");
      setTimeout(() => setMensajeBot(""), 3000);
    } catch (err) {
      console.error("Error guardando contexto:", err);
      setMensajeBot("Error al guardar el contexto");
    } finally {
      setGuardandoContexto(false);
    }
  };

  const handleGuardarConfiguracion = async () => {
    setGuardandoConfiguracion(true);
    setMensajeConfiguracion("");
    try {
      // Por ahora guardamos en localStorage, luego se puede hacer una API
      localStorage.setItem(`config_${usuario.id}`, JSON.stringify(configuracion));
      setMensajeConfiguracion("Configuración guardada correctamente");
      setTimeout(() => setMensajeConfiguracion(""), 3000);
    } catch (err) {
      console.error("Error guardando configuración:", err);
      setMensajeConfiguracion("Error al guardar la configuración");
    } finally {
      setGuardandoConfiguracion(false);
    }
  };

  const handleImageUpload = (e, tipo) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setConfiguracion(prev => ({
          ...prev,
          [tipo === 'logo' ? 'logoUrl' : 'fondoUrl']: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (!usuario) {
    return (
      <div className="flex items-center justify-center h-screen">
        Cargando...
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div
        className={`fixed z-40 md:relative transition-all duration-300 ${
          isPizza ? "bg-red-100" : "bg-white/90"
        } backdrop-blur-md shadow-xl w-64 p-6 ${
          sidebarOpen ? "left-0" : "-left-64"
        } md:left-0`}
      >
        <div className="flex items-center justify-between mb-6">
          <img
            src={configuracion.logoUrl || (isPizza ? pizzaLogo : logoGuss)}
            alt="Logo"
            className="w-10 h-10"
          />
          <h2
            className="text-2xl font-bold"
            style={{ color: configuracion.colorTema }}
          >
            {isPizza ? "Pizza Palace Admin" : "Gus's Admin"}
          </h2>
          <button
            onClick={handleLogout}
            className="text-gray-500 hover:text-red-500"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded">
          <p className="text-sm font-semibold text-gray-700">
            {usuario.nombre}
          </p>
          <p className="text-xs text-gray-500">{usuario.email}</p>
        </div>

        <nav className="space-y-4">
          <Link
            to="/dashboard"
            className="block text-gray-800 hover:text-orange-500 font-medium"
          >
            Dashboard
          </Link>
          <Link
            to="/configuracion"
            className="block text-gray-800 hover:text-orange-500"
          >
            Configuración
          </Link>
          <Link
            to="/menu"
            className="block text-gray-800 hover:text-orange-500"
          >
            Gestión de Menú
          </Link>
          <Link
            to="/reservas"
            className="block text-gray-800 hover:text-orange-500"
          >
            Reservas
          </Link>
          <Link
            to="/mesas"
            className="block text-gray-800 hover:text-orange-500"
          >
            Mesas
          </Link>
        </nav>
      </div>

      {/* Contenido principal */}
      <div
        className="flex-1 bg-cover bg-center p-6 overflow-y-auto w-full"
        style={{ backgroundImage: `url(${configuracion.fondoUrl || (isPizza ? pizzaBg : bg)})` }}
      >
        {/* Topbar móvil */}
        <div className="md:hidden flex justify-between items-center mb-4">
          <h1
            className={`text-xl font-bold ${
              isPizza ? "text-red-600" : "text-white"
            } drop-shadow`}
          >
            Dashboard
          </h1>
          <button
            onClick={toggleSidebar}
            className={isPizza ? "text-red-600" : "text-white"}
          >
            {sidebarOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        <h1
          className={`text-3xl font-bold ${
            isPizza ? "text-red-600" : "text-white"
          } drop-shadow mb-6`}
        >
          Bienvenido a {usuario.nombre}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Tarjeta de Reservas */}
          <div className="bg-white/90 backdrop-blur p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">Reservas Totales</p>
                <h2 
                  className="text-3xl font-bold"
                  style={{ color: configuracion.colorTema }}
                >
                  {estadisticas.total_reservas}
                </h2>
              </div>
              <div 
                className="p-3 rounded-full"
                style={{ backgroundColor: hexToRgba(configuracion.colorTema, 0.15) }}
              >
                <svg
                  className="w-8 h-8"
                  style={{ color: configuracion.colorTema }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Tarjeta de Mesas */}
          <div className="bg-white/90 backdrop-blur p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">Mesas Totales</p>
                <h2 
                  className="text-3xl font-bold"
                  style={{ color: configuracion.colorTema }}
                >
                  {estadisticas.total_mesas}
                </h2>
              </div>
              <div 
                className="p-3 rounded-full"
                style={{ backgroundColor: hexToRgba(configuracion.colorTema, 0.15) }}
              >
                <svg
                  className="w-8 h-8"
                  style={{ color: configuracion.colorTema }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Tarjeta de Platos */}
          <div className="bg-white/90 backdrop-blur p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">Platos en Menú</p>
                <h2 
                  className="text-3xl font-bold"
                  style={{ color: configuracion.colorTema }}
                >
                  {estadisticas.total_platos}
                </h2>
              </div>
              <div 
                className="p-3 rounded-full"
                style={{ backgroundColor: hexToRgba(configuracion.colorTema, 0.15) }}
              >
                <svg
                  className="w-8 h-8"
                  style={{ color: configuracion.colorTema }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <section className="bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">
            Accesos Rápidos
          </h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/menu"
              style={{ backgroundColor: configuracion.colorTema }}
              className="text-white px-6 py-3 rounded-lg hover:opacity-90 text-center transition"
            >
              Gestión de Menú
            </Link>
            <Link
              to="/reservas"
              style={{ backgroundColor: adjustBrightness(configuracion.colorTema, -30) }}
              className="text-white px-6 py-3 rounded-lg hover:opacity-90 text-center transition"
            >
              Ver Reservas
            </Link>
            <Link
              to="/mesas"
              style={{ backgroundColor: getAnalogousColor(configuracion.colorTema) }}
              className="text-white px-6 py-3 rounded-lg hover:opacity-90 text-center transition"
            >
              Gestionar Mesas
            </Link>
          </div>
          <div className="mt-8 border-t border-gray-100 pt-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h4 className="text-lg font-semibold text-gray-800">Sucursales</h4>
                <p className="text-sm text-gray-500">
                  Gestiona las ubicaciones donde opera tu restaurante.
                </p>
              </div>
            </div>

            {mensajeSucursal && (
              <div
                className={`mt-4 p-3 rounded text-sm ${
                  mensajeSucursal.includes("Error")
                    ? "bg-red-50 text-red-700 border border-red-100"
                    : "bg-green-50 text-green-700 border border-green-100"
                }`}
              >
                {mensajeSucursal}
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {cargandoSucursales ? (
                <p className="text-gray-500 col-span-full">Cargando sucursales...</p>
              ) : !branches || branches.length === 0 ? (
                <p className="text-gray-500 col-span-full">
                  Aún no tienes sucursales registradas.
                </p>
              ) : (
                branches.map((branch) => (
                  <div
                    key={branch.id}
                    className="border border-gray-100 rounded-xl p-4 bg-gray-50"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="font-semibold text-gray-800">{branch.nombre}</p>
                        <p className="text-xs text-gray-500">{branch.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="text-xs text-orange-600 hover:underline"
                          onClick={() =>
                            setBranchForm({
                              id: branch.id,
                              nombre: branch.nombre,
                              email: branch.email,
                              telefono: branch.telefono || "",
                              direccion: branch.direccion || "",
                            })
                          }
                        >
                          Editar
                        </button>
                        <button
                          className="text-xs text-red-500 hover:underline"
                          onClick={() => handleEliminarSucursal(branch.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {branch.telefono || "Sin teléfono"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {branch.direccion || "Sin dirección"}
                    </p>
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={handleSucursalSubmit}
              className="mt-4 bg-white rounded-xl border border-gray-100 p-4 grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <label className="text-xs text-gray-500 uppercase">Nombre</label>
                <input
                  type="text"
                  value={branchForm.nombre}
                  onChange={(e) =>
                    setBranchForm((prev) => ({ ...prev, nombre: e.target.value }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Sucursal Principal"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Email</label>
                <input
                  type="email"
                  value={branchForm.email}
                  onChange={(e) =>
                    setBranchForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="sucursal@restaurante.com"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Teléfono</label>
                <input
                  type="text"
                  value={branchForm.telefono}
                  onChange={(e) =>
                    setBranchForm((prev) => ({ ...prev, telefono: e.target.value }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="+51 999 999 999"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Dirección</label>
                <input
                  type="text"
                  value={branchForm.direccion}
                  onChange={(e) =>
                    setBranchForm((prev) => ({ ...prev, direccion: e.target.value }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Av. Siempre Viva 742"
                />
              </div>
              <div className="md:col-span-2 flex gap-3">
                <button
                  type="submit"
                  disabled={guardandoSucursal}
                  style={{ backgroundColor: configuracion.colorTema }}
                  className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition disabled:opacity-60"
                >
                  {guardandoSucursal
                    ? "Guardando..."
                    : branchForm.id
                    ? "Actualizar sucursal"
                    : "Crear sucursal"}
                </button>
                {branchForm.id && (
                  <button
                    type="button"
                    onClick={resetBranchForm}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    Cancelar edición
                  </button>
                )}
              </div>
            </form>
          </div>
        </section>

        {/* Información del restaurante */}
        <section className="bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-md mt-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Información del Restaurante
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-100 rounded-xl bg-gray-50">
              <p className="text-xs uppercase text-gray-500">Subdominio</p>
              <p className="text-lg font-semibold text-gray-800">
                {usuario.subdominio}.localhost
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Este valor es asignado al crear tu tenant y no se puede modificar.
              </p>
            </div>
            <div className="p-4 border border-gray-100 rounded-xl bg-gray-50">
              <p className="text-xs uppercase text-gray-500">Puerto</p>
              <p className="text-lg font-semibold text-gray-800">
                http://localhost:{usuario.puerto}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Cada restaurante opera en un puerto único.
              </p>
            </div>
          </div>
        </section>

        {/* Configuración del Restaurante */}
        <section className="bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-md mt-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Configuración del Restaurante
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Personaliza la configuración general de tu restaurante.
          </p>

          {mensajeConfiguracion && (
            <div className={`mb-4 p-3 rounded ${
              mensajeConfiguracion.includes("Error") 
                ? "bg-red-100 text-red-700" 
                : "bg-green-100 text-green-700"
            }`}>
              {mensajeConfiguracion}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Platos mínimos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platos mínimos para entrenamiento
              </label>
              <input
                type="number"
                min="1"
                value={configuracion.platosMinimos}
                onChange={(e) => setConfiguracion(prev => ({
                  ...prev,
                  platosMinimos: parseInt(e.target.value) || 1
                }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="5"
              />
              <p className="text-xs text-gray-500 mt-1">
                Cantidad mínima de platos requeridos para activar el bot
              </p>
            </div>

            {/* Color del tema */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color del tema
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={configuracion.colorTema}
                  onChange={(e) => setConfiguracion(prev => ({
                    ...prev,
                    colorTema: e.target.value
                  }))}
                  className="w-16 h-10 border border-gray-200 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={configuracion.colorTema}
                  onChange={(e) => setConfiguracion(prev => ({
                    ...prev,
                    colorTema: e.target.value
                  }))}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="#ea580c"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Color principal de tu marca
              </p>
            </div>

            {/* URL del Logo */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo del Restaurante
              </label>
              <div className="flex gap-4 items-start">
                {/* Previsualización del logo */}
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden bg-white flex items-center justify-center">
                    {configuracion.logoUrl ? (
                      <img 
                        src={configuracion.logoUrl} 
                        alt="Logo preview" 
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <span className="text-gray-400 text-xs text-center px-2">Sin logo</span>
                    )}
                  </div>
                </div>
                {/* Controles */}
                <div className="flex-1">
                  <input
                    type="text"
                    value={configuracion.logoUrl}
                    onChange={(e) => setConfiguracion(prev => ({
                      ...prev,
                      logoUrl: e.target.value
                    }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 mb-2"
                    placeholder="https://ejemplo.com/logo.png o ruta local"
                  />
                  <div className="flex gap-2">
                    <label className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition cursor-pointer text-center text-sm">
                      📁 Subir imagen
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'logo')}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Logo que aparecerá en el sidebar
                  </p>
                </div>
              </div>
            </div>

            {/* URL del Fondo */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagen de Fondo del Dashboard
              </label>
              <div className="flex gap-4 items-start">
                {/* Previsualización del fondo */}
                <div className="flex-shrink-0">
                  <div className="w-48 h-32 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-100">
                    {configuracion.fondoUrl ? (
                      <img 
                        src={configuracion.fondoUrl} 
                        alt="Fondo preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        Sin fondo
                      </div>
                    )}
                  </div>
                </div>
                {/* Controles */}
                <div className="flex-1">
                  <input
                    type="text"
                    value={configuracion.fondoUrl}
                    onChange={(e) => setConfiguracion(prev => ({
                      ...prev,
                      fondoUrl: e.target.value
                    }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 mb-2"
                    placeholder="https://ejemplo.com/fondo.jpg o ruta local"
                  />
                  <div className="flex gap-2">
                    <label className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition cursor-pointer text-center text-sm">
                      📁 Subir imagen
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'fondo')}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Imagen de fondo principal del dashboard
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Botón guardar configuración */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleGuardarConfiguracion}
              disabled={guardandoConfiguracion}
              style={{ backgroundColor: configuracion.colorTema }}
              className="px-6 py-2 text-white rounded-lg transition disabled:opacity-50 hover:opacity-90"
            >
              {guardandoConfiguracion ? "Guardando..." : "Guardar Configuración"}
            </button>
          </div>
        </section>

        {/* Entrenamiento del Bot */}
        <section className="bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-md mt-6">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-xl font-semibold text-gray-800">
              Entrenar Bot de Atención al Cliente
            </h3>
            {/* Indicador de estado del bot */}
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: isBotReady()
                    ? configuracion.colorTema
                    : '#9ca3af'
                }}
              ></div>
              <span 
                className="text-xs font-medium"
                style={{
                  color: isBotReady()
                    ? configuracion.colorTema
                    : '#6b7280'
                }}
              >
                {isBotReady()
                  ? 'Activo'
                  : 'Inactivo'}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Proporciona contexto e información sobre tu restaurante para que el bot pueda atender mejor a tus clientes.
          </p>
          
          {mensajeBot && (
            <div className={`mb-4 p-3 rounded ${
              mensajeBot.includes("Error") 
                ? "bg-red-100 text-red-700" 
                : "bg-green-100 text-green-700"
            }`}>
              {mensajeBot}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono de contacto (referencia)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={telefonoBot}
                  onChange={(e) => setTelefonoBot(e.target.value)}
                  placeholder="+591 67505507"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                />
                <button
                  onClick={handleGuardarTelefono}
                  disabled={guardandoTelefono}
                  style={{ backgroundColor: configuracion.colorTema }}
                  className="px-4 py-2 text-white rounded hover:opacity-90 transition disabled:opacity-50 whitespace-nowrap"
                >
                  {guardandoTelefono ? "Guardando..." : "Guardar"}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Este número se usará próximamente para comunicaciones del bot (por ahora es solo informativo).
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contexto del Restaurante
              </label>
              <textarea
                value={contextoBot}
                onChange={(e) => setContextoBot(e.target.value)}
                placeholder="Ejemplo: Somos un restaurante especializado en comida rápida. Ofrecemos hamburguesas, alitas, combos y bebidas. Nuestro horario es de lunes a domingo de 8:00 AM a 10:00 PM. Aceptamos reservas para grupos de hasta 9 personas..."
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 min-h-[150px]"
                rows="6"
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">
                  Describe tu restaurante, especialidades, horarios, políticas de reserva, etc.
                </p>
                <button
                  onClick={handleGuardarContexto}
                  disabled={guardandoContexto}
                  style={{ backgroundColor: configuracion.colorTema }}
                  className="px-4 py-2 text-white rounded hover:opacity-90 transition disabled:opacity-50 whitespace-nowrap"
                >
                  {guardandoContexto ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>

            <div 
              className="border rounded-xl p-4"
              style={{ 
                backgroundColor: hexToRgba(configuracion.colorTema, 0.08),
                borderColor: hexToRgba(configuracion.colorTema, 0.2)
              }}
            >
              <div className="flex justify-between items-center mb-2">
                <h4 
                  className="text-sm font-semibold"
                  style={{ color: configuracion.colorTema }}
                >
                  Platos de referencia para el bot
                </h4>
                <button
                  onClick={() => setShowMenuPopup(true)}
                  style={{ backgroundColor: configuracion.colorTema }}
                  className="px-3 py-1 text-white rounded hover:opacity-90 transition flex items-center gap-1"
                  title="Ver todos los platos"
                >
                  <span className="text-lg">☰</span>
                  <span className="text-xs">Ver todos</span>
                </button>
              </div>
              {mensajeTag && (
                <p 
                  className="text-xs mb-2"
                  style={{ color: configuracion.colorTema }}
                >
                  {mensajeTag}
                </p>
              )}
              <form className="space-y-3" onSubmit={handleAgregarTag}>
                <input
                  type="text"
                  value={nuevoTag.nombre}
                  onChange={(e) =>
                    setNuevoTag((prev) => ({ ...prev, nombre: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-orange-100 rounded focus:ring-2 focus:ring-orange-400"
                  placeholder="Nombre del plato"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={nuevoTag.precio}
                  onChange={(e) =>
                    setNuevoTag((prev) => ({ ...prev, precio: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-orange-100 rounded focus:ring-2 focus:ring-orange-400"
                  placeholder="Precio (Bs)"
                />
                <select
                  value={nuevoTag.branch_id}
                  onChange={(e) =>
                    setNuevoTag((prev) => ({ ...prev, branch_id: e.target.value }))
                  }
                  disabled={!branches || branches.length === 0}
                  className="w-full px-3 py-2 border border-orange-100 rounded focus:ring-2 focus:ring-orange-400 disabled:bg-gray-100"
                >
                  <option value="">
                    {!branches || branches.length === 0
                      ? "No hay sucursales disponibles"
                      : "Selecciona una sucursal"}
                  </option>
                  {branches && branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.nombre}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={!branches || branches.length === 0}
                  style={{ backgroundColor: configuracion.colorTema }}
                  className="w-full px-4 py-2 text-white rounded hover:opacity-90 transition disabled:opacity-50"
                >
                  Agregar plato
                </button>
              </form>
              <div className="flex flex-wrap gap-2 mt-4">
                {menuTags
                  .filter(tag => !nuevoTag.branch_id || tag.branch_id === parseInt(nuevoTag.branch_id))
                  .map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs"
                    style={{ 
                      backgroundColor: hexToRgba(configuracion.colorTema, 0.15),
                      color: configuracion.colorTema
                    }}
                  >
                    {tag.nombre} · Bs {Number(tag.precio).toFixed(2)}
                    <button
                      type="button"
                      className="hover:opacity-70"
                      style={{ color: configuracion.colorTema }}
                      onClick={() => handleEliminarTag(tag.id)}
                    >
                      ×
                    </button>
                  </span>
                ))}
                {(nuevoTag.branch_id ? menuTags.filter(tag => tag.branch_id === parseInt(nuevoTag.branch_id)) : menuTags).length === 0 && (
                  <p className="text-xs text-gray-500">
                    Aún no agregas platos de entrenamiento.
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleEntrenarBot}
              disabled={guardandoBot}
              style={{ backgroundColor: configuracion.colorTema }}
              className="px-4 py-2 text-white rounded hover:opacity-90 transition disabled:opacity-50"
            >
              {guardandoBot ? "Entrenando..." : "Entrenar Bot"}
            </button>
          </div>
        </section>
      </div>

      {/* Popup Modal - Todos los platos */}
      {showMenuPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div 
              style={{ backgroundColor: configuracion.colorTema }}
              className="text-white px-6 py-4 flex justify-between items-center"
            >
              <h3 className="text-xl font-bold">Todos los Platos Añadidos</h3>
              <button
                onClick={() => setShowMenuPopup(false)}
                className="text-white hover:opacity-80 rounded-full p-1 transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              {branches && branches.length > 0 ? (
                branches.map((branch) => {
                  const platosEnSucursal = menuTags.filter(
                    (tag) => tag.branch_id === branch.id
                  );
                  
                  if (platosEnSucursal.length === 0) return null;

                  return (
                    <div key={branch.id} className="mb-6 last:mb-0">
                      <h4 
                        className="text-lg font-semibold mb-3 border-b-2 pb-2"
                        style={{ 
                          color: configuracion.colorTema,
                          borderColor: hexToRgba(configuracion.colorTema, 0.3)
                        }}
                      >
                        {branch.nombre}
                      </h4>
                      <div className="space-y-2">
                        {platosEnSucursal.map((tag) => (
                          <div
                            key={tag.id}
                            className="flex justify-between items-center bg-orange-50 p-3 rounded-lg hover:bg-orange-100 transition"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-gray-800">{tag.nombre}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-orange-600 font-semibold">
                                Bs {Number(tag.precio).toFixed(2)}
                              </span>
                              <button
                                onClick={() => {
                                  handleEliminarTag(tag.id);
                                }}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition"
                                title="Eliminar plato"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No hay platos añadidos todavía
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Total: {menuTags.length} plato{menuTags.length !== 1 ? 's' : ''}
              </p>
              <button
                onClick={() => setShowMenuPopup(false)}
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
