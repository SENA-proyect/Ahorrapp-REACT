// src/components/PanelUsuarios.jsx
import '../styles/panel.css'

export default function PanelUsuarios({ usuarios = [] }) {
  return (
    <div>

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