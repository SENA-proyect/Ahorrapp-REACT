const express = require('express')
const router = express.Router()

const API_KEY = process.env.FINNHUB_API_KEY

if (!API_KEY) {
  console.warn('⚠️  FINNHUB_API_KEY no configurada en .env — la bolsa de valores devolverá errores')
}

router.get('/bolsa/:symbol', async (req, res) => {
  const { symbol } = req.params

  if (!API_KEY) {
    return res.status(503).json({
      ok: false,
      mensaje: 'API de bolsa no disponible: falta FINNHUB_API_KEY en la configuración del servidor',
    })
  }

  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`
    )
    const data = await response.json()
    if (!response.ok) {
      return res.json({
        ok: false,
        mensaje: data?.error || data?.message || 'Finnhub rechazó la solicitud',
      })
    }
    return res.json(data)

  } catch (error) {
    console.error('Error al consultar Finnhub:', error.message)
    return res.status(500).json({ ok: false, mensaje: 'Error al consultar bolsa' })
  }
})

router.get('/bolsa/trm/usd-cop', async (_req, res) => {
  if (!API_KEY) {
    return res.json({
      ok: false,
      mensaje: 'API de bolsa no disponible: falta FINNHUB_API_KEY',
      trm: 4200,
    })
  }

  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/forex/rates?base=USD&token=${API_KEY}`
    )
    const data = await response.json()

    if (!response.ok || !data.quote?.COP) {
      return res.json({
        ok: false,
        mensaje: data?.error || data?.message || 'No se pudo consultar la TRM',
        trm: 4200,
      })
    }

    return res.json({ ok: true, trm: data.quote.COP })
  } catch (error) {
    console.error('Error al consultar TRM:', error.message)
    return res.status(500).json({ ok: false, mensaje: 'Error al consultar TRM' })
  }
})

module.exports = router
