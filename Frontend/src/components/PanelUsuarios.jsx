import '../styles/panel.css'
import { useState, useEffect } from 'react';

export default function PanelUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getUsuarios();
  }, []);

  const getUsuarios = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Token', token);
      const response = await fetch('http://localhost:3000/api/auth/PanelUsuarios', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.ok) {
        setUsuarios(data.usuarios);
      } else {
        setError(data.mensaje);
      }
    } catch (err) {
      setError('Error al obtener usuarios');
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  if (cargando) return <p>Cargando...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0a, #0d1a0d)' }} >
      <div className="inf-container">
        <h2>Usuarios Registrados</h2>

        <div className="inf-listas">
          {usuarios.length === 0 ? (
            <p>No hay usuarios registrados.</p>
          ) : (
            usuarios.map((usuario) => (
              <div className="general-card" key={usuario.ID_usuario}>
                <p><strong>ID:</strong> {usuario.ID_usuario}</p>
                <p><strong>Nombre:</strong> {usuario.Nombre}</p>
                <p><strong>Apellido:</strong> {usuario.Apellido || 'No asignado'}</p>
                <p><strong>Email:</strong> {usuario.Email}</p>
                <p><strong>Rol:</strong>{' '}
                  {usuario.Rol === 'Administrador'
                    ? <span className="badge-admin">Administrador</span>
                    : <span className="badge-user">Usuario</span>
                  }
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}