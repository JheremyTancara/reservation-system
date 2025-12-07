import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-100 via-white to-orange-200 px-4">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">
          Bienvenido a MesaCloud
        </h1>
        <p className="text-gray-600 text-lg">
          Plataforma para administrar reservas, menús, mesas y más desde un solo
          panel.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/login"
            className="px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition"
          >
            Ingresar
          </Link>
          <Link
            to="/register"
            className="px-6 py-3 border border-orange-500 text-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition"
          >
            Crear restaurante
          </Link>
        </div>
        <p className="text-sm text-gray-500">
          ¿Eres administrador general?{" "}
          <Link to="/master" className="text-orange-600 font-semibold">
            Accede aquí
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Home;
