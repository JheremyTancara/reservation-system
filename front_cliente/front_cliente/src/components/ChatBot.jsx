import axios from "axios";
import React, { useEffect, useState } from "react";
import fondo from "../assets/fondo-dashboard.png";
import logo from "../assets/logo-guss.png";
import pizzaBg from "../assets/pizza_dashboard.jpg";
import pizzaLogo from "../assets/pizza_logo.png";

const ChatBot = ({ restaurant }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [step, setStep] = useState(0);
  const [sucursales, setSucursales] = useState([]);
  const [selectedSucursal, setSelectedSucursal] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showConfirmButton, setShowConfirmButton] = useState(false);
  const [suggestedSucursal, setSuggestedSucursal] = useState(null);
  const [mesasDisponibles, setMesasDisponibles] = useState([]);
  const [reservaData, setReservaData] = useState({
    cliente_nombre: "",
    personas: "",
    fecha: "",
    hora: "",
    mesa_id: "",
    estado: "pendiente",
    branch_id: null,
  });
  const [showQR, setShowQR] = useState(false);
  const [waitingForPayment, setWaitingForPayment] = useState(false);
  const [waitingForComprobante, setWaitingForComprobante] = useState(false);
  const [reservaPendiente, setReservaPendiente] = useState(null);
  const [showComprobanteButtons, setShowComprobanteButtons] = useState(false);
  const [inputDisabled, setInputDisabled] = useState(false);
  const [isFarewell, setIsFarewell] = useState(false);
  const [isLastMessage, setIsLastMessage] = useState(false);

  // API base URL del restaurante específico
  const port = window.location.port;
  const isPizza = port === "3002";
  const apiUrl = `http://localhost:${port}/api`;

  // Horarios disponibles
  const horariosDisponibles = [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
    "21:00",
    "22:00",
  ];

  // Obtener días disponibles del mes actual
  const getDiasDisponibles = () => {
    const hoy = new Date();
    const ultimoDia = new Date(
      hoy.getFullYear(),
      hoy.getMonth() + 1,
      0
    ).getDate();
    const dias = [];
    for (let i = hoy.getDate(); i <= ultimoDia; i++) {
      dias.push(i);
    }
    return dias;
  };

  // Obtener mesas de la sucursal
  const fetchMesasDisponibles = async (branchId) => {
    try {
      console.log("Obteniendo mesas disponibles para branch:", branchId);
      const response = await axios.get(`${apiUrl}/mesas?branch_id=${branchId}`);
      console.log("Respuesta de mesas disponibles:", response.data);

      if (response.data && Array.isArray(response.data)) {
        setMesasDisponibles(response.data);
      } else {
        console.error("Formato de respuesta de mesas inválido:", response.data);
        setMessages((prev) => [
          ...prev,
          {
            from: "bot",
            text: "Error al cargar las mesas disponibles. Por favor, intenta de nuevo.",
          },
        ]);
      }
    } catch (error) {
      console.error("Error al obtener mesas:", error);
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: "Error al cargar las mesas disponibles. Por favor, intenta de nuevo.",
        },
      ]);
    }
  };

  useEffect(() => {
    console.log("[ChatBot] useEffect ejecutado");
    console.log("[ChatBot] restaurant:", restaurant);
    console.log("[ChatBot] API_BASE_URL:", apiUrl);
    const fetchSucursales = async () => {
      try {
        console.log(
          "[ChatBot] Fetching sucursales from:",
          `${apiUrl}/branches`
        );
        const response = await axios.get(`${apiUrl}/branches`);
        console.log("[ChatBot] Sucursales response:", response.data);
        if (!response.data || !Array.isArray(response.data)) {
          setMessages([
            {
              from: "bot",
              text: "Error al cargar las sucursales. Por favor, intenta de nuevo.",
            },
          ]);
          return;
        }
        setSucursales(response.data);
        const bienvenida = `Bienvenido a ${restaurant?.name} 🍽️. ¿En qué sucursal estás interesado?`;
        setMessages([{ from: "bot", text: bienvenida }]);
        setStep(1);
      } catch (error) {
        console.error("[ChatBot] Error al cargar sucursales:", error);
        setMessages([
          {
            from: "bot",
            text: "Error al cargar las sucursales. Por favor, intenta de nuevo.",
          },
        ]);
      }
    };
    if (restaurant) {
      fetchSucursales();
    }
  }, [restaurant, apiUrl]);

  const handleSucursalSelect = async (sucursal) => {
    setInput(sucursal.nombre);
    await handleSend(sucursal.nombre);
  };

  const handleItemSelect = (item) => {
    setSelectedItems((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      if (exists) {
        return prev.filter((i) => i.id !== item.id);
      }
      return [...prev, item];
    });
    setShowConfirmButton(true);
  };

  const handleConfirmSelection = () => {
    if (selectedItems.length === 0) {
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: "Por favor, selecciona al menos un plato antes de continuar.",
        },
      ]);
      return;
    }

    // Agrupar items por nombre y contar cantidad
    const itemsAgrupados = selectedItems.reduce((acc, item) => {
      if (!acc[item.nombre]) {
        acc[item.nombre] = {
          cantidad: 0,
          precio: parseFloat(item.precio) || 0,
          total: 0,
        };
      }
      acc[item.nombre].cantidad += 1;
      acc[item.nombre].total =
        acc[item.nombre].cantidad * acc[item.nombre].precio;
      return acc;
    }, {});

    // Crear el resumen del pedido
    const resumen = Object.entries(itemsAgrupados)
      .map(
        ([nombre, datos]) =>
          `- ${nombre} x${datos.cantidad}: Bs. ${Number(datos.total).toFixed(
            2
          )}`
      )
      .join("\n");

    // Calcular el total
    const total = selectedItems.reduce((sum, item) => {
      const precio = parseFloat(item.precio) || 0;
      return sum + precio;
    }, 0);

    setMessages((prev) => [
      ...prev,
      {
        from: "bot",
        text: `Perfecto! Tu pedido es:\n\n${resumen}\n\nTotal: Bs. ${total.toFixed(
          2
        )}\n\n¿Confirmas tu pedido?`,
      },
    ]);
    setStep(6);
  };

  const findSimilarSucursal = (input) => {
    const normalizedInput = input.toLowerCase().trim();

    const normalizeText = (text) => {
      return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, "");
    };

    // Buscar coincidencias exactas primero
    const exactMatch = sucursales.find(
      (sucursal) =>
        normalizeText(sucursal.nombre) === normalizedInput ||
        normalizeText(sucursal.nombre).includes(normalizedInput) ||
        normalizedInput.includes(normalizeText(sucursal.nombre))
    );

    if (exactMatch) {
      return exactMatch;
    }

    // Buscar coincidencias parciales
    const partialMatches = sucursales.filter((sucursal) =>
      normalizeText(sucursal.nombre).includes(normalizedInput)
    );

    if (partialMatches.length === 1) {
      return partialMatches[0];
    }

    // Si hay múltiples coincidencias, sugerir la primera
    if (partialMatches.length > 1) {
      setSuggestedSucursal(partialMatches[0]);
      return null;
    }

    return null;
  };

  const guardarReserva = async () => {
    try {
      const reservaCompleta = {
        ...reservaData,
        platos: selectedItems.map((item) => ({
          menu_item_id: item.id,
          nombre: item.nombre,
          precio: item.precio,
        })),
      };

      console.log("Enviando reserva:", reservaCompleta);

      const response = await axios.post(`${apiUrl}/reservas`, reservaCompleta);

      console.log("Respuesta de la reserva:", response.data);

      if (response.data && response.data.id) {
        setReservaPendiente(response.data);
        setMessages((prev) => [
          ...prev,
          {
            from: "bot",
            text: `¡Excelente! Tu reserva ha sido creada exitosamente.\n\nReserva #${
              response.data.id
            }\nTotal: Bs. ${
              response.data.total || total.toFixed(2)
            }\n\nAhora necesitamos confirmar el pago. ¿Cómo deseas pagar?`,
          },
        ]);
        setStep(7);
      } else {
        throw new Error("No se recibió ID de reserva");
      }
    } catch (error) {
      console.error("Error al guardar la reserva:", error);
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: "Hubo un error al procesar tu reserva. Por favor, intenta de nuevo o contacta al restaurante.",
        },
      ]);
    }
  };

  const handleReservaInput = async (inputText) => {
    const normalizedInput = inputText.toLowerCase().trim();

    if (step === 1) {
      // Selección de sucursal
      const sucursalEncontrada = findSimilarSucursal(inputText);
      if (sucursalEncontrada) {
        setSelectedSucursal(sucursalEncontrada);
        setReservaData((prev) => ({
          ...prev,
          branch_id: sucursalEncontrada.id,
        }));
        setMessages((prev) => [
          ...prev,
          { from: "user", text: inputText },
          {
            from: "bot",
            text: `Perfecto! Has seleccionado ${sucursalEncontrada.nombre}. Ahora, ¿qué te gustaría hacer?\n\n1. Ver el menú\n2. Hacer una reserva`,
          },
        ]);
        setStep(2);
      } else if (suggestedSucursal) {
        setMessages((prev) => [
          ...prev,
          { from: "user", text: inputText },
          {
            from: "bot",
            text: `¿Te refieres a ${suggestedSucursal.nombre}? Responde "sí" para confirmar o "no" para buscar otra sucursal.`,
          },
        ]);
        setStep(1.5);
      } else {
        setMessages((prev) => [
          ...prev,
          { from: "user", text: inputText },
          {
            from: "bot",
            text: `No encontré la sucursal "${inputText}". Por favor, selecciona una de las siguientes:\n\n${sucursales
              .map((s, i) => `${i + 1}. ${s.nombre}`)
              .join("\n")}`,
          },
        ]);
      }
    } else if (step === 1.5) {
      // Confirmación de sucursal sugerida
      if (
        normalizedInput === "sí" ||
        normalizedInput === "si" ||
        normalizedInput === "yes"
      ) {
        setSelectedSucursal(suggestedSucursal);
        setReservaData((prev) => ({
          ...prev,
          branch_id: suggestedSucursal.id,
        }));
        setSuggestedSucursal(null);
        setMessages((prev) => [
          ...prev,
          { from: "user", text: inputText },
          {
            from: "bot",
            text: `Perfecto! Has seleccionado ${suggestedSucursal.nombre}. Ahora, ¿qué te gustaría hacer?\n\n1. Ver el menú\n2. Hacer una reserva`,
          },
        ]);
        setStep(2);
      } else {
        setSuggestedSucursal(null);
        setMessages((prev) => [
          ...prev,
          { from: "user", text: inputText },
          {
            from: "bot",
            text: `Entendido. Por favor, selecciona una de las siguientes sucursales:\n\n${sucursales
              .map((s, i) => `${i + 1}. ${s.nombre}`)
              .join("\n")}`,
          },
        ]);
        setStep(1);
      }
    } else if (step === 2) {
      // Selección de acción
      if (
        normalizedInput === "1" ||
        normalizedInput.includes("menú") ||
        normalizedInput.includes("menu")
      ) {
        setMessages((prev) => [
          ...prev,
          { from: "user", text: inputText },
          {
            from: "bot",
            text: "Aquí tienes nuestro menú. Selecciona los platos que te gustaría ordenar:",
          },
        ]);
        setStep(3);
        await fetchMenu();
      } else if (
        normalizedInput === "2" ||
        normalizedInput.includes("reserva")
      ) {
        setMessages((prev) => [
          ...prev,
          { from: "user", text: inputText },
          {
            from: "bot",
            text: "Perfecto! Vamos a hacer tu reserva. Primero, ¿cuál es tu nombre completo?",
          },
        ]);
        setStep(4);
      } else {
        setMessages((prev) => [
          ...prev,
          { from: "user", text: inputText },
          {
            from: "bot",
            text: "Por favor, selecciona una opción:\n\n1. Ver el menú\n2. Hacer una reserva",
          },
        ]);
      }
    } else if (step === 3) {
      // Selección de platos del menú
      if (normalizedInput === "confirmar" || normalizedInput === "confirmo") {
        handleConfirmSelection();
      } else {
        setMessages((prev) => [
          ...prev,
          { from: "user", text: inputText },
          {
            from: "bot",
            text: "Por favor, selecciona los platos haciendo clic en ellos y luego presiona 'Confirmar selección'.",
          },
        ]);
      }
    } else if (step === 4) {
      // Nombre del cliente
      setReservaData((prev) => ({ ...prev, cliente_nombre: inputText }));
      setMessages((prev) => [
        ...prev,
        { from: "user", text: inputText },
        {
          from: "bot",
          text: `Gracias ${inputText}! ¿Para cuántas personas es la reserva?`,
        },
      ]);
      setStep(4.1);
    } else if (step === 4.1) {
      // Número de personas
      const personas = parseInt(inputText);
      if (isNaN(personas) || personas < 1 || personas > 20) {
        setMessages((prev) => [
          ...prev,
          { from: "user", text: inputText },
          {
            from: "bot",
            text: "Por favor, ingresa un número válido de personas (1-20).",
          },
        ]);
        return;
      }
      setReservaData((prev) => ({ ...prev, personas }));
      setMessages((prev) => [
        ...prev,
        { from: "user", text: inputText },
        {
          from: "bot",
          text: `Perfecto! ¿Para qué fecha quieres la reserva? (día del mes, por ejemplo: 15)`,
        },
      ]);
      setStep(4.2);
    } else if (step === 4.2) {
      // Fecha
      const dia = parseInt(inputText);
      const diasDisponibles = getDiasDisponibles();
      if (isNaN(dia) || !diasDisponibles.includes(dia)) {
        setMessages((prev) => [
          ...prev,
          { from: "user", text: inputText },
          {
            from: "bot",
            text: `Por favor, ingresa un día válido del mes actual (${
              diasDisponibles[0]
            }-${diasDisponibles[diasDisponibles.length - 1]}).`,
          },
        ]);
        return;
      }
      const fecha = new Date();
      fecha.setDate(dia);
      const fechaFormateada = fecha.toISOString().split("T")[0];
      setReservaData((prev) => ({ ...prev, fecha: fechaFormateada }));
      setMessages((prev) => [
        ...prev,
        { from: "user", text: inputText },
        {
          from: "bot",
          text: `Excelente! ¿A qué hora? Aquí tienes los horarios disponibles:\n\n${horariosDisponibles.join(
            ", "
          )}`,
        },
      ]);
      setStep(4.3);
    } else if (step === 4.3) {
      // Hora
      if (!horariosDisponibles.includes(inputText)) {
        setMessages((prev) => [
          ...prev,
          { from: "user", text: inputText },
          {
            from: "bot",
            text: `Por favor, selecciona un horario válido:\n\n${horariosDisponibles.join(
              ", "
            )}`,
          },
        ]);
        return;
      }
      setReservaData((prev) => ({ ...prev, hora: inputText }));
      setMessages((prev) => [
        ...prev,
        { from: "user", text: inputText },
        {
          from: "bot",
          text: "Perfecto! Ahora vamos a verificar las mesas disponibles y crear tu reserva.",
        },
      ]);
      setStep(5);
      await fetchMesasDisponibles(selectedSucursal.id);
      setTimeout(() => {
        guardarReserva();
      }, 1000);
    } else if (step === 6) {
      // Confirmación de pedido
      if (
        normalizedInput === "sí" ||
        normalizedInput === "si" ||
        normalizedInput === "confirmo"
      ) {
        setMessages((prev) => [
          ...prev,
          { from: "user", text: inputText },
          {
            from: "bot",
            text: "¡Excelente! Tu pedido ha sido confirmado. Ahora vamos a procesar el pago.",
          },
        ]);
        setStep(7);
      } else {
        setMessages((prev) => [
          ...prev,
          { from: "user", text: inputText },
          {
            from: "bot",
            text: "Entendido. ¿Te gustaría modificar tu pedido o cancelar?",
          },
        ]);
        setStep(3);
      }
    } else if (step === 7) {
      // Método de pago
      if (
        normalizedInput.includes("qr") ||
        normalizedInput.includes("transferencia")
      ) {
        setMessages((prev) => [
          ...prev,
          { from: "user", text: inputText },
          {
            from: "bot",
            text: "Perfecto! Aquí tienes el código QR para realizar el pago:",
          },
        ]);
        setShowQR(true);
        setWaitingForPayment(true);
        setStep(8);
      } else if (
        normalizedInput.includes("efectivo") ||
        normalizedInput.includes("cash")
      ) {
        setMessages((prev) => [
          ...prev,
          { from: "user", text: inputText },
          {
            from: "bot",
            text: "Perfecto! Pago en efectivo. Tu reserva está confirmada. ¿Necesitas algo más?",
          },
        ]);
        setStep(9);
      } else {
        setMessages((prev) => [
          ...prev,
          { from: "user", text: inputText },
          {
            from: "bot",
            text: "Por favor, selecciona un método de pago:\n\n- QR/Transferencia\n- Efectivo",
          },
        ]);
      }
    } else if (step === 8) {
      // Esperando confirmación de pago
      if (normalizedInput === "pagado" || normalizedInput === "confirmo") {
        setWaitingForPayment(false);
        setShowQR(false);
        setMessages((prev) => [
          ...prev,
          { from: "user", text: inputText },
          {
            from: "bot",
            text: "¡Excelente! Pago confirmado. Tu reserva está lista. ¿Necesitas algo más?",
          },
        ]);
        setStep(9);
      } else {
        setMessages((prev) => [
          ...prev,
          { from: "user", text: inputText },
          {
            from: "bot",
            text: "Por favor, confirma cuando hayas realizado el pago escribiendo 'pagado'.",
          },
        ]);
      }
    } else if (step === 9) {
      // Despedida
      if (normalizedInput === "no" || normalizedInput === "gracias") {
        setMessages((prev) => [
          ...prev,
          { from: "user", text: inputText },
          {
            from: "bot",
            text: "¡Perfecto! Gracias por elegirnos. Tu reserva está confirmada. ¡Que disfrutes tu comida! 🍽️",
          },
        ]);
        setIsFarewell(true);
        setInputDisabled(true);
      } else {
        setMessages((prev) => [
          ...prev,
          { from: "user", text: inputText },
          {
            from: "bot",
            text: "¿En qué más puedo ayudarte?",
          },
        ]);
      }
    }
  };

  const fetchMenu = async () => {
    try {
      const response = await axios.get(`${apiUrl}/menu`);
      setMenuItems(response.data);
    } catch (error) {
      console.error("Error al obtener el menú:", error);
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: "Error al cargar el menú. Por favor, intenta de nuevo.",
        },
      ]);
    }
  };

  const handleSend = async (inputText = input) => {
    if (!inputText.trim() || inputDisabled) return;

    setInput("");
    await handleReservaInput(inputText);
  };

  const handlePagoConfirmado = () => {
    setWaitingForPayment(false);
    setShowQR(false);
    setMessages((prev) => [
      ...prev,
      {
        from: "bot",
        text: "¡Excelente! Pago confirmado. Tu reserva está lista. ¿Necesitas algo más?",
      },
    ]);
    setStep(9);
  };

  const handleWhatsAppClick = () => {
    const message = `Hola! Tengo una consulta sobre mi reserva en ${
      restaurant?.name || "Guss Restobar"
    }.`;
    const whatsappUrl = `https://wa.me/591777888999?text=${encodeURIComponent(
      message
    )}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleComprobanteConfirmado = () => {
    setWaitingForComprobante(false);
    setShowComprobanteButtons(false);
    setMessages((prev) => [
      ...prev,
      {
        from: "bot",
        text: "¡Perfecto! Comprobante recibido. Tu reserva está confirmada. ¿Necesitas algo más?",
      },
    ]);
    setStep(9);
  };

  const handleComprobanteCancelado = () => {
    setWaitingForComprobante(false);
    setShowComprobanteButtons(false);
    setMessages((prev) => [
      ...prev,
      {
        from: "bot",
        text: "Entendido. Tu reserva sigue pendiente. ¿Te gustaría intentar con otro método de pago?",
      },
    ]);
    setStep(7);
  };

  const handleComprobanteNoPudo = () => {
    setWaitingForComprobante(false);
    setShowComprobanteButtons(false);
    setMessages((prev) => [
      ...prev,
      {
        from: "bot",
        text: "No te preocupes. Puedes enviar el comprobante más tarde por WhatsApp. Tu reserva está pendiente. ¿Necesitas algo más?",
      },
    ]);
    setStep(9);
  };

  const handlePagoCancelado = () => {
    setWaitingForPayment(false);
    setShowQR(false);
    setMessages((prev) => [
      ...prev,
      {
        from: "bot",
        text: "Entendido. ¿Te gustaría intentar con otro método de pago o cancelar la reserva?",
      },
    ]);
    setStep(7);
  };

  const renderMenuItems = () => {
    if (!menuItems || menuItems.length === 0) {
      return (
        <div className="text-center py-4">
          <p className="text-gray-500">
            No hay platos disponibles en este momento.
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto">
        {menuItems.map((item) => {
          const isSelected = selectedItems.some(
            (selected) => selected.id === item.id
          );
          return (
            <div
              key={item.id}
              onClick={() => handleItemSelect(item)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                isSelected
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{item.nombre}</h4>
                  {item.descripcion && (
                    <p className="text-sm text-gray-600 mt-1">
                      {item.descripcion}
                    </p>
                  )}
                  <p className="text-lg font-bold text-blue-600 mt-2">
                    Bs. {parseFloat(item.precio).toFixed(2)}
                  </p>
                </div>
                {isSelected && (
                  <div className="ml-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">✓</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center"
      style={{
        backgroundImage: `url(${isPizza ? pizzaBg : fondo})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="flex flex-col h-[80vh] w-full max-w-3xl mx-auto bg-white/80 rounded-lg shadow-lg mt-8 mb-8 p-0">
        {/* Header */}
        <div className="w-full flex items-center justify-between bg-white/90 rounded-t-lg py-4 px-8 border-b">
          <div className="flex items-center space-x-4">
            <img
              src={isPizza ? pizzaLogo : logo}
              alt="Logo"
              className="w-12 h-12"
            />
            <div>
              <h1
                className={`text-xl font-bold ${
                  isPizza ? "text-red-700" : "text-black"
                }`}
              >
                {restaurant?.name}
              </h1>
              <p className="text-sm text-gray-700">
                Sistema de Reservas y Chatbot
              </p>
            </div>
          </div>
          <button
            onClick={handleWhatsAppClick}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
            </svg>
            <span>WhatsApp</span>
          </button>
        </div>
        {/* Chat Container */}
        <div className="flex-1 flex overflow-hidden">
          {/* Messages */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.from === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.from === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-white text-gray-900 border border-gray-200"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.text}</p>
                  </div>
                </div>
              ))}
              {/* Sucursales */}
              {step === 1 && (
                <div className="bg-white/90 rounded-lg shadow-sm border p-4">
                  <h3 className="text-lg font-semibold mb-4 text-black">
                    Sucursales disponibles
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sucursales.map((sucursal) => (
                      <div
                        key={sucursal.id}
                        onClick={() => handleSucursalSelect(sucursal)}
                        className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors"
                      >
                        <h4 className="font-semibold text-gray-900">
                          {sucursal.nombre}
                        </h4>
                        {sucursal.telefono && (
                          <p className="text-sm text-gray-700">
                            Tel: {sucursal.telefono}
                          </p>
                        )}
                        {sucursal.direccion && (
                          <p className="text-sm text-gray-700">
                            {sucursal.direccion}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Input */}
            {!inputDisabled && (
              <div className="border-t bg-white/90 p-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Escribe tu mensaje..."
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-black"
                  />
                  <button
                    onClick={() => handleSend()}
                    className={`${
                      isPizza
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-orange-500 hover:bg-orange-600"
                    } text-white px-6 py-2 rounded-lg`}
                  >
                    Enviar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
