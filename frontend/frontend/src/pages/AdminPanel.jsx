import React, { useState, useEffect } from 'react';

const AdminPanel = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    telefono: '',
    direccion: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/restaurants');
      const data = await response.json();
      setRestaurants(data);
    } catch (error) {
      console.error('Error cargando restaurantes:', error);
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
              <p className="text-gray-600 mt-1">Gestión de restaurantes - Puerto 5173</p>
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

        {/* Lista de restaurantes */}
        <div className="grid gap-4">
          {restaurants.map((restaurant) => (
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
          ))}
        </div>

        {restaurants.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-12 text-center">
              <p className="text-gray-500 text-lg">No hay restaurantes registrados</p>
              <p className="text-gray-400 text-sm mt-2">Haz clic en "Nuevo Restaurante" para comenzar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
