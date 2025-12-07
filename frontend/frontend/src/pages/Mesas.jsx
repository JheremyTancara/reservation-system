import React, { useState, useEffect, useMemo } from "react";
import { useApi } from "../hooks/useApi";
import mesaImg from "../assets/mesa.png";

const ESTADOS_UI = {
  disponible: { label: "Open", color: "bg-green-500" },
  reservada: { label: "Reserved", color: "bg-amber-500" },
  ocupada: { label: "Occupied", color: "bg-red-500" },
  espera: { label: "Waiting", color: "bg-yellow-500" },
  sin_servicio: { label: "No Service", color: "bg-gray-500" },
};

const STATUS_FILTERS = [
  { key: "all", label: "All", color: "bg-gray-400" },
  { key: "reservada", label: "Reserved", color: ESTADOS_UI.reservada.color },
  { key: "ocupada", label: "Occupied", color: ESTADOS_UI.ocupada.color },
  { key: "disponible", label: "Open", color: ESTADOS_UI.disponible.color },
  { key: "espera", label: "Waiting", color: ESTADOS_UI.espera.color },
  { key: "sin_servicio", label: "No Service", color: ESTADOS_UI.sin_servicio.color },
];

const initialForm = (suggestedNumber = 1) => ({
  id: null,
  numero: suggestedNumber,
  capacidad: 4,
  estado: "disponible",
  descripcion: "",
});

const Mesas = () => {
  const api = useApi();
  const [mesas, setMesas] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [formData, setFormData] = useState(initialForm());
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [loadingMesas, setLoadingMesas] = useState(false);

  const calcularSiguienteNumero = () => {
    if (mesas.length === 0) return 1;
    return Math.max(...mesas.map((m) => Number(m.numero))) + 1;
  };

  const fetchMesas = async () => {
    try {
      setLoadingMesas(true);
      const res = await api.get("/mesas");
      const ordenadas = res.data.sort((a, b) => Number(a.numero) - Number(b.numero));
      setMesas(ordenadas);
      const sugerido =
        ordenadas.length === 0
          ? 1
          : Math.max(...ordenadas.map((m) => Number(m.numero))) + 1;
      setFormData((prev) => (prev.id ? prev : { ...prev, numero: sugerido }));
    } catch (err) {
      console.error("Error obteniendo mesas:", err);
      setMesas([]);
      setError("No se pudieron cargar las mesas");
    } finally {
      setLoadingMesas(false);
    }
  };

  const fetchReservas = async () => {
    try {
      const res = await api.get("/reservas");
      setReservas(res.data.slice(0, 20)); // mostrar las más recientes
    } catch (err) {
      console.error("Error obteniendo reservas:", err);
    }
  };

  useEffect(() => {
    fetchMesas();
    fetchReservas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredMesas = useMemo(() => {
    if (statusFilter === "all") return mesas;
    return mesas.filter((mesa) => mesa.estado === statusFilter);
  }, [mesas, statusFilter]);

  const handleEdit = (mesa) => {
    setError("");
    setMensaje("");
    setFormData({
      id: mesa.id,
      numero: mesa.numero,
      capacidad: mesa.capacidad,
      estado: mesa.estado,
      descripcion: mesa.descripcion || "",
    });
  };

  const resetForm = () => {
    setFormData(initialForm(calcularSiguienteNumero()));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMensaje("");

    try {
      const payload = {
        numero: Number(formData.numero),
        capacidad: Number(formData.capacidad),
        estado: formData.estado,
        descripcion: formData.descripcion,
      };

      if (formData.id) {
        await api.put(`/mesas/${formData.id}`, payload);
        setMensaje("Mesa actualizada correctamente");
      } else {
        await api.post("/mesas", payload);
        setMensaje("Mesa creada correctamente");
      }

      resetForm();
      await fetchMesas();
    } catch (err) {
      console.error("Error guardando mesa:", err);
      const msg =
        err.response?.data?.error ||
        "No se pudo guardar la mesa. Intenta nuevamente.";
      setError(msg);
    } finally {
      setSaving(false);
      setTimeout(() => setMensaje(""), 3000);
    }
  };

  const handleDelete = async (mesaId) => {
    const confirmar = window.confirm(
      "¿Seguro que deseas eliminar esta mesa? Esta acción es irreversible."
    );
    if (!confirmar) return;

    setDeletingId(mesaId);
    setError("");
    setMensaje("");
    try {
      await api.delete(`/mesas/${mesaId}`);
      setMensaje("Mesa eliminada");
      if (formData.id === mesaId) {
        resetForm();
      }
      await fetchMesas();
    } catch (err) {
      console.error("Error eliminando mesa:", err);
      const msg =
        err.response?.data?.error ||
        "No se pudo eliminar la mesa. Verifica que no tenga reservas activas.";
      setError(msg);
    } finally {
      setDeletingId(null);
      setTimeout(() => setMensaje(""), 3000);
    }
  };

  const colorForStatus = (estado) =>
    ESTADOS_UI[estado]?.color || ESTADOS_UI.disponible.color;

  return (
    <div className="min-h-screen bg-[#fbeee0] p-6">
      <h1 className="text-3xl font-bold text-orange-600 mb-6">
        Pantalla de selección de mesa
      </h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Panel de mesas */}
        <div className="flex-1">
          <div className="flex flex-wrap gap-2 mb-6 text-sm font-medium">
            {STATUS_FILTERS.map((status) => (
              <button
                key={status.key}
                className={`flex items-center gap-2 px-4 py-1 rounded-full text-white transition ${
                  statusFilter === status.key ? "opacity-100" : "opacity-60"
                } ${status.color}`}
                onClick={() => setStatusFilter(status.key)}
              >
                <span className="w-2 h-2 rounded-full bg-white" />
                {status.label}
              </button>
            ))}
          </div>

          {loadingMesas ? (
            <div className="text-center text-gray-600 py-12">
              Cargando mesas...
            </div>
          ) : filteredMesas.length === 0 ? (
            <div className="text-center text-gray-500 py-12 bg-white/60 rounded-2xl">
              No hay mesas para este filtro. Crea una nueva mesa o cambia el
              filtro de estado.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredMesas.map((mesa) => (
                <div
                  key={mesa.id}
                  className="relative bg-white rounded-3xl shadow-sm px-6 pt-8 pb-5 text-center"
                >
                  <div
                    className={`absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow ${colorForStatus(
                      mesa.estado
                    )}`}
                  >
                    {mesa.capacidad}
                  </div>
                  <img
                    src={mesaImg}
                    alt={`Mesa ${mesa.numero}`}
                    className="mx-auto w-24 h-24 object-contain"
                  />
                  <p className="text-lg font-semibold text-gray-800 mt-4">
                    Mesa {mesa.numero}
                  </p>
                  <p className="text-sm text-gray-500 capitalize">
                    {ESTADOS_UI[mesa.estado]?.label || "Open"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {mesa.descripcion ? mesa.descripcion : "Sin descripción"}
                  </p>
                  {mesa.branch_nombre && (
                    <p className="text-xs text-gray-400 mt-1">
                      {mesa.branch_nombre}
                    </p>
                  )}

                  <div className="flex justify-center gap-3 mt-4 text-sm">
                    <button
                      className="px-3 py-1 rounded-full border border-orange-500 text-orange-600 hover:bg-orange-50"
                      onClick={() => handleEdit(mesa)}
                    >
                      Editar
                    </button>
                    <button
                      className="px-3 py-1 rounded-full border border-red-500 text-red-600 hover:bg-red-50 disabled:opacity-40"
                      onClick={() => handleDelete(mesa.id)}
                      disabled={deletingId === mesa.id}
                    >
                      {deletingId === mesa.id ? "Eliminando..." : "Eliminar"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel lateral */}
        <div className="w-full lg:w-80 flex flex-col gap-6">
          {/* Lista de reservas */}
          <div className="bg-white rounded-3xl shadow-md p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-orange-600">
                Lista de reservas
              </h2>
              <button
                onClick={fetchReservas}
                className="text-sm text-orange-600 hover:text-orange-800"
              >
                ↻
              </button>
            </div>

            {reservas.length === 0 ? (
              <p className="text-sm text-gray-500">
                No hay reservas registradas aún.
              </p>
            ) : (
              <ul className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {reservas.map((reserva) => (
                  <li
                    key={reserva.id}
                    className="flex flex-col gap-1 border-b border-gray-100 pb-2"
                  >
                    <span className="font-semibold text-gray-800 text-sm">
                      {reserva.cliente_nombre}
                    </span>
                    <div className="text-xs text-gray-500 flex justify-between">
                      <span>Mesa {reserva.mesa_numero || "-"}</span>
                      <span>{reserva.hora?.slice(0, 5)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Formulario de creación/edición */}
          <div className="bg-white rounded-3xl shadow-md p-5">
            <h2 className="text-lg font-semibold text-orange-600 mb-3">
              {formData.id ? "Editar mesa" : "Crear mesa"}
            </h2>

            {mensaje && (
              <div className="mb-3 text-sm text-green-600 bg-green-50 p-2 rounded-lg">
                {mensaje}
              </div>
            )}
            {error && (
              <div className="mb-3 text-sm text-red-600 bg-red-50 p-2 rounded-lg">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="text-xs text-gray-500 uppercase">
                  Número de mesa
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.numero}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      numero: e.target.value,
                    }))
                  }
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase">
                  Capacidad (personas)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.capacidad}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      capacidad: e.target.value,
                    }))
                  }
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase">
                  Estado
                </label>
                <select
                  value={formData.estado}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, estado: e.target.value }))
                  }
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 capitalize"
                >
                  {Object.keys(ESTADOS_UI).map((estado) => (
                    <option key={estado} value={estado}>
                      {ESTADOS_UI[estado].label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase">
                  Descripción / Ubicación
                </label>
                <textarea
                  rows={2}
                  value={formData.descripcion}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      descripcion: e.target.value,
                    }))
                  }
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Ej. Terraza, Zona barra, Cerca a ventana"
                  maxLength={255}
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-60"
                >
                  {saving ? "Guardando..." : formData.id ? "Actualizar" : "Crear"}
                </button>
                {formData.id && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mesas;