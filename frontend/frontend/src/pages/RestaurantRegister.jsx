import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registrarRestauranteConPago } from "../services/userService";
// Usar ruta absoluta desde public o importar desde assets
import QRPayment from "../../assets/QR_Pagement.jpeg";

const RestaurantRegister = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [formData, setFormData] = useState({
    restaurant_name: "",
    restaurant_email: "",
    restaurant_password: "",
    restaurant_phone: "",
    restaurant_address: "",
    restaurant_description: "",
  });

  const [files, setFiles] = useState({
    logo: null,
    cover: null,
    payment_proof: null,
  });

  const [previews, setPreviews] = useState({
    logo: null,
    cover: null,
    payment_proof: null,
  });

  const [port, setPort] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleFileChange = (field, e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError(`El archivo ${field} no debe superar los 10MB`);
        return;
      }
      setFiles((prev) => ({ ...prev, [field]: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setError("");

    if (
      !formData.restaurant_name.trim() ||
      !formData.restaurant_email.trim() ||
      !formData.restaurant_password.trim()
    ) {
      setError("Nombre, email y contraseña son obligatorios");
      return;
    }

    // Simular obtención de puerto (en producción vendría del backend)
    // Por ahora, generamos uno aleatorio para mostrar
    const randomPort = 3003 + Math.floor(Math.random() * 100);
    setPort(randomPort);
    setStep(2);
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");

    if (!files.payment_proof) {
      setError("Debes subir el comprobante de pago");
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Debes iniciar sesión primero");
      }

      // Obtener datos del usuario desde localStorage
      const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
      if (!usuario.id) {
        throw new Error("Usuario no válido");
      }

      const formDataToSend = new FormData();
      formDataToSend.append("user_id", usuario.id);
      formDataToSend.append("restaurant_name", formData.restaurant_name);
      formDataToSend.append("restaurant_email", formData.restaurant_email);
      formDataToSend.append("restaurant_password", formData.restaurant_password);
      formDataToSend.append("restaurant_phone", formData.restaurant_phone || "");
      formDataToSend.append("restaurant_address", formData.restaurant_address || "");
      formDataToSend.append("restaurant_description", formData.restaurant_description || "");

      if (files.logo) formDataToSend.append("logo", files.logo);
      if (files.cover) formDataToSend.append("cover", files.cover);
      if (files.payment_proof) formDataToSend.append("payment_proof", files.payment_proof);

      const response = await registrarRestauranteConPago(formDataToSend);

      setMensaje(
        `Solicitud enviada exitosamente. Puerto asignado: ${response.data.port}. Revisa tu correo para más información.`
      );

      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (err) {
      console.error("Error registrando restaurante:", err);
      setError(
        err.response?.data?.error || err.message || "Error al registrar el restaurante"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Registro de Restaurante
          </h1>

          {/* Indicador de pasos */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step >= 1
                    ? "bg-orange-500 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                1
              </div>
              <div
                className={`h-1 w-20 ${
                  step >= 2 ? "bg-orange-500" : "bg-gray-200"
                }`}
              />
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step >= 2
                    ? "bg-orange-500 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                2
              </div>
            </div>
          </div>

          {mensaje && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
              {mensaje}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Paso 1: Información del restaurante */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Información del Restaurante
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Restaurante *
                  </label>
                  <input
                    type="text"
                    name="restaurant_name"
                    value={formData.restaurant_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Ej: Guss Restobar"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email del Restaurante *
                  </label>
                  <input
                    type="email"
                    name="restaurant_email"
                    value={formData.restaurant_email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="restaurante@correo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña *
                  </label>
                  <input
                    type="password"
                    name="restaurant_password"
                    value={formData.restaurant_password}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="********"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="restaurant_phone"
                    value={formData.restaurant_phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="+51 999 999 999"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección
                  </label>
                  <input
                    type="text"
                    name="restaurant_address"
                    value={formData.restaurant_address}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Av. Siempre Viva 742"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    name="restaurant_description"
                    value={formData.restaurant_description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Breve descripción de tu restaurante..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo del Restaurante
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange("logo", e)}
                    className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  {previews.logo && (
                    <img
                      src={previews.logo}
                      alt="Logo preview"
                      className="mt-2 w-32 h-32 object-cover rounded"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imagen de Portada
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange("cover", e)}
                    className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  {previews.cover && (
                    <img
                      src={previews.cover}
                      alt="Cover preview"
                      className="mt-2 w-full h-32 object-cover rounded"
                    />
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition"
                >
                  Siguiente: Pago
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {/* Paso 2: Pago */}
          {step === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Información de Pago
              </h2>

              {port && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-700">
                    <strong>Puerto asignado:</strong> {port}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Este será el puerto donde se ejecutará tu instancia del restaurante
                  </p>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Escanea el código QR para realizar el pago
                </h3>
                <div className="flex justify-center">
                  <img
                    src={QRPayment}
                    alt="QR de pago"
                    className="w-64 h-64 border-2 border-gray-300 rounded-lg"
                  />
                </div>
                <p className="text-sm text-gray-600 mt-4">
                  Después de realizar el pago, sube el comprobante a continuación
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comprobante de Pago *
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange("payment_proof", e)}
                  required
                  className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                {previews.payment_proof && (
                  <div className="mt-2">
                    <img
                      src={previews.payment_proof}
                      alt="Payment proof preview"
                      className="w-full max-w-md h-64 object-contain border rounded"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition"
                >
                  Anterior
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition disabled:opacity-50"
                >
                  {loading ? "Enviando..." : "Enviar Solicitud"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantRegister;

