const axios = require('axios');

const chat = async (req, res) => {
  const { messages, system } = req.body;
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  const MODEL = process.env.MODEL;

  try {
    const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
      model: MODEL || "google/gemini-2.0-flash-001", // Modelo por defecto si el .env falla
      messages: [
        { role: "system", content: system || "Asistente de AhorraPP" },
        ...messages
      ],
    }, {
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      }
    });

    if (response.data.choices && response.data.choices[0]) {
      res.json({ reply: response.data.choices[0].message.content });
    } else {
      console.log("Cuerpo de respuesta de OpenRouter:", response.data);
      res.status(500).json({ error: "OpenRouter no devolvió una respuesta válida" });
    }

  } catch (err) {
    // Esto nos dirá el error REAL en la terminal
    console.error("ERROR REAL DE OPENROUTER:", err.response ? err.response.data : err.message);
    
    const detailedError = err.response ? err.response.data.error.message : "Error de conexión";
    res.status(500).json({ error: detailedError });
  }
};

module.exports = { chat };