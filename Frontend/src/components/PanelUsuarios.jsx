
import { useState, useEffect } from 'react';

export default function PanelUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState('usuario');
  const [cargandoModal, setCargandoModal] = useState(false);

  useEffect(() => {
    getUsuarios();
  }, []);

  const getUsuarios = async () => {
    try {
      const token = localStorage.getItem('token');
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

  const handleEditar = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setNombre(usuario.Nombre);
    setApellido(usuario.Apellido);
    setEmail(usuario.Email);
    setRol(usuario.Rol);
    setModalAbierto(true);
  };

  const handleGuardarCambios = async (e) => {
    e.preventDefault();
    setError(null);

    if (!nombre || !apellido || !email) {
      setError('Completa todos los campos');
      return;
    }

    setCargandoModal(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3000/api/auth/PanelUsuarios/${usuarioSeleccionado.ID_usuario}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            Nombre: nombre,
            Apellido: apellido,
            Email: email,
            Rol: rol
          })
        }
      );

      const data = await response.json();

      if (data.ok) {
        setUsuarios(usuarios.map(u =>
          u.ID_usuario === usuarioSeleccionado.ID_usuario
            ? { ...u, Nombre: nombre, Apellido: apellido, Email: email, Rol: rol }
            : u
        ));
        setModalAbierto(false);
      } else {
        setError(data.mensaje);
      }
    } catch (err) {
      setError('Error al actualizar el usuario');
      console.error(err);
    } finally {
      setCargandoModal(false);
    }
  };

  const handleBorrar = async (id) => {
    if (window.confirm('¿Seguro deseas eliminar a este usuario?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `http://localhost:3000/api/auth/PanelUsuarios/${id}`,
          {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );

        const data = await response.json();

        if (data.ok) {
          setUsuarios(usuarios.filter(u => u.ID_usuario !== id));
        } else {
          setError(data.mensaje);
        }
      } catch (err) {
        setError('Error al eliminar al usuario');
        console.error(err);
      }
    }
  };

  if (cargando) return <p>Cargando...</p>;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0a, #0d1a0d)' }}>
      <div className="inf-container">
        <h2>Usuarios Registrados</h2>

        {error && <p className="error">{error}</p>}

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
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
                  <button
                    onClick={() => handleEditar(usuario)}
                    style={{
                      backgroundColor: '#00000000',
                      color: 'white',
                      padding: '8px 16px',
                      border: 'solid 1px green',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleBorrar(usuario.ID_usuario)}
                    style={{
                      backgroundColor: '#00000000',
                      color: 'white',
                      padding: '8px 16px',
                      border: 'solid 1px red',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Borrar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL */}
      {modalAbierto && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }} onClick={() => setModalAbierto(false)}>
          <div style={{
            backgroundColor: '#1a1a1a',
            borderRadius: '8px',
            padding: '20px',
            minWidth: '400px',
            border: '1px solid #333'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ color: '#fff', margin: 0 }}>Editar Usuario</h2>
              <button
                onClick={() => setModalAbierto(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '28px',
                  cursor: 'pointer',
                  color: '#999'
                }}
              >
                ×
              </button>
            </div>

            {error && <div style={{ backgroundColor: '#c62828', color: '#fff', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>{error}</div>}

            <form onSubmit={handleGuardarCambios}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#fff', fontWeight: '600' }}>Nombre</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    backgroundColor: '#2a2a2a',
                    color: '#fff'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#fff', fontWeight: '600' }}>Apellido</label>
                <input
                  type="text"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    backgroundColor: '#2a2a2a',
                    color: '#fff'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#fff', fontWeight: '600' }}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    backgroundColor: '#2a2a2a',
                    color: '#fff'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#fff', fontWeight: '600' }}>Rol</label>
                <select
                  value={rol}
                  onChange={(e) => setRol(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    backgroundColor: '#2a2a2a',
                    color: '#fff'
                  }}
                >
                  <option value="usuario">Usuario</option>
                  <option value="moderador">Moderador</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={cargandoModal}
                  style={{
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {cargandoModal ? 'Guardando...' : 'Guardar Cambios'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  style={{
                    backgroundColor: '#999',
                    color: 'white',
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}