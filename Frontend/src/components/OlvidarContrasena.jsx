import { Link } from 'react-router-dom'
import '../styles/olvidar_contrasena.css'

export default function OlvidarContrasena() {
  return (
    <div>

      <header>
        <h1>Restablecer contraseña</h1>
      </header>

      <main>
        <div className="container">
          <h3>Introduce el correo electrónico asociado a tu cuenta y te enviaremos las instrucciones para restablecerla.</h3>

          <form action="" className="form">

            <div className="form_correo">
              <input
                type="email"
                placeholder="Ingrese su correo electronico"
                className="correo"
                required
              />
            </div>

            <div className="form_button">
              <Link className="salir" to="/login">Cancelar</Link>
              <button className="enviar">Enviar</button>
            </div>

          </form>
        </div>
      </main>

      <footer></footer>

    </div>
  )
}
