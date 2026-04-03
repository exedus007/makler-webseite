const projectId = "lya1es34";
const dataset = "production";
const formspreeEndpoint = "https://formspree.io/f/DEIN_FORM_ID";

let objekteListe = [];
let aktuellerObjektIndex = 0;

function bildUrlAusRef(ref) {
  if (!ref) return "";
  const parts = ref.split("-");
  const id = parts[1];
  const dimensions = parts[2];
  const format = parts[3];
  return `https://cdn.sanity.io/images/${projectId}/${dataset}/${id}-${dimensions}.${format}`;
}

function exposeUrlAusRef(ref) {
  if (!ref) return "";
  const parts = ref.split("-");
  const id = parts[1];
  const format = parts[2];
  return `https://cdn.sanity.io/files/${projectId}/${dataset}/${id}.${format}`;
}

function statusText(status) {
  if (status === "reserviert") return "Reserviert";
  if (status === "verkauft") return "Verkauft";
  return "Verfügbar";
}

function statusBadgeClass(status) {
  return status === "reserviert" ? "object-status-reserviert" : "object-status-verfuegbar";
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

  navLinks.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

/* FAQ */
document.querySelectorAll(".faq-question").forEach(btn => {
  btn.addEventListener("click", () => {
    const item = btn.closest(".faq-item");
    const expanded = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!expanded));
    item.classList.toggle("open");
  });
});

/* Reveal */
const revealElements = document.querySelectorAll(".reveal");
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("revealed");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealElements.forEach(el => revealObserver.observe(el));

/* Scroll top */
const scrollTopBtn = document.getElementById("scroll-top-btn");
window.addEventListener("scroll", () => {
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
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const privacy = contactForm.querySelector('input[name="privacy"]');
    if (privacy && !privacy.checked) {
      alert("Bitte bestätigen Sie die Datenschutzhinweise.");
      return;
    }

    alert("Dieses Hauptformular kannst du später ebenfalls mit Formspree verbinden.");
  });
}

/* Objekte laden */
async function ladeObjekte() {
  const container = document.getElementById("objekte-container");
  if (!container) return;

  try {
    const query = encodeURIComponent('*[_type=="immobilie"]');
    const url = `https://${projectId}.api.sanity.io/v2023-01-01/data/query/${dataset}?query=${query}`;
    const res = await fetch(url);
    const data = await res.json();

    objekteListe = (data.result || []).filter(obj => obj.status !== "verkauft");

    if (objekteListe.length === 0) {
      container.innerHTML = '<p class="objects-empty">Aktuell sind keine verfügbaren oder reservierten Objekte vorhanden.</p>';
      return;
    }

    container.innerHTML = "";

    objekteListe.forEach((objekt, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "object-item";

      let bildUrl = "";
      if (objekt.bild && objekt.bild.asset && objekt.bild.asset._ref) {
        bildUrl = bildUrlAusRef(objekt.bild.asset._ref);
      } else {
        bildUrl = "assets/makler.jpg";
      }

      button.innerHTML = `
        <img src="${bildUrl}" alt="${objekt.titel || "Objekt"}">
        <div class="object-text">
          <strong>${objekt.titel || "Objekt"}</strong>
          <p>${objekt.wohnflaeche || ""} · ${objekt.ort || ""}</p>
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
    console.error(error);
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
  if (!obj) return;

  objectModalTitle.textContent = obj.titel || "Objekt";

  let bildUrl = "";
  if (obj.bild && obj.bild.asset && obj.bild.asset._ref) {
    bildUrl = bildUrlAusRef(obj.bild.asset._ref);
  } else {
    bildUrl = "assets/makler.jpg";
  }

  let exposeUrl = "";
  if (obj.expose && obj.expose.asset && obj.expose.asset._ref) {
    exposeUrl = exposeUrlAusRef(obj.expose.asset._ref);
  }

  objectModalContent.innerHTML = `
    <div class="object-modal-layout">
      <div class="object-modal-visual">
        <img src="${bildUrl}" alt="${obj.titel || "Objekt"}" class="object-modal-image">
      </div>

      <div class="object-modal-info">
        <h4>${obj.titel || ""}</h4>

        <div class="object-modal-meta">
          <div class="object-modal-meta-item">
            <strong>Ort</strong>
            <span>${obj.ort || ""}</span>
          </div>
          <div class="object-modal-meta-item">
            <strong>Preis</strong>
            <span>${obj.preis || ""}</span>
          </div>
          <div class="object-modal-meta-item">
            <strong>Wohnfläche</strong>
            <span>${obj.wohnflaeche || ""}</span>
          </div>
          <div class="object-modal-meta-item">
            <strong>Zimmer</strong>
            <span>${obj.zimmer || ""}</span>
          </div>
        </div>

        <div class="object-modal-description">
          ${obj.beschreibung || ""}
        </div>

        <span class="object-status-badge ${statusBadgeClass(obj.status)}">${statusText(obj.status)}</span>
        <div class="object-modal-id">Objekt-ID: ${obj._id || ""}</div>

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

          <input type="hidden" name="objekt_id" value="${obj._id || ""}">
          <input type="hidden" name="objekt_titel" value="${obj.titel || ""}">
          <input type="hidden" name="objekt_ort" value="${obj.ort || ""}">
          <input type="hidden" name="objekt_preis" value="${obj.preis || ""}">
          <input type="hidden" name="objekt_status" value="${statusText(obj.status)}">
          <input type="hidden" name="_subject" value="Neue Objektanfrage: ${obj.titel || ""} | ID: ${obj._id || ""}">

          <div class="object-form-grid">
            <div class="object-form-group">
              <label>Name</label>
              <input type="text" name="name" required>
            </div>

            <div class="object-form-group">
              <label>E-Mail</label>
              <input type="email" name="email" required>
            </div>

            <div class="object-form-group">
              <label>Telefon</label>
              <input type="text" name="telefon">
            </div>

            <div class="object-form-group">
              <label>Betreff</label>
              <input type="text" name="betreff" value="Anfrage zu ${obj.titel || ""}">
            </div>

            <div class="object-form-group full">
              <label>Nachricht</label>
              <textarea name="message" required>Guten Tag,

ich interessiere mich für folgendes Objekt:

Titel: ${obj.titel || ""}
Ort: ${obj.ort || ""}
Preis: ${obj.preis || ""}
Status: ${statusText(obj.status)}
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
  if (!objectModal.classList.contains("open")) return;

  if (e.key === "Escape") schliesseObjektModal();
  if (e.key === "ArrowLeft") vorherigesObjekt();
  if (e.key === "ArrowRight") naechstesObjekt();
});

ladeObjekte();
