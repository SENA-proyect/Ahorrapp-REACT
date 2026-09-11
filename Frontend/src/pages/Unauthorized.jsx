// components/Unauthorized.jsx
import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080c18]">
      <div className="text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-3xl font-bold text-[#f4f1e8]">Acceso Denegado</h1>
        <p className="text-[#9aa6c4] mt-2">
          No tienes permisos para ver esta página.
        </p>
        <Link
          to="/Dashboard"
          className="inline-block mt-6 px-6 py-2 bg-[#e0b855] text-[#080c18] rounded-lg hover:bg-[#d4a84a] transition-colors"
        >
          Volver al Dashboard
        </Link>
      </div>
    </div>
  );
}