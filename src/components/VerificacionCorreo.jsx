import { Link } from 'react-router-dom'
import '../styles/verificacion.css'

export default function Verificacion() {
  return (
    <div>

      <h1>Codigo de verificacion</h1>

      <div className="container">
        <h2>Ahorrapp</h2>
        <h3>Ingrese el codigo de verificacion que se le envio a su correo</h3>

        <form action="" className="form">

          <div className="form_codigo">
            <input
              type="number"
              placeholder="ingrese el codigo de verificacion"
              className="codigo"
              required
            />
          </div>

          <div className="form_button">
            <Link className="salir" to="/">Regresar</Link>
            <button className="enviar">enviar</button>
          </div>

        </form>
      </div>

    </div>
  )
}