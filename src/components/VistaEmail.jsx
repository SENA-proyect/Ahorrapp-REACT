import '../styles/vista.css'

export default function EmailConfirmacion() {
  return (
    <div>
      <h1 className="a">Confirmacion email</h1>
      <div className="container">
        <p>Tu correo se ha confirmado correctamente</p>
        <br />
        <a className="volver" href="">volver</a>
      </div>
    </div>
  );
}