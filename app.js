const ENDPOINT = "https://dry-cherry-9711.jptorresmendoza.workers.dev/";

const chat = document.getElementById("chat");
const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");

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

  results.forEach(p => {
    const card = document.createElement("div");
    card.className = "result-card";

    card.innerHTML = `
      <strong>${p.titulo || "Propiedad"}</strong><br>
      ${p.comuna || ""}<br>
      💰 ${p.precio_formateado || p.precio || "—"}<br>
      🛏 ${p.dormitorios || "?"} | 🛁 ${p.banos || "?"}<br>
      ${p.url ? `<a href="${p.url}" target="_blank">Ver ficha</a>` : ""}
    `;

    container.appendChild(card);
  });

  chat.appendChild(container);
  chat.scrollTop = chat.scrollHeight;
}

async function sendMessage(message) {
  addMessage(message, "user");

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
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
    else if (data.type === "error") {
      addMessage("⚠️ Ocurrió un error.", "assistant");
    } 
    else {
      addMessage("⚠️ Respuesta no reconocida.", "assistant");
    }

  } catch (err) {
    console.error(err);
    addMessage("⚠️ No pude conectar con el servidor.", "assistant");
  }
}

form.addEventListener("submit", e => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  sendMessage(text);
});
