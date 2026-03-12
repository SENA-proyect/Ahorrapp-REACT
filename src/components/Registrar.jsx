import { Link } from 'react-router-dom'
import '../styles/stylo.css'

export default function Registro() {
  return (
    <div>
      <form className="form-register" action="" method="post">
        <h4 className="h4Text">Formulario Registro!</h4>

        <input className="controls" type="text" name="nombres" id="nombres" placeholder="Ingrese su nombre" />
        <input className="controls" type="text" name="apellido" id="apellido" placeholder="Ingrese su apellido" />
        <input className="controls" type="email" name="correo" id="correo" placeholder="Ingrese su correo" />
        <input className="controls" type="password" name="contraseña" id="contraseña" placeholder="Ingrese su contraseña" />

        <p className="terminosCondiciones">
          Estoy de acuerdo con <a href="#">Términos y condiciones</a>
        </p>

        <label className="container">
          <input type="checkbox" />
          <svg viewBox="0 0 64 64" height="1em" width="1em">
            <path
              d="M 0 16 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 16 L 32 48 L 64 16 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 16"
              pathLength="575.0541381835938"
              className="path"
            ></path>
          </svg>
        </label>

        <input className="bottom" type="submit" value="Registrar" />

        <p>
          <Link to="/login">¿Ya tengo cuenta?</Link>
        </p>
      </form>
    </div>
  )
}