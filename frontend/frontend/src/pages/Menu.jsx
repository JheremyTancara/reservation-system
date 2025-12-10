// Menu.jsx
import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import fondo from '../assets/fondo-dashboard.png';

const Menu = () => {
  const api = useApi();

  const [platos, setPlatos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [branches, setBranches] = useState([]);
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [editando, setEditando] = useState(null);
  const [platoAEliminar, setPlatoAEliminar] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [categoriaAEliminar, setCategoriaAEliminar] = useState(null);
  const [mostrarModalCategoria, setMostrarModalCategoria] = useState(false);
  const [nuevoPlato, setNuevoPlato] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    categoria_id: '',
    imagen_url: '',
    branch_id: null
  });

  const obtenerPlatos = async () => {
    try {
      const res = await api.get('/menu');
    setPlatos(res.data);
    } catch (err) {
      console.error('Error obteniendo platos:', err);
      setPlatos([]);
    }
  };

  const obtenerCategorias = async () => {
    try {
      const res = await api.get('/categorias');
    setCategorias(res.data);
    } catch (err) {
      console.error('Error obteniendo categorías:', err);
      setCategorias([]);
    }
  };

  const obtenerBranches = async () => {
    try {
      const res = await api.get('/branches');
      setBranches(res.data);
      if (res.data.length > 0 && !nuevoPlato.branch_id) {
        setNuevoPlato({ ...nuevoPlato, branch_id: res.data[0].id });
      }
    } catch (err) {
      console.error('Error obteniendo branches:', err);
    }
  };

  const guardarPlato = async (e) => {
    e.preventDefault();
    try {
      // Validar que branch_id esté presente
      if (!nuevoPlato.branch_id) {
        alert('Debes seleccionar una sucursal');
        return;
      }

      // Validar campos requeridos
      if (!nuevoPlato.nombre || !nuevoPlato.precio) {
        alert('El nombre y precio son requeridos');
        return;
      }

      const platoData = {
        nombre: nuevoPlato.nombre,
        descripcion: nuevoPlato.descripcion || '',
        precio: parseFloat(nuevoPlato.precio),
        imagen_url: nuevoPlato.imagen_url || null,
        categoria_id: nuevoPlato.categoria_id || null,
        branch_id: parseInt(nuevoPlato.branch_id)
      };

      console.log('📤 Guardando plato:', platoData);

    if (editando !== null) {
        await api.put(`/menu/${editando}`, platoData);
      setEditando(null);
    } else {
        await api.post('/menu', platoData);
    }
      
      setNuevoPlato({ nombre: '', descripcion: '', precio: '', categoria_id: '', imagen_url: '', branch_id: branches[0]?.id || null });
    obtenerPlatos();
      alert('Plato guardado exitosamente');
    } catch (err) {
      console.error('Error guardando plato:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Error al guardar el plato';
      alert(`Error: ${errorMsg}`);
    }
  };

  const crearCategoria = async (e) => {
    e.preventDefault();
    if (!nuevaCategoria) return;
    try {
      await api.post('/categorias', { nombre: nuevaCategoria.trim() });
    setNuevaCategoria('');
    obtenerCategorias();
      alert('Categoría creada exitosamente');
    } catch (err) {
      console.error('Error creando categoría:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Error al crear la categoría';
      alert(`Error: ${errorMsg}`);
    }
  };

  const confirmarEliminarCategoria = (categoria) => {
    setCategoriaAEliminar(categoria);
    setMostrarModalCategoria(true);
  };

  const eliminarCategoria = async () => {
    try {
      await api.delete(`/categorias/${categoriaAEliminar.id}`);
      setMostrarModalCategoria(false);
      setCategoriaAEliminar(null);
      obtenerCategorias();
      alert('Categoría eliminada exitosamente');
    } catch (err) {
      console.error('Error eliminando categoría:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Error al eliminar la categoría';
      alert(`Error: ${errorMsg}`);
      setMostrarModalCategoria(false);
      setCategoriaAEliminar(null);
    }
  };

  const subirImagen = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }

    // Validar tamaño del archivo (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen es demasiado grande. El tamaño máximo es 5MB.');
      e.target.value = ''; // Limpiar el input
      return;
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      alert('Formato no permitido. Solo se permiten imágenes JPG, JPEG o PNG.');
      e.target.value = ''; // Limpiar el input
      return;
    }

    try {
      const formData = new FormData();
      formData.append('imagen', file);
      const res = await api.post('/upload', formData);
      
      if (res.data && res.data.url) {
        setNuevoPlato({ ...nuevoPlato, imagen_url: res.data.url });
        alert('Imagen subida correctamente');
      } else {
        throw new Error('No se recibió la URL de la imagen');
      }
    } catch (err) {
      console.error('Error subiendo imagen:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Error al subir la imagen';
      alert(`Error: ${errorMsg}`);
      e.target.value = ''; // Limpiar el input en caso de error
    }
  };

  const editarPlato = (plato) => {
    setNuevoPlato({ ...plato, branch_id: plato.branch_id });
    setEditando(plato.id);
  };

  const confirmarEliminar = (plato) => {
    setPlatoAEliminar(plato);
    setMostrarModal(true);
  };

  const eliminarPlato = async () => {
    try {
      await api.delete(`/menu/${platoAEliminar.id}`);
    setMostrarModal(false);
    setPlatoAEliminar(null);
    obtenerPlatos();
      alert('Plato eliminado exitosamente');
    } catch (err) {
      console.error('Error eliminando plato:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Error al eliminar el plato';
      alert(`Error: ${errorMsg}`);
      setMostrarModal(false);
      setPlatoAEliminar(null);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    obtenerPlatos();
    obtenerCategorias();
    obtenerBranches();
  }, []);

  return (
    <div className="min-h-screen p-4 md:p-6 bg-cover bg-center" style={{ backgroundImage: `url(${fondo})` }}>
      <div className="max-w-5xl mx-auto bg-white/90 backdrop-blur p-4 md:p-6 rounded-xl shadow-lg">
        <h1 className="text-2xl md:text-3xl font-bold text-orange-600 mb-4 md:mb-6">Gestión del Menú</h1>

        <form onSubmit={guardarPlato} className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="space-y-3">
            <input 
              type="text" 
              placeholder="Nombre del plato" 
              className="w-full p-2 md:p-3 border rounded focus:ring-2 ring-orange-500" 
              value={nuevoPlato.nombre} 
              onChange={(e) => setNuevoPlato({ ...nuevoPlato, nombre: e.target.value })} 
              required 
            />
            <input 
              type="text" 
              placeholder="Precio (Bs)" 
              className="w-full p-2 md:p-3 border rounded focus:ring-2 ring-orange-500" 
              value={nuevoPlato.precio} 
              onChange={(e) => setNuevoPlato({ ...nuevoPlato, precio: e.target.value })} 
              required 
            />
            <select 
              className="w-full p-2 md:p-3 border rounded focus:ring-2 ring-orange-500" 
              value={nuevoPlato.categoria_id} 
              onChange={(e) => setNuevoPlato({ ...nuevoPlato, categoria_id: e.target.value })}
            >
              <option value="">Selecciona categoría</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
            {branches.length > 0 && (
              <select 
                className="w-full p-2 md:p-3 border rounded focus:ring-2 ring-orange-500" 
                value={nuevoPlato.branch_id || ''} 
                onChange={(e) => setNuevoPlato({ ...nuevoPlato, branch_id: parseInt(e.target.value) })}
                required
              >
                <option value="">Selecciona sucursal</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>{branch.nombre}</option>
                ))}
              </select>
            )}
            <input 
              type="file" 
              accept="image/jpeg,image/png,image/jpg" 
              onChange={subirImagen} 
              className="w-full p-2 border rounded focus:ring-2 ring-orange-500" 
            />
            <p className="text-sm text-gray-500">Formatos permitidos: JPG, PNG (máximo 5MB)</p>
            {nuevoPlato.imagen_url && (
              <div className="mt-2">
                <p className="text-sm text-green-600 mb-2">Imagen cargada:</p>
                <img 
                  src={nuevoPlato.imagen_url} 
                  alt="Vista previa" 
                  className="w-full h-32 object-cover rounded border"
                />
              </div>
            )}
          </div>

          <div className="space-y-3">
            <textarea 
              placeholder="Descripción" 
              className="w-full h-full p-2 md:p-3 border rounded focus:ring-2 ring-orange-500" 
              rows="4"
              value={nuevoPlato.descripcion} 
              onChange={(e) => setNuevoPlato({ ...nuevoPlato, descripcion: e.target.value })}
            ></textarea>
          </div>

          <button 
            type="submit" 
            className="md:col-span-2 bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700 transition"
          >
            {editando !== null ? 'Actualizar Plato' : 'Guardar Plato'}
          </button>
        </form>

        {/* Formulario para crear categoría */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">Gestionar Categorías</h2>
          <form onSubmit={crearCategoria} className="flex flex-col md:flex-row gap-3 mb-4">
            <input 
              type="text" 
              placeholder="Nombre de la categoría" 
              className="flex-1 p-2 md:p-3 border rounded focus:ring-2 ring-orange-500" 
              value={nuevaCategoria} 
              onChange={(e) => setNuevaCategoria(e.target.value)} 
              required 
            />
            <button 
              className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition"
            >
              Crear
            </button>
          </form>
          
          {/* Lista de categorías con opción de eliminar */}
          <div className="flex flex-wrap gap-2">
            {categorias.map(cat => (
              <div key={cat.id} className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                <span className="text-sm text-gray-800">{cat.nombre}</span>
                <button
                  onClick={() => confirmarEliminarCategoria(cat)}
                  className="text-red-600 hover:text-red-800 text-sm font-bold"
                  title="Eliminar categoría"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4">Platos Registrados</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {platos.map((plato, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-4">
              <img src={plato.imagen_url || 'https://via.placeholder.com/300'} alt={plato.nombre} className="w-full h-40 object-cover rounded mb-2" />
              <h3 className="text-xl font-bold text-orange-600">{plato.nombre}</h3>
              <p className="text-sm text-gray-600">{plato.categoria}</p>
              <p className="text-gray-800 mt-1">{plato.descripcion}</p>
              <p className="text-right font-bold text-green-600 mt-2">Bs {plato.precio}</p>
              <div className="flex justify-between mt-4">
                <button onClick={() => editarPlato(plato)} className="text-sm text-blue-600 hover:underline">Editar</button>
                <button onClick={() => confirmarEliminar(plato)} className="text-sm text-red-600 hover:underline">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de confirmación para plato */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-800 mb-4">¿Deseas eliminar este plato?</h3>
            <p className="mb-4 text-sm text-gray-600">Esta acción no se puede deshacer.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setMostrarModal(false)} className="px-4 py-2 text-sm bg-gray-300 rounded hover:bg-gray-400">Cancelar</button>
              <button onClick={eliminarPlato} className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para categoría */}
      {mostrarModalCategoria && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-800 mb-4">¿Deseas eliminar esta categoría?</h3>
            <p className="mb-4 text-sm text-gray-600">
              {categoriaAEliminar?.nombre}
              <br />
              <span className="text-red-600">Esta acción no se puede deshacer. Solo se puede eliminar si no tiene platos asociados.</span>
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setMostrarModalCategoria(false)} className="px-4 py-2 text-sm bg-gray-300 rounded hover:bg-gray-400">Cancelar</button>
              <button onClick={eliminarCategoria} className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;
