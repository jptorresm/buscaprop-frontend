// ===============================
// CONFIG
// ===============================

const ENDPOINT = "https://dry-cherry-9711.jptorresmendoza.workers.dev/";
const sessionId = crypto.randomUUID();

// ===============================
// DOM
// ===============================

const chat = document.getElementById("chat");
const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");

// ===============================
// UI HELPERS
// ===============================

function addMessage(text, sender = "assistant") {
  const div = document.createElement("div");
  div.className = `message ${sender}`;
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function addResults(results) {
  const container = document.createElement("div");
  container.className = "results";

  if (!results || results.length === 0) {
    const empty = document.createElement("div");
    empty.textContent = "No se encontraron propiedades con estos criterios.";
    container.appendChild(empty);
    chat.appendChild(container);
    return;
  }

  results.forEach(p => {
    const card = document.createElement("div");
    card.className = "result-card";

    card.innerHTML = `
      <strong>${p.titulo || "Propiedad"}</strong><br>
      ${p.comuna || ""}<br>
      💰 ${p.precio?.arriendo?.pesos || p.precio?.venta?.pesos || "—"}<br>
      🛏 ${p.dormitorios || "?"} | 🛁 ${p.banos || "?"}<br>
      ${p.url ? `<a href="${p.url}" target="_blank">Ver ficha</a>` : ""}
    `;

    container.appendChild(card);
  });

  chat.appendChild(container);
  chat.scrollTop = chat.scrollHeight;
}

// ===============================
// API CALL
// ===============================

async function sendMessage(message) {
  addMessage(message, "user");

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        session_id: sessionId
      })
    });

    const data = await res.json();
    console.log("API response:", data);

    if (data.type === "question") {
      addMessage(data.message, "assistant");
    } 
    else if (data.type === "results") {
      addMessage(`Encontré ${data.results.length} propiedades:`, "assistant");
      addResults(data.results);
    } 
    else {
      addMessage("⚠️ Respuesta no reconocida.", "assistant");
    }

  } catch (err) {
    console.error(err);
    addMessage("⚠️ Error de conexión con el servidor.", "assistant");
  }
}

// ===============================
// FORM HANDLER
// ===============================

form.addEventListener("submit", e => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  sendMessage(text);
});

// ===============================
// URL → CONVERSACIÓN
// ===============================

function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    tipo: params.get("tipo"),
    operacion: params.get("operacion"),
    comuna: params.get("comuna"),
    max: params.get("max"),
  };
}

function buildMessageFromParams(params) {
  let parts = [];

  parts.push("busco");

  if (params.tipo) {
    parts.push(params.tipo);
  } else {
    parts.push("propiedad");
  }

  if (params.comuna) {
    parts.push("en " + params.comuna);
  }

  if (params.operacion) {
    parts.push("en " + params.operacion);
  }

  if (params.max) {
    parts.push("hasta " + params.max);
  }

  return parts.join(" ");
}

// ===============================
// AUTO BUSCAR AL CARGAR
// ===============================

window.addEventListener("load", () => {
  const params = getQueryParams();

  if (params.tipo || params.operacion || params.comuna || params.max) {
    const message = buildMessageFromParams(params);
    sendMessage(message);
  }
});
