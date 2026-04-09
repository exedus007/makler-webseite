const CONFIG = {
  projectId: "lya1es34",
  dataset: "production",
  endpoint: "contact.php"
};

/* ================= ERROR HANDLING ================= */
function getErrorMessage() {
  if (!navigator.onLine) return "Keine Internetverbindung.";
  return "Ein Fehler ist aufgetreten.";
}

/* ================= IMMOBILIEN ================= */
async function ladeObjekte() {
  const container = document.getElementById("objekte-container");

  container.innerHTML = "<p>Lade Immobilien...</p>";

  try {
    const query = encodeURIComponent(`
      *[_type=="immobilie"] | order(_createdAt desc){
        titel,
        ort,
        preis
      }
    `);

    const url = `https://${CONFIG.projectId}.api.sanity.io/v2023-01-01/data/query/${CONFIG.dataset}?query=${query}`;
    const res = await fetch(url);

    if (!res.ok) throw new Error();

    const data = await res.json();
    const list = data.result;

    if (!list.length) {
      container.innerHTML = "<p>Keine Objekte verfügbar.</p>";
      return;
    }

    container.innerHTML = list.map(obj => `
      <div class="card">
        <h3>${obj.titel}</h3>
        <p>${obj.ort}</p>
        <strong>${obj.preis || "Preis auf Anfrage"}</strong>
      </div>
    `).join("");

  } catch (e) {
    container.innerHTML = "<p>Fehler beim Laden der Immobilien.</p>";
  }
}

/* ================= FORM ================= */
function initForm() {
  const form = document.getElementById("contact-form");
  const status = document.getElementById("contact-form-status");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    status.textContent = "Wird gesendet...";

    try {
      const res = await fetch(CONFIG.endpoint, {
        method: "POST",
        body: new FormData(form)
      });

      const data = await res.json();

      if (data.success) {
        status.textContent = "Erfolgreich gesendet!";
        form.reset();
      } else {
        status.textContent = data.message;
      }

    } catch {
      status.textContent = getErrorMessage();
    }
  });
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  ladeObjekte();
  initForm();
});
