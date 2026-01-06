// ===============================
// CONFIG
// ===============================

// ⚠️ SOLO PARA PRUEBAS.
// REVOCA esta key y usa una nueva luego.
const OPENAI_API_KEY = "PEGA_AQUI_TU_KEY_NUEVA";

const BACKEND_URL = "https://dry-cherry-9711.jptorresmendoza.workers.dev/";

// Prompt del agente
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
  messages.push({ role: "user", content: userText });

  // 1️⃣ Llamada a OpenAI
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

  // 2️⃣ ¿GPT decidió buscar?
  if (reply.startsWith("{")) {
    try {
      const parsed = JSON.parse(reply);

      if (parsed.action === "search") {
        // 🔑 CLAVE: backend recibe SOLO message
        const searchMessage = `
Buscar propiedades con:
comuna: ${parsed.filters.comuna}
operacion: ${parsed.filters.operacion}
precio_max_clp: ${parsed.filters.precio_max_clp ?? "no definido"}
precio_max_uf: ${parsed.filters.precio_max_uf ?? "no definido"}
        `.trim();

        const backendResponse = await fetch(BACKEND_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message: searchMessage
          })
        });

        if (!backendResponse.ok) {
          throw new Error("Error en backend de búsqueda");
        }

        const results = await backendResponse.json();

        messages.push({ role: "assistant", content: reply });

        return {
          type: "results",
          data: results
        };
      }
    } catch (e) {
      // Si el JSON falla, se trata como texto normal
    }
  }

  // 3️⃣ Respuesta conversacional
  messages.push({ role: "assistant", content: reply });

  return {
    type: "message",
    text: reply
  };
}
