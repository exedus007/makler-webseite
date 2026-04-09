const projectId = "lya1es34";
const dataset = "production";

const contactEndpoint = "contact.php";
const objectInquiryEndpoint = "object-inquiry.php";

let objekteListe = [];
let aktuellerObjektIndex = 0;
let lastFocusedElement = null;

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

function kurzIdAusSanityId(id) {
  const clean = String(id || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (!clean) return "OBJ-UNBEKANNT";
  return `OBJ-${clean.slice(-6)}`;
}

function holeObjektReferenz(obj) {
  if (obj?.referenznummer && String(obj.referenznummer).trim()) {
    return String(obj.referenznummer).trim();
  }
  return kurzIdAusSanityId(obj?._id);
}

function setFormStatus(element, message, type = "") {
  if (!element) return;
  element.textContent = message || "";
  element.className = "form-status";
  if (type) {
    element.classList.add(type);
  }
}

function getReadableFetchErrorMessage() {
  if (!navigator.onLine) {
    return "Keine Internetverbindung. Bitte prüfen Sie Ihre Verbindung und versuchen Sie es erneut.";
  }
  return "Beim Senden ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.";
}

document.querySelectorAll(".footer a").forEach((a) => {
  a.target = "_blank";
  a.rel = "noopener noreferrer";
});

const menuToggle = document.getElementById("menu-toggle");
const navLinks = document.getElementById("nav-links");
const navBackdrop = document.getElementById("nav-backdrop");

function istMobileNavigation() {
  return window.innerWidth <= 768;
}

function oeffneMenue() {
  if (!menuToggle || !navLinks) return;

  navLinks.classList.add("open");
  menuToggle.classList.add("active");
  menuToggle.setAttribute("aria-expanded", "true");
  document.body.classList.add("nav-open");

  if (navBackdrop) {
    navBackdrop.hidden = false;
    navBackdrop.classList.add("show");
  }
}

function schliesseMenue() {
  if (!menuToggle || !navLinks) return;

  navLinks.classList.remove("open");
  menuToggle.classList.remove("active");
  menuToggle.setAttribute("aria-expanded", "false");
  document.body.classList.remove("nav-open");

  if (navBackdrop) {
    navBackdrop.classList.remove("show");
    navBackdrop.hidden = true;
  }
}

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.contains("open");
    if (isOpen) {
      schliesseMenue();
    } else {
      oeffneMenue();
    }
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      if (istMobileNavigation()) {
        schliesseMenue();
      }
    });
  });
}

if (navBackdrop) {
  navBackdrop.addEventListener("click", schliesseMenue);
}

window.addEventListener("resize", () => {
  if (!istMobileNavigation()) {
    schliesseMenue();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && navLinks?.classList.contains("open")) {
    schliesseMenue();
  }
});

document.querySelectorAll(".faq-question").forEach((btn) => {
  btn.addEventListener("click", () => {
    const item = btn.closest(".faq-item");
    const expanded = btn.getAttribute("aria-expanded") === "true";

    btn.setAttribute("aria-expanded", String(!expanded));
    item.classList.toggle("open");
  });
});

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

const contactForm = document.getElementById("contact-form");
const contactFormStatus = document.getElementById("contact-form-status");

if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const privacy = contactForm.querySelector('input[name="privacy"]');
    const honeypot = contactForm.querySelector('input[name="website"]');

    if (honeypot && honeypot.value.trim() !== "") {
      setFormStatus(contactFormStatus, "Vielen Dank. Ihre Anfrage wird verarbeitet.", "success");
      contactForm.reset();
      return;
    }

    if (privacy && !privacy.checked) {
      setFormStatus(contactFormStatus, "Bitte bestätigen Sie die Datenschutzhinweise.", "error");
      return;
    }

    const submitButton = contactForm.querySelector(".submit-btn");
    const originalButtonText = submitButton ? submitButton.textContent : "";

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Wird gesendet...";
    }

    setFormStatus(contactFormStatus, "");

    try {
      const formData = new FormData(contactForm);

      const response = await fetch(contactEndpoint, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json"
        }
      });

      let result = null;

      try {
        result = await response.json();
      } catch (jsonError) {
        result = null;
      }

      if (response.ok && result?.success) {
        setFormStatus(contactFormStatus, "Vielen Dank! Ihre Anfrage wurde erfolgreich gesendet.", "success");
        contactForm.reset();
      } else {
        setFormStatus(
          contactFormStatus,
          result?.message || "Beim Senden ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
          "error"
        );
      }
    } catch (error) {
      console.error("Fehler beim Senden des Kontaktformulars:", error);
      setFormStatus(contactFormStatus, getReadableFetchErrorMessage(), "error");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    }
  });
}

async function ladeObjekte() {
  const container = document.getElementById("objekte-container");
  if (!container) return;

  container.innerHTML = '<p class="objects-empty">Objekte werden geladen...</p>';

  try {
    const query = encodeURIComponent(`
      *[_type=="immobilie"] | order(_createdAt desc){
        _id,
        referenznummer,
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
      throw new Error(`HTTP-Fehler: ${res.status}`);
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
      const referenz = escapeHtml(holeObjektReferenz(objekt));
      const bildUrl = objekt?.bild?.asset?._ref ? bildUrlAusRef(objekt.bild.asset._ref) : "assets/makler.jpg";

      button.innerHTML = `
        <img src="${bildUrl}" alt="${titel}" loading="lazy">
        <div class="object-text">
          <strong>${titel}</strong>
          <p>${wohnflaeche} ${wohnflaeche && ort ? "·" : ""} ${ort}</p>
          <p class="object-reference">Referenz: ${referenz}</p>
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
    container.innerHTML = '<p class="objects-empty">Fehler beim Laden der Objekte. Bitte versuchen Sie es später erneut.</p>';
  }
}

const objectModal = document.getElementById("object-modal");
const objectModalContent = document.getElementById("object-modal-content");
const objectModalTitle = document.getElementById("object-modal-title");
const closeObjectModal = document.getElementById("close-object-modal");
const prevObjectModal = document.getElementById("object-modal-prev");
const nextObjectModal = document.getElementById("object-modal-next");

function focusFirstModalElement() {
  if (!objectModal) return;
  const focusable = objectModal.querySelectorAll(
    'button, a[href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
  );
  if (focusable.length) {
    focusable[0].focus();
  }
}

function trapModalFocus(e) {
  if (!objectModal || !objectModal.classList.contains("open")) return;

  const focusable = objectModal.querySelectorAll(
    'button, a[href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
  );

  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (e.key === "Tab") {
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

function zeigeObjektModal(index) {
  const obj = objekteListe[index];
  if (!obj || !objectModal || !objectModalContent || !objectModalTitle) return;

  lastFocusedElement = document.activeElement;

  const titelRaw = obj.titel || "Objekt";
  const ortRaw = obj.ort || "";
  const preisRaw = obj.preis || "";
  const wohnflaecheRaw = obj.wohnflaeche || "";
  const zimmerRaw = obj.zimmer || "";
  const beschreibungRaw = obj.beschreibung || "";
  const statusRaw = statusText(obj.status);
  const objektIdInternRaw = obj._id || "";
  const objektRefRaw = holeObjektReferenz(obj);

  const titel = escapeHtml(titelRaw);
  const ort = escapeHtml(ortRaw);
  const preis = escapeHtml(preisRaw);
  const wohnflaeche = escapeHtml(wohnflaecheRaw);
  const zimmer = escapeHtml(zimmerRaw);
  const beschreibung = escapeHtml(beschreibungRaw);
  const status = escapeHtml(statusRaw);
  const objektIdIntern = escapeHtml(objektIdInternRaw);
  const objektRef = escapeHtml(objektRefRaw);

  objectModalTitle.textContent = titelRaw || "Objekt";

  const bildUrl = obj?.bild?.asset?._ref ? bildUrlAusRef(obj.bild.asset._ref) : "assets/makler.jpg";
  const exposeUrl = obj?.expose?.asset?._ref ? exposeUrlAusRef(obj.expose.asset._ref) : "";

  objectModalContent.innerHTML = `
    <div class="object-modal-layout">
      <div class="object-modal-visual">
        <img src="${bildUrl}" alt="${titel}" class="object-modal-image" loading="lazy">
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

        <span class="object-status-badge ${statusBadgeClass(obj.status)}">${statusRaw}</span>
        <div class="object-modal-id">Referenz: ${objektRef}</div>

        <div class="object-modal-actions">
          ${exposeUrl ? `<a class="object-action-btn secondary" href="${exposeUrl}" target="_blank" rel="noopener noreferrer">Exposé ansehen</a>` : ``}
          ${exposeUrl ? `<a class="object-action-btn outline" href="${exposeUrl}" download>Exposé herunterladen</a>` : ``}
        </div>

        <form class="object-inquiry-form" id="object-inquiry-form" novalidate>
          <h5>Anfrage senden</h5>

          <input
            type="text"
            name="website"
            class="hp-field"
            tabindex="-1"
            autocomplete="off"
            aria-hidden="true"
          >

          <input type="hidden" name="objekt_id_intern" value="${objektIdIntern}">
          <input type="hidden" name="objekt_ref" value="${objektRef}">
          <input type="hidden" name="objekt_titel" value="${titel}">
          <input type="hidden" name="objekt_ort" value="${ort}">
          <input type="hidden" name="objekt_preis" value="${preis}">
          <input type="hidden" name="objekt_status" value="${status}">
          <input type="hidden" name="_subject" value="Neue Objektanfrage: ${titel} | Referenz: ${objektRef}">

          <div class="object-form-grid">
            <div class="object-form-group">
              <label for="object-name">Name</label>
              <input id="object-name" type="text" name="name" autocomplete="name" required>
            </div>

            <div class="object-form-group">
              <label for="object-email">E-Mail</label>
              <input id="object-email" type="email" name="email" autocomplete="email" required>
            </div>

            <div class="object-form-group">
              <label for="object-phone">Telefon</label>
              <input id="object-phone" type="text" name="phone" autocomplete="tel">
            </div>

            <div class="object-form-group">
              <label for="object-betreff">Betreff</label>
              <input id="object-betreff" type="text" name="subject" value="Anfrage zu ${titel}">
            </div>

            <div class="object-form-group full">
              <label for="object-message">Nachricht</label>
              <textarea id="object-message" name="message" required>Guten Tag,

ich interessiere mich für folgendes Objekt:

Titel: ${titelRaw}
Ort: ${ortRaw}
Preis: ${preisRaw}
Status: ${statusRaw}
Referenz: ${objektRefRaw}

Bitte kontaktieren Sie mich.

Vielen Dank.</textarea>
            </div>
          </div>

          <label class="checkbox-wrap object-checkbox-wrap">
            <input type="checkbox" name="privacy" required>
            <span>
              Ich habe die
              <a href="assets/datenschutzbestimmungen.pdf" target="_blank" rel="noopener noreferrer">
                Datenschutzbestimmungen
              </a>
              gelesen und bin damit einverstanden, dass meine Angaben zur Bearbeitung meiner Anfrage gespeichert und verarbeitet werden.
            </span>
          </label>

          <div class="object-form-note">
            Die Referenz und die wichtigsten Objektdaten werden automatisch mitgesendet, damit Ihre Anfrage sofort dem richtigen Objekt zugeordnet werden kann.
          </div>

          <div class="form-status" id="object-form-status" aria-live="polite"></div>

          <button type="submit" class="object-action-btn primary object-submit-btn">Anfrage direkt senden</button>
        </form>
      </div>
    </div>
  `;

  objectModal.classList.add("open");
  objectModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  const objectForm = document.getElementById("object-inquiry-form");
  const objectFormStatus = document.getElementById("object-form-status");

  if (objectForm) {
    objectForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const privacy = objectForm.querySelector('input[name="privacy"]');
      const honeypot = objectForm.querySelector('input[name="website"]');

      if (honeypot && honeypot.value.trim() !== "") {
        setFormStatus(objectFormStatus, "Vielen Dank. Ihre Anfrage wird verarbeitet.", "success");
        objectForm.reset();
        return;
      }

      if (privacy && !privacy.checked) {
        setFormStatus(objectFormStatus, "Bitte bestätigen Sie die Datenschutzhinweise.", "error");
        return;
      }

      const submitButton = objectForm.querySelector(".object-submit-btn");
      const originalButtonText = submitButton ? submitButton.textContent : "";

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Wird gesendet...";
      }

      setFormStatus(objectFormStatus, "");

      try {
        const formData = new FormData(objectForm);

        const response = await fetch(objectInquiryEndpoint, {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json"
          }
        });

        let result = null;

        try {
          result = await response.json();
        } catch (jsonError) {
          result = null;
        }

        if (response.ok && result?.success) {
          setFormStatus(objectFormStatus, "Vielen Dank! Ihre Objektanfrage wurde erfolgreich gesendet.", "success");
          objectForm.reset();

          setTimeout(() => {
            schliesseObjektModal();
          }, 1200);
        } else {
          setFormStatus(
            objectFormStatus,
            result?.message || "Beim Senden ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
            "error"
          );
        }
      } catch (error) {
        console.error("Fehler beim Senden der Objektanfrage:", error);
        setFormStatus(objectFormStatus, getReadableFetchErrorMessage(), "error");
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalButtonText;
        }
      }
    });
  }

  setTimeout(() => {
    focusFirstModalElement();
  }, 0);
}

function schliesseObjektModal() {
  if (!objectModal) return;

  objectModal.classList.remove("open");
  objectModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");

  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus();
  }
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
  trapModalFocus(e);
});

function initRevealElements() {
  const revealElements = document.querySelectorAll(".reveal");
  if (!revealElements.length) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    revealElements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          currentObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.14,
      rootMargin: "0px 0px -40px 0px"
    }
  );

  revealElements.forEach((element) => observer.observe(element));
}

initRevealElements();
ladeObjekte();
