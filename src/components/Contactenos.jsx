import '../styles/contactanos.css'

export default function Contactanos() {
  return (
    <section className="container">
      <form action="" className="form-container">
        <h1 className="textForm">Contactanos Aqui!</h1>

        <input type="text" placeholder="Nombre" className="inputContactanos" />
        <br />

        <input type="text" placeholder="Numero" className="inputContactanos" />

        <textarea
          className="inputContactanosDescripcion"
          placeholder="Para ser mas especifico utiliza este campo!"
        ></textarea>

        <button className="btn-contactenos">Enviar</button>
      </form>
    </section>
  )
}