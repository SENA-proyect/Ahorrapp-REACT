import '../styles/login.css'

export default function Login() {
  return (
    <div>
      <header></header>

      <main className="main-content">
        <form action="" className="form">
          <h1>Iniciar sesion.</h1>

          <input type="email" placeholder="Correo Electronico" className="inputlab" />
          <label htmlFor=""></label>
          <br />

          <input type="password" placeholder="Contraseña" className="inputlab" />
          <label htmlFor=""></label>
          <br />

          <a href="/olvidar-contrasena" className="href">¿Olvidaste tu contraseña?</a>
          <br />
          <a href="/registrar" className="href">Registrate aqui!</a>
          <br />

          <button type="submit" className="button">Entrar</button>
        </form>
      </main>

      <footer></footer>
    </div>
  )
}