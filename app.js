import { sendMessageToBuscaprop } from "./js/gpt-agent.js";

// ===============================
// ELEMENTOS UI
// ===============================

const form = document.getElementById("chat-form");
const input = document.getElementById("chat-input");
const output = document.getElementById("chat-output");

// ===============================
// RENDER SIMPLE
// ===============================

function print(text) {
  output.textContent += text + "\n\n";
}

// ===============================
// EVENTO PRINCIPAL
// ===============================

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = input.value.trim();
  if (!text) return;

  print("👤 Usuario: " + text);
  input.value = "";

  try {
    const response = await sendMessageToBuscaprop(text);

    if (response.type === "message") {
      print("🤖 Buscaprop: " + response.text);
    }

    if (response.type === "results") {
      print("📦 Resultados:");
      print(JSON.stringify(response.data, null, 2));
    }

  } catch (err) {
    print("❌ Error: " + err.message);
    console.error(err);
  }
});
