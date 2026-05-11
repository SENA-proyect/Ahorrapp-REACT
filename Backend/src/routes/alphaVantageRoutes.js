const express = require('express')
const router = express.Router()

const API_KEY = 'd7v307pr01qp7l70r6i0d7v307pr01qp7l70r6ig'

router.get('/bolsa/:symbol', async (req, res) => {
  const { symbol } = req.params

  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`
    )
    const data = await response.json()
    return res.json(data)

  } catch (error) {
    console.error('Error al consultar Finnhub:', error.message)
    return res.status(500).json({ ok: false, mensaje: 'Error al consultar bolsa' })
  }
})

module.exports = router
