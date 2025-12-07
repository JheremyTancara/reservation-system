import React, { useState, useEffect, useMemo } from "react";
import { useApi } from "../hooks/useApi";
import fondo from "../assets/fondo-dashboard.png";

const estadosReserva = [
  { value: "pendiente", label: "Pendiente" },
  { value: "confirmada", label: "Confirmada" },
  { value: "cancelada", label: "Cancelada" },
];

const Reservas = () => {
  const api = useApi();

  const [reservas, setReservas] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [reservaAEliminar, setReservaAEliminar] = useState(null);
  const [loadingReservas, setLoadingReservas] = useState(false);
  const [loadingMesas, setLoadingMesas] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    cliente_nombre: "",
    personas: "",
    fecha: "",
    hora: "",
    estado: "pendiente",
    mesa_id: "",
  });

  const obtenerReservas = async () => {
    try {
      setLoadingReservas(true);
      const res = await api.get("/reservas/complete");
    setReservas(res.data);
    } catch (err) {
      console.error("Error obteniendo reservas:", err);
      setReservas([]);
    } finally {
      setLoadingReservas(false);
    }
  };

  const obtenerMesas = async () => {
    try {
      setLoadingMesas(true);
      const res = await api.get("/mesas");
      setMesas(res.data);
    } catch (err) {
      console.error("Error obteniendo mesas:", err);
      setMesas([]);
    } finally {
      setLoadingMesas(false);
    }
  };

  const confirmarEliminar = (reserva) => {
    setReservaAEliminar(reserva);
    setMostrarModal(true);
  };

  const eliminarReserva = async () => {
    try {
      await api.delete(`/reservas/${reservaAEliminar.id}`);
      setMostrarModal(false);
      setReservaAEliminar(null);
      await obtenerReservas();
    } catch (err) {
      console.error("Error al eliminar reserva:", err);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
    setMensaje("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");

    if (!formData.cliente_nombre.trim()) {
      setError("El nombre del cliente es obligatorio");
      return;
    }
    if (!formData.fecha) {
      setError("Debes seleccionar una fecha");
      return;
    }
    if (!formData.hora) {
      setError("Debes seleccionar una hora");
      return;
    }
    if (!formData.personas || Number(formData.personas) <= 0) {
      setError("Ingrese la cantidad de personas");
      return;
    }
    if (!formData.mesa_id) {
      setError("Selecciona una mesa disponible");
      return;
    }

    const mesaSeleccionada = mesas.find((m) => m.id === Number(formData.mesa_id));
    const payload = {
      cliente_nombre: formData.cliente_nombre.trim(),
      personas: Number(formData.personas),
      fecha: formData.fecha,
      hora: formData.hora,
      estado: formData.estado,
      mesa_id: Number(formData.mesa_id),
      branch_id: mesaSeleccionada?.branch_id || null,
    };

    try {
      setGuardando(true);
      await api.post("/reservas", payload);
      setMensaje("Reserva registrada correctamente");
      setFormData({
        cliente_nombre: "",
        personas: "",
        fecha: "",
        hora: "",
        estado: "pendiente",
        mesa_id: "",
      });
      await obtenerReservas();
    } catch (err) {
      console.error("Error registrando reserva:", err);
      const msg =
        err.response?.data?.error ||
        "No se pudo registrar la reserva. Verifica los datos.";
      setError(msg);
    } finally {
      setGuardando(false);
      setTimeout(() => setMensaje(""), 3000);
    }
  };

  useEffect(() => {
    obtenerReservas();
    obtenerMesas();
  }, []);

  const reservasFiltradas = useMemo(() => {
    return reservas.filter((r) =>
    r.cliente_nombre.toLowerCase().includes(filtro.toLowerCase())
  );
  }, [reservas, filtro]);

  return (
    <div
      className="min-h-screen p-6 bg-cover bg-center"
      style={{ backgroundImage: `url(${fondo})` }}
    >
      <div className="max-w-6xl mx-auto bg-white/90 backdrop-blur p-6 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-orange-600 mb-2">Reservas</h1>
        <p className="text-gray-600 mb-8">
          Registra nuevas reservas y revisa las existentes de tu restaurante.
        </p>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-2 gap-6 mb-4">
          <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4 border border-orange-100">
          <div>
              <label className="text-sm font-medium text-gray-600">
                Nombre del cliente
              </label>
            <input 
              type="text" 
                value={formData.cliente_nombre}
                onChange={(e) => handleChange("cliente_nombre", e.target.value)}
                className="mt-1 w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                placeholder="Rodrigo"
              />
          </div>

          <div>
              <label className="text-sm font-medium text-gray-600">Fecha</label>
            <input 
                type="date"
                value={formData.fecha}
                onChange={(e) => handleChange("fecha", e.target.value)}
                className="mt-1 w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500"
              />
          </div>

          <div>
              <label className="text-sm font-medium text-gray-600">Mesa</label>
              <select
                value={formData.mesa_id}
                onChange={(e) => handleChange("mesa_id", e.target.value)}
                className="mt-1 w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500"
              >
                <option value="">
                  {loadingMesas ? "Cargando mesas..." : "Selecciona una mesa"}
                </option>
                {mesas.map((mesa) => (
                  <option key={mesa.id} value={mesa.id}>
                    Mesa {mesa.numero} · Cap {mesa.capacidad} ·{" "}
                    {mesa.descripcion || "Sin descripción"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4 border border-orange-100">
            <div>
              <label className="text-sm font-medium text-gray-600">
                Número de personas
              </label>
            <input 
                type="number"
                min="1"
                value={formData.personas}
                onChange={(e) => handleChange("personas", e.target.value)}
                className="mt-1 w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                placeholder="3"
              />
          </div>

          <div>
              <label className="text-sm font-medium text-gray-600">Hora</label>
            <input 
              type="time" 
                value={formData.hora}
                onChange={(e) => handleChange("hora", e.target.value)}
                className="mt-1 w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500"
              />
          </div>

          <div>
              <label className="text-sm font-medium text-gray-600">Estado</label>
            <select 
                value={formData.estado}
                onChange={(e) => handleChange("estado", e.target.value)}
                className="mt-1 w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500"
              >
                {estadosReserva.map((estado) => (
                  <option key={estado.value} value={estado.value}>
                    {estado.label}
                </option>
              ))}
            </select>
          </div>
          </div>
        </form>

        {(error || mensaje) && (
              <div
            className={`mb-4 px-4 py-3 rounded-xl text-sm ${
              error
                ? "bg-red-50 text-red-700 border border-red-100"
                : "bg-green-50 text-green-700 border border-green-100"
            }`}
          >
            {error || mensaje}
            </div>
          )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={guardando}
          className="w-full bg-orange-500 text-white rounded-xl py-3 font-semibold shadow hover:bg-orange-600 transition disabled:opacity-60"
        >
          {guardando ? "Registrando..." : "Registrar reserva"}
        </button>

        <div className="mt-6 flex items-center bg-white rounded-full shadow px-4 py-2 border border-gray-100">
        <input
          type="text"
            placeholder="Buscar por cliente"
            className="flex-1 outline-none px-2 text-sm"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
          <span className="text-gray-400 text-xl">🔍</span>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loadingReservas ? (
            <div className="col-span-full text-center text-gray-500 py-12">
              Cargando reservas...
            </div>
          ) : reservasFiltradas.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 py-12">
              No hay reservas con ese filtro.
            </div>
          ) : (
            reservasFiltradas.map((reserva) => (
              <div key={reserva.id} className="bg-white rounded-2xl shadow p-4 border border-gray-100">
                <h3 className="text-xl font-semibold text-orange-600">
                  {reserva.cliente_nombre}
                </h3>
                <p className="text-sm text-gray-500">{reserva.branch_nombre || ""}</p>
                <div className="mt-3 space-y-1 text-sm text-gray-600">
                  <p>Personas: {reserva.personas}</p>
                  <p>Fecha: {reserva.fecha}</p>
                  <p>Hora: {reserva.hora}</p>
                  <p>Mesa: {reserva.mesa_numero || "No asignada"}</p>
                </div>
                <p
                  className={`mt-2 text-sm font-semibold ${
                    reserva.estado === "confirmada"
                      ? "text-green-600"
                      : reserva.estado === "cancelada"
                      ? "text-red-600"
                      : "text-amber-600"
                  }`}
                >
                Estado: {reserva.estado}
              </p>

                {reserva.platos && reserva.platos.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                    <h4 className="font-semibold text-gray-800 mb-2 text-sm">
                      Platos incluidos
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                    {reserva.platos.map((plato, idx) => (
                        <li key={idx} className="flex justify-between text-xs">
                        <span>{plato.nombre}</span>
                        <span className="font-medium">Bs {plato.precio}</span>
                      </li>
                    ))}
                  </ul>
                    <div className="mt-2 pt-2 border-t flex justify-between text-sm font-semibold">
                      <span>Total</span>
                      <span>
                        Bs{" "}
                        {Number.isFinite(Number(reserva.total))
                          ? Number(reserva.total).toFixed(2)
                          : "0.00"}
                      </span>
                  </div>
                </div>
              )}

                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => confirmarEliminar(reserva)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Eliminar
                  </button>
              </div>
            </div>
            ))
          )}
        </div>
      </div>

      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              ¿Deseas eliminar esta reserva?
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setMostrarModal(false)}
                className="px-4 py-2 text-sm bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={eliminarReserva}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reservas;
