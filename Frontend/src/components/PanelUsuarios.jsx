import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1133a1ff, #97720cff)' }}>
      
      {/* HEADER */}
      <header>
        <div className="flex p-5 bg-black/10">
        <button className="bg-blue-700 rounded-lg p-3 text-white w-auto transition-all duration-300">
            <Link to="/PanelAdmin">
              ← Volver al Panel Admin
            </Link>
          </button>
          <h2 className="text-center text-white font-bold text-4xl flex justify-center m-auto">Usuarios Registrados</h2>
          {error && <p className="error">{error}</p>}
        </div>
      </header>

      {/* MAIN */}
      <main>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 justify-center m-10">
          {usuarios.length === 0 ? (
            <p>No hay usuarios registrados.</p>
          ) : (
            usuarios.map((usuario) => (
              <div className="bg-white/20 backdrop-blur-md border-2 border-blue-300 flex flex-col rounded-xl m-5 p-10 text-white" key={usuario.ID_usuario}>
                <p className='whitespace-nowrap'><strong>ID:</strong> {usuario.ID_usuario}</p>
                <p className='whitespace-nowrap'><strong>Nombre:</strong> {usuario.Nombre}</p>
                <p className='whitespace-nowrap'><strong>Apellido:</strong> {usuario.Apellido || 'No asignado'}</p>
                <p className='whitespace-nowrap'><strong>Email:</strong> {usuario.Email}</p>
                <p className='whitespace-nowrap'><strong>Rol:</strong>{' '}
                  {usuario.Rol === 'Administrador'
                    ? <span className="badge-admin">Administrador</span>
                    : <span className="badge-user">Usuario</span>
                  }
                </p>
                <div className="flex justify-center flex-row gap-3 mt-5">
                  <button
                    onClick={() => handleEditar(usuario)}
                    className='bg-green-500 border-green-600 rounded-lg text-white font-bold text-lg p-3 m-3 cursor-pointer
                    hover:bg-green-800 scale-[1.02] transition-all duration-300'
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleBorrar(usuario.ID_usuario)}
                    className='bg-red-500 border-red-600 rounded-lg text-white font-bold text-lg p-3 m-3 cursor-pointer
                    hover:bg-red-800 scale-[1.02] transition-all duration-300'
                  >
                    Borrar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="p-5"></footer>

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
            backgroundColor: '#1133a1ff',
            borderRadius: '10px',
            padding: '20px',
            minWidth: '400px',
            border: '1px solid #333',
            color: '#999'
          }} onClick={(e) => e.stopPropagation()}>
            <div className='flex justify-between items-center mb-2'>
              <h2 className='text-white font-bold text-2xl'>Editar Usuario</h2>
              <button
                onClick={() => setModalAbierto(false)}
                className='bg-none border-none text-2xl text-red cursor-pointer'
              >
                ×
              </button>
            </div>

            {error && <div className='bg-red-800 text-white font-bold text-center rounded-lg mb-5'> {error} </div>}

            <form onSubmit={handleGuardarCambios}>
              <div className='mb-[15px]'>
                <label className='block mb-[8px] text-white font-bold'>Nombre</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className='w-full p-[10px] border-1 border-gray-500 bg-[#2a2a2a] rounded-lg text-white'
                />
              </div>

              <div className='mb-[15px]'>
                <label className='block mb-[8px] text-white font-bold'>Apellido</label>
                <input
                  type="text"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  className='w-full p-[10px] border-1 border-gray-500 bg-[#2a2a2a] rounded-lg text-white'
                />
              </div>

              <div className='mb-[15px]'>
                <label className='block mb-[8px] text-white font-bold'>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className='w-full p-[10px] border-1 border-gray-500 bg-[#2a2a2a] rounded-lg text-white'
                />
              </div>

              <div className='mb-[15px]'>
                <label className='block mb-[8px] text-white font-bold'>Rol</label>
                <select
                  value={rol}
                  onChange={(e) => setRol(e.target.value)}
                  className='w-full p-[10px] border-1 border-gray-500 bg-[#2a2a2a] rounded-lg text-white'
                >
                  <option value="usuario">Usuario</option>
                  <option value="moderador">Moderador</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className='flex gap-5 justify-end mt-10'>
                <button
                  type="submit"
                  disabled={cargandoModal}
                  className='bg-green-600 hover:bg-green-700 border-green-800 rounded-lg text-white 
                  font-bold text-md p-3 cursor-pointer transition-all duration-300'
                >
                  {cargandoModal ? 'Guardando...' : 'Guardar Cambios'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className='bg-red-700 hover:bg-red-800 border-red-800 rounded-lg text-white 
                  font-bold text-md p-3 cursor-pointer transition-all duration-300'>
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