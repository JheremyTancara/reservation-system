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
  const api = useApi();

  // Detectar puerto
  const port = window.location.port;
  const isPizza = port === "3002";

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const cargarSucursales = useCallback(async () => {
    try {
      setCargandoSucursales(true);
      const res = await api.get("/branches");
      setBranches(res.data);
      if (res.data.length > 0) {
        setNuevoTag((prev) => ({
          ...prev,
          branch_id: prev.branch_id || String(res.data[0].id),
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
            src={isPizza ? pizzaLogo : logoGuss}
            alt="Logo"
            className="w-10 h-10"
          />
          <h2
            className={`text-2xl font-bold ${
              isPizza ? "text-red-600" : "text-orange-600"
            }`}
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
        style={{ backgroundImage: `url(${isPizza ? pizzaBg : bg})` }}
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
                <h2 className="text-3xl font-bold text-orange-600">
                  {estadisticas.total_reservas}
                </h2>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <svg
                  className="w-8 h-8 text-orange-600"
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
                <h2 className="text-3xl font-bold text-orange-600">
                  {estadisticas.total_mesas}
                </h2>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <svg
                  className="w-8 h-8 text-orange-600"
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
                <h2 className="text-3xl font-bold text-orange-600">
                  {estadisticas.total_platos}
                </h2>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <svg
                  className="w-8 h-8 text-orange-600"
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
              className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 text-center"
            >
              Gestión de Menú
            </Link>
            <Link
              to="/reservas"
              className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 text-center"
            >
              Ver Reservas
            </Link>
            <Link
              to="/mesas"
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 text-center"
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
              <button
                onClick={resetBranchForm}
                className="px-4 py-2 rounded-lg border border-orange-200 text-orange-600 hover:bg-orange-50 text-sm font-medium"
                type="button"
              >
                Nueva sucursal
              </button>
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
              ) : branches.length === 0 ? (
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
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-60"
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

        {/* Entrenamiento del Bot */}
        <section className="bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-md mt-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">
            Entrenar Bot de Atención al Cliente
          </h3>
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
              <input
                type="text"
                value={telefonoBot}
                onChange={(e) => setTelefonoBot(e.target.value)}
                placeholder="+51 999 999 999"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
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
              <p className="text-xs text-gray-500 mt-1">
                Describe tu restaurante, especialidades, horarios, políticas de reserva, etc.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">
                Platos de referencia para el bot
              </h4>
              {mensajeTag && (
                <p className="text-xs text-blue-700 mb-2">{mensajeTag}</p>
              )}
              <form className="space-y-3" onSubmit={handleAgregarTag}>
                <input
                  type="text"
                  value={nuevoTag.nombre}
                  onChange={(e) =>
                    setNuevoTag((prev) => ({ ...prev, nombre: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-blue-100 rounded focus:ring-2 focus:ring-blue-400"
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
                  className="w-full px-3 py-2 border border-blue-100 rounded focus:ring-2 focus:ring-blue-400"
                  placeholder="Precio (Bs)"
                />
                <select
                  value={nuevoTag.branch_id}
                  onChange={(e) =>
                    setNuevoTag((prev) => ({ ...prev, branch_id: e.target.value }))
                  }
                  disabled={branches.length === 0}
                  className="w-full px-3 py-2 border border-blue-100 rounded focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
                >
                  <option value="">
                    {branches.length === 0
                      ? "No hay sucursales disponibles"
                      : "Selecciona una sucursal"}
                  </option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.nombre}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={branches.length === 0}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
                >
                  Agregar plato
                </button>
              </form>
              <div className="flex flex-wrap gap-2 mt-4">
                {menuTags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                  >
                    {tag.nombre} · Bs {Number(tag.precio).toFixed(2)} · {tag.branch_nombre}
                    <button
                      type="button"
                      className="text-blue-500 hover:text-blue-700"
                      onClick={() => handleEliminarTag(tag.id)}
                    >
                      ×
                    </button>
                  </span>
                ))}
                {menuTags.length === 0 && (
                  <p className="text-xs text-gray-500">
                    Aún no agregas platos de entrenamiento.
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleEntrenarBot}
              disabled={guardandoBot}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
              {guardandoBot ? "Entrenando..." : "Entrenar Bot"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
