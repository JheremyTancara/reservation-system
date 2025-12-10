import React, { useState, useEffect } from 'react';
import { obtenerSolicitudes, aprobarSolicitud, rechazarSolicitud, obtenerTodosUsuarios } from '../services/userService';

const AdminPanel = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [subscriptionRequests, setSubscriptionRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'approved', or 'users'
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    telefono: '',
    direccion: ''
  });
  const [loading, setLoading] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(null);

  useEffect(() => {
    loadRestaurants();
    loadPendingRestaurants();
    loadUsers();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab]);

  const loadRestaurants = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/restaurants');
      const data = await response.json();
      setRestaurants(data);
    } catch (error) {
      console.error('Error cargando restaurantes:', error);
    }
  };

  const loadSubscriptionRequests = async () => {
    try {
      const response = await obtenerSolicitudes();
      setSubscriptionRequests(response.data.requests || []);
    } catch (error) {
      console.error('Error cargando solicitudes:', error);
    }
  };

  const loadPendingRestaurants = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/restaurants');
      const data = await response.json();
      // Filtrar solo los restaurantes con subscription_status = 'pending'
      const pending = data.filter(r => r.subscription_status === 'pending');
      setSubscriptionRequests(pending);
    } catch (error) {
      console.error('Error cargando restaurantes pendientes:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await obtenerTodosUsuarios();
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    }
  };

  const handleApprove = async (id) => {
    if (!confirm('¿Estás seguro de aprobar esta solicitud?')) return;

    try {
      await aprobarSolicitud(id, 'Aprobado por el administrador');
      alert('✅ Solicitud aprobada exitosamente');
      loadPendingRestaurants();
      loadRestaurants();
    } catch (error) {
      console.error('Error aprobando solicitud:', error);
      alert('❌ Error al aprobar la solicitud');
    }
  };

  const handleReject = async (id) => {
    if (!rejectNotes.trim()) {
      alert('Por favor, ingresa un motivo para rechazar');
      return;
    }

    try {
      await rechazarSolicitud(id, rejectNotes);
      alert('✅ Solicitud rechazada exitosamente');
      setShowRejectModal(null);
      setRejectNotes('');
      loadPendingRestaurants();
    } catch (error) {
      console.error('Error rechazando solicitud:', error);
      alert('❌ Error al rechazar la solicitud');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/restaurants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ Restaurante creado exitosamente!\n\nURL: ${data.restaurant.url}\nPuerto: ${data.restaurant.puerto}`);
        setFormData({
          nombre: '',
          email: '',
          password: '',
          telefono: '',
          direccion: ''
        });
        setShowForm(false);
        loadRestaurants();
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creando restaurante:', error);
      alert('❌ Error al crear el restaurante');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este restaurante?')) return;

    try {
      const response = await fetch(`http://localhost:3000/api/restaurants/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('✅ Restaurante eliminado exitosamente');
        loadRestaurants();
      } else {
        alert('❌ Error al eliminar el restaurante');
      }
    } catch (error) {
      console.error('Error eliminando restaurante:', error);
      alert('❌ Error al eliminar el restaurante');
    }
  };

  const handleRestart = async (id) => {
    try {
      const response = await fetch(`http://localhost:3000/api/restaurants/${id}/restart`, {
        method: 'POST',
      });

      if (response.ok) {
        alert('✅ Instancia reiniciada exitosamente');
        loadRestaurants();
      } else {
        alert('❌ Error al reiniciar la instancia');
      }
    } catch (error) {
      console.error('Error reiniciando instancia:', error);
      alert('❌ Error al reiniciar la instancia');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
              <p className="text-gray-600 mt-1">Gestión de restaurantes y solicitudes</p>
            </div>
            <button 
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition flex items-center gap-2"
            >
              <span>➕</span>
              Nuevo Restaurante
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-6 py-3 font-semibold transition ${
                activeTab === 'pending'
                  ? 'border-b-2 border-orange-500 text-orange-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Solicitudes Pendientes ({subscriptionRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`px-6 py-3 font-semibold transition ${
                activeTab === 'approved'
                  ? 'border-b-2 border-orange-500 text-orange-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Restaurantes Aprobados ({restaurants.filter(r => r.subscription_status === 'active' || !r.subscription_status).length})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 font-semibold transition ${
                activeTab === 'users'
                  ? 'border-b-2 border-orange-500 text-orange-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Usuarios Registrados ({users.length})
            </button>
          </div>
        </div>

        {/* Solicitudes Pendientes */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            {subscriptionRequests.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <p className="text-gray-500 text-lg">No hay solicitudes pendientes</p>
              </div>
            ) : (
              subscriptionRequests.map((request) => (
                  <div key={request.id} className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <h3 className="text-xl font-bold text-gray-900">{request.nombre}</h3>
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
                            Pendiente
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                          <div>
                            <p><strong>Email:</strong> {request.email}</p>
                            <p><strong>Teléfono:</strong> {request.telefono || 'N/A'}</p>
                            <p><strong>Puerto asignado:</strong> {request.puerto}</p>
                          </div>
                          <div>
                            <p><strong>Solicitado por:</strong> {request.user_name || 'N/A'}</p>
                            <p><strong>Email del usuario:</strong> {request.user_email || 'N/A'}</p>
                            <p><strong>Fecha:</strong> {new Date(request.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        {request.logo_path && (
                          <div className="mb-4">
                            <p className="text-sm font-semibold mb-2">Logo:</p>
                            <img
                              src={`http://localhost:3000${request.logo_path}`}
                              alt="Logo"
                              className="w-24 h-24 object-cover rounded"
                            />
                          </div>
                        )}
                        {request.cover_path && (
                          <div className="mb-4">
                            <p className="text-sm font-semibold mb-2">Portada:</p>
                            <img
                              src={`http://localhost:3000${request.cover_path}`}
                              alt="Cover"
                              className="w-full max-w-md h-48 object-cover rounded"
                            />
                          </div>
                        )}
                        {request.payment_proof_path && (
                          <div className="mb-4">
                            <p className="text-sm font-semibold mb-2">Comprobante de pago:</p>
                            <a
                              href={`http://localhost:3000${request.payment_proof_path}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              Ver comprobante
                            </a>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleApprove(request.id)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
                        >
                          ✅ Aprobar
                        </button>
                        <button
                          onClick={() => setShowRejectModal(request.id)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
                        >
                          ❌ Rechazar
                        </button>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {/* Formulario de creación */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Registrar Nuevo Restaurante</h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Restaurante *
                    </label>
                    <input
                      id="nombre"
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder="Ej: Pizza Palace"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email de Administrador *
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="admin@restaurante.com"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Contraseña *
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="********"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <input
                      id="telefono"
                      type="text"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      placeholder="+591 12345678"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                  </label>
                  <input
                    id="direccion"
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    placeholder="Calle Principal #123"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
                  >
                    {loading ? 'Creando...' : 'Crear Restaurante'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Restaurantes Aprobados */}
        {activeTab === 'approved' && (
          <div className="grid gap-4">
            {restaurants.filter(r => r.subscription_status === 'active' || !r.subscription_status).length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-12 text-center">
                  <p className="text-gray-500 text-lg">No hay restaurantes aprobados</p>
                  <p className="text-gray-400 text-sm mt-2">Haz clic en "Nuevo Restaurante" para comenzar</p>
                </div>
              </div>
            ) : (
              restaurants.filter(r => r.subscription_status === 'active' || !r.subscription_status).map((restaurant) => (
                <div key={restaurant.id} className="bg-white rounded-lg shadow-sm">
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">{restaurant.nombre}</h3>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            restaurant.instanceActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {restaurant.instanceActive ? '🟢 Activo' : '🔴 Inactivo'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <p><strong>Email:</strong> {restaurant.email}</p>
                            <p><strong>Teléfono:</strong> {restaurant.telefono || 'N/A'}</p>
                            <p><strong>Dirección:</strong> {restaurant.direccion || 'N/A'}</p>
                          </div>
                          <div>
                            <p><strong>Puerto:</strong> {restaurant.puerto}</p>
                            <p><strong>Subdominio:</strong> {restaurant.subdominio}</p>
                            <p><strong>URL:</strong> 
                              <a 
                                href={`http://localhost:${restaurant.puerto}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline ml-1"
                              >
                                localhost:{restaurant.puerto} →
                              </a>
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleRestart(restaurant.id)}
                          className="px-3 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg transition"
                          title="Reiniciar instancia"
                        >
                          🔄
                        </button>
                        <button
                          onClick={() => handleDelete(restaurant.id)}
                          className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition"
                          title="Eliminar restaurante"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Usuarios Registrados */}
        {activeTab === 'users' && (
          <div className="grid gap-4">
            {users.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-12 text-center">
                  <p className="text-gray-500 text-lg">No hay usuarios registrados</p>
                </div>
              </div>
            ) : (
              users.map((user) => (
                <div key={user.id} className="bg-white rounded-lg shadow-sm">
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      {user.profile_photo ? (
                        <img
                          src={`http://localhost:3000${user.profile_photo}`}
                          alt={user.full_name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xl font-semibold">
                          {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{user.full_name}</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <p><strong>Email:</strong> {user.email}</p>
                            <p><strong>Teléfono:</strong> {user.phone || 'N/A'}</p>
                          </div>
                          <div>
                            <p><strong>Fecha de registro:</strong> {new Date(user.created_at).toLocaleDateString('es-ES', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</p>
                            <p><strong>ID:</strong> {user.id}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Modal de rechazo */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Rechazar Solicitud</h3>
              <p className="text-gray-600 mb-4">
                Por favor, ingresa el motivo del rechazo:
              </p>
              <textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
                placeholder="Motivo del rechazo..."
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleReject(showRejectModal)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
                >
                  Confirmar Rechazo
                </button>
                <button
                  onClick={() => {
                    setShowRejectModal(null);
                    setRejectNotes('');
                  }}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
