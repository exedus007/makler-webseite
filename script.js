const projectId = "lya1es34";
const dataset = "production";
const formspreeEndpoint = "https://formspree.io/f/DEINE_FORMSPREE_ID";

let objekteListe = [];
let aktuellerObjektIndex = 0;

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function bildUrlAusRef(ref) {
  if (!ref) return "";
  const parts = ref.split("-");
  const id = parts[1];
  const dimensions = parts[2];
  const format = parts[3];

  if (!id || !dimensions || !format) return "";
  return `https://cdn.sanity.io/images/${projectId}/${dataset}/${id}-${dimensions}.${format}`;
}

function exposeUrlAusRef(ref) {
  if (!ref) return "";
  const parts = ref.split("-");
  const id = parts[1];
  const format = parts[2];

  if (!id || !format) return "";
  return `https://cdn.sanity.io/files/${projectId}/${dataset}/${id}.${format}`;
}

function statusText(status) {
  if (status === "reserviert") return "Reserviert";
  if (status === "verkauft") return "Verkauft";
  return "Verfügbar";
}

function statusBadgeClass(status) {
  if (status === "reserviert") return "object-status-reserviert";
  if (status === "verkauft") return "object-status-verkauft";
  return "object-status-verfuegbar";
}

/* Menü */
const menuToggle = document.getElementById("menu-toggle");
const navLinks = document.getElementById("nav-links");

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
    const expanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!expanded));
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

/* FAQ */
document.querySelectorAll(".faq-question").forEach((btn) => {
  btn.addEventListener("click", () => {
    const item = btn.closest(".faq-item");
    const expanded = btn.getAttribute("aria-expanded") === "true";

    btn.setAttribute("aria-expanded", String(!expanded));
    item.classList.toggle("open");
  });
});

/* Reveal */
const revealElements = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window && revealElements.length) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealElements.forEach((el) => revealObserver.observe(el));
} else {
  revealElements.forEach((el) => el.classList.add("revealed"));
}

/* Scroll top */
const scrollTopBtn = document.getElementById("scroll-top-btn");

window.addEventListener("scroll", () => {
  if (!scrollTopBtn) return;

  if (window.scrollY > 500) {
    scrollTopBtn.classList.add("show");
  } else {
    scrollTopBtn.classList.remove("show");
  }
});

if (scrollTopBtn) {
  scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* Kontaktformular Hauptformular */
const contactForm = document.getElementById("contact-form");

if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const privacy = contactForm.querySelector('input[name="privacy"]');
    if (privacy && !privacy.checked) {
      alert("Bitte bestätigen Sie die Datenschutzhinweise.");
      return;
    }

    if (formspreeEndpoint.includes("DEINE_FORMSPREE_ID")) {
      alert("Bitte tragen Sie zuerst Ihre echte Formspree-ID in der script.js ein.");
      return;
    }

    const submitButton = contactForm.querySelector(".submit-btn");
    const originalButtonText = submitButton ? submitButton.textContent : "";

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Wird gesendet...";
    }

    try {
      const formData = new FormData(contactForm);

      const response = await fetch(formspreeEndpoint, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json"
        }
      });

      if (response.ok) {
        alert("Vielen Dank! Ihre Anfrage wurde erfolgreich gesendet.");
        contactForm.reset();
      } else {
        alert("Beim Senden ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.");
      }
    } catch (error) {
      console.error("Fehler beim Senden des Hauptformulars:", error);
      alert("Beim Senden ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    }
  });
}

/* Objekte laden */
async function ladeObjekte() {
  const container = document.getElementById("objekte-container");
  if (!container) return;

  try {
    const query = encodeURIComponent(`
      *[_type=="immobilie"] | order(_createdAt desc){
        _id,
        titel,
        ort,
        preis,
        wohnflaeche,
        zimmer,
        status,
        beschreibung,
        bild,
        expose
      }
    `);

    const url = `https://${projectId}.api.sanity.io/v2023-01-01/data/query/${dataset}?query=${query}`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(\`HTTP-Fehler: \${res.status}\`);
    }

    const data = await res.json();
    objekteListe = (data.result || []).filter((obj) => obj.status !== "verkauft");

    if (objekteListe.length === 0) {
      container.innerHTML = '<p class="objects-empty">Aktuell sind keine verfügbaren oder reservierten Objekte vorhanden.</p>';
      return;
    }

    container.innerHTML = "";

    objekteListe.forEach((objekt, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "object-item";

      const titel = escapeHtml(objekt.titel || "Objekt");
      const wohnflaeche = escapeHtml(objekt.wohnflaeche || "");
      const ort = escapeHtml(objekt.ort || "");
      const bildUrl = objekt?.bild?.asset?._ref ? bildUrlAusRef(objekt.bild.asset._ref) : "assets/makler.jpg";

      button.innerHTML = `
        <img src="${bildUrl}" alt="${titel}">
        <div class="object-text">
          <strong>${titel}</strong>
          <p>${wohnflaeche} ${wohnflaeche && ort ? "·" : ""} ${ort}</p>
          <span class="object-status-badge ${statusBadgeClass(objekt.status)}">${statusText(objekt.status)}</span>
        </div>
      `;

      button.addEventListener("click", () => {
        aktuellerObjektIndex = index;
        zeigeObjektModal(index);
      });

      container.appendChild(button);
    });
  } catch (error) {
    console.error("Fehler beim Laden der Objekte:", error);
    container.innerHTML = '<p class="objects-empty">Fehler beim Laden der Objekte.</p>';
  }
}

/* Modal */
const objectModal = document.getElementById("object-modal");
const objectModalContent = document.getElementById("object-modal-content");
const objectModalTitle = document.getElementById("object-modal-title");
const closeObjectModal = document.getElementById("close-object-modal");
const prevObjectModal = document.getElementById("object-modal-prev");
const nextObjectModal = document.getElementById("object-modal-next");

function zeigeObjektModal(index) {
  const obj = objekteListe[index];
  if (!obj || !objectModal || !objectModalContent || !objectModalTitle) return;

  const titel = escapeHtml(obj.titel || "Objekt");
  const ort = escapeHtml(obj.ort || "");
  const preis = escapeHtml(obj.preis || "");
  const wohnflaeche = escapeHtml(obj.wohnflaeche || "");
  const zimmer = escapeHtml(obj.zimmer || "");
  const beschreibung = escapeHtml(obj.beschreibung || "");
  const objektId = escapeHtml(obj._id || "");
  const status = statusText(obj.status);

  objectModalTitle.textContent = obj.titel || "Objekt";

  const bildUrl = obj?.bild?.asset?._ref ? bildUrlAusRef(obj.bild.asset._ref) : "assets/makler.jpg";
  const exposeUrl = obj?.expose?.asset?._ref ? exposeUrlAusRef(obj.expose.asset._ref) : "";

  objectModalContent.innerHTML = `
    <div class="object-modal-layout">
      <div class="object-modal-visual">
        <img src="${bildUrl}" alt="${titel}" class="object-modal-image">
      </div>

      <div class="object-modal-info">
        <h4>${titel}</h4>

        <div class="object-modal-meta">
          <div class="object-modal-meta-item">
            <strong>Ort</strong>
            <span>${ort}</span>
          </div>
          <div class="object-modal-meta-item">
            <strong>Preis</strong>
            <span>${preis}</span>
          </div>
          <div class="object-modal-meta-item">
            <strong>Wohnfläche</strong>
            <span>${wohnflaeche}</span>
          </div>
          <div class="object-modal-meta-item">
            <strong>Zimmer</strong>
            <span>${zimmer}</span>
          </div>
        </div>

        <div class="object-modal-description">${beschreibung}</div>

        <span class="object-status-badge ${statusBadgeClass(obj.status)}">${status}</span>
        <div class="object-modal-id">Objekt-ID: ${objektId}</div>

        <div class="object-modal-actions">
          ${
            exposeUrl
              ? `<a class="object-action-btn secondary" href="${exposeUrl}" target="_blank" rel="noopener noreferrer">Exposé ansehen</a>`
              : ``
          }
          ${
            exposeUrl
              ? `<a class="object-action-btn outline" href="${exposeUrl}" download>Exposé herunterladen</a>`
              : ``
          }
        </div>

        <form class="object-inquiry-form" action="${formspreeEndpoint}" method="POST">
          <h5>Anfrage senden</h5>

          <input type="hidden" name="objekt_id" value="${objektId}">
          <input type="hidden" name="objekt_titel" value="${titel}">
          <input type="hidden" name="objekt_ort" value="${ort}">
          <input type="hidden" name="objekt_preis" value="${preis}">
          <input type="hidden" name="objekt_status" value="${escapeHtml(status)}">
          <input type="hidden" name="_subject" value="Neue Objektanfrage: ${titel} | ID: ${objektId}">

          <div class="object-form-grid">
            <div class="object-form-group">
              <label for="object-name">Name</label>
              <input id="object-name" type="text" name="name" required>
            </div>

            <div class="object-form-group">
              <label for="object-email">E-Mail</label>
              <input id="object-email" type="email" name="email" required>
            </div>

            <div class="object-form-group">
              <label for="object-phone">Telefon</label>
              <input id="object-phone" type="text" name="telefon">
            </div>

            <div class="object-form-group">
              <label for="object-betreff">Betreff</label>
              <input id="object-betreff" type="text" name="betreff" value="Anfrage zu ${titel}">
            </div>

            <div class="object-form-group full">
              <label for="object-message">Nachricht</label>
              <textarea id="object-message" name="message" required>Guten Tag,

ich interessiere mich für folgendes Objekt:

Titel: ${obj.titel || ""}
Ort: ${obj.ort || ""}
Preis: ${obj.preis || ""}
Status: ${status}
Objekt-ID: ${obj._id || ""}

Bitte kontaktieren Sie mich.

Vielen Dank.</textarea>
            </div>
          </div>

          <div class="object-form-note">
            Die Objekt-ID und die wichtigsten Objektdaten werden automatisch mitgesendet, damit Ihre Anfrage sofort dem richtigen Objekt zugeordnet werden kann.
          </div>

          <button type="submit" class="object-action-btn primary">Anfrage direkt senden</button>
        </form>
      </div>
    </div>
  `;

  objectModal.classList.add("open");
  objectModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function schliesseObjektModal() {
  if (!objectModal) return;

  objectModal.classList.remove("open");
  objectModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function vorherigesObjekt() {
  if (!objekteListe.length) return;
  aktuellerObjektIndex = (aktuellerObjektIndex - 1 + objekteListe.length) % objekteListe.length;
  zeigeObjektModal(aktuellerObjektIndex);
}

function naechstesObjekt() {
  if (!objekteListe.length) return;
  aktuellerObjektIndex = (aktuellerObjektIndex + 1) % objekteListe.length;
  zeigeObjektModal(aktuellerObjektIndex);
}

if (closeObjectModal) {
  closeObjectModal.addEventListener("click", schliesseObjektModal);
}

if (prevObjectModal) {
  prevObjectModal.addEventListener("click", vorherigesObjekt);
}

if (nextObjectModal) {
  nextObjectModal.addEventListener("click", naechstesObjekt);
}

if (objectModal) {
  objectModal.addEventListener("click", (e) => {
    if (e.target === objectModal) {
      schliesseObjektModal();
    }
  });
}

document.addEventListener("keydown", (e) => {
  if (!objectModal || !objectModal.classList.contains("open")) return;

  if (e.key === "Escape") schliesseObjektModal();
  if (e.key === "ArrowLeft") vorherigesObjekt();
  if (e.key === "ArrowRight") naechstesObjekt();
});

ladeObjekte();
