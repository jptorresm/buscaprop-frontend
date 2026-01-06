// ===============================
// CONFIG
// ===============================

// ⚠️ SOLO PARA PRUEBAS.
// Luego mover esta key a backend.
const OPENAI_API_KEY = "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";

const BACKEND_URL = "https://dry-cherry-9711.jptorresmendoza.workers.dev/";

// Prompt del agente (AQUÍ va el prompt, no en ChatGPT)
const SYSTEM_PROMPT = `
Eres Buscaprop, un asistente inmobiliario en Chile.

Tu trabajo es conversar de forma natural con el usuario
para ayudarlo a buscar propiedades reales.

Puedes recibir información en cualquier orden.

Tu objetivo es entender:
- comuna
- operacion (venta o arriendo)
- presupuesto máximo (en CLP o UF)

Reglas IMPORTANTES:
- Conversa normalmente mientras falte información.
- Resume brevemente lo que has entendido.
- NO inventes propiedades.
- NO filtres resultados tú.
- SOLO cuando tengas información suficiente,
  responde EXCLUSIVAMENTE con un JSON válido
  en el siguiente formato (sin texto adicional):

{
  "action": "search",
  "filters": {
    "comuna": "providencia",
    "operacion": "arriendo",
    "precio_max_clp": 900000,
    "precio_max_uf": null
  }
}
`;

// ===============================
// ESTADO DEL CHAT
// ===============================

let messages = [
  { role: "system", content: SYSTEM_PROMPT }
];

// ===============================
// FUNCIÓN PRINCIPAL
// ===============================

export async function sendMessageToBuscaprop(userText) {
  // Agregar mensaje del usuario
  messages.push({ role: "user", content: userText });

  // 1️⃣ Llamar a GPT
  const gptResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.3
    })
  });

  if (!gptResponse.ok) {
    throw new Error("Error llamando a OpenAI");
  }

  const gptData = await gptResponse.json();
  const reply = gptData.choices[0].message.content.trim();

  // 2️⃣ ¿El GPT decidió buscar?
  if (reply.startsWith("{")) {
    try {
      const parsed = JSON.parse(reply);

      if (parsed.action === "search") {
        // Llamar a tu backend REAL
        const backendResponse = await fetch(BACKEND_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            filters: parsed.filters
          })
        });

        if (!backendResponse.ok) {
          throw new Error("Error en backend de búsqueda");
        }

        const results = await backendResponse.json();

        // Guardar el mensaje del GPT (JSON) en el historial
        messages.push({ role: "assistant", content: reply });

        return {
          type: "results",
          data: results
        };
      }
    } catch (e) {
      // Si el JSON falla, tratamos la respuesta como texto normal
    }
  }

  // 3️⃣ Respuesta conversacional normal
  messages.push({ role: "assistant", content: reply });

  return {
    type: "message",
    text: reply
  };
}
