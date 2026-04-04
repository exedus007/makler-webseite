const projectId = "lya1es34";
const dataset = "production";
const formspreeEndpoint = "https://formspree.io/f/DEINE_FORMSPREE_ID";

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

const menuToggle = document.getElementById("menu-toggle");
const navLinks = document.getElementById("nav-links");
const navBackdrop = document.getElementById("nav-backdrop");

function istMobileNavigation() {
  return window.innerWidth <= 768;
}

function oeffneMenue() {
  navLinks.classList.add("open");
  menuToggle.setAttribute("aria-expanded", "true");
  document.body.classList.add("nav-open");

  if (navBackdrop) {
    navBackdrop.hidden = false;
    navBackdrop.classList.add("show");
  }
}

function schliesseMenue() {
  navLinks.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  document.body.classList.remove("nav-open");

  if (navBackdrop) {
    navBackdrop.classList.remove("show");
    navBackdrop.hidden = true;
  }
}

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    navLinks.classList.contains("open")
      ? schliesseMenue()
      : oeffneMenue();
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      if (istMobileNavigation()) schliesseMenue();
    });
  });
}

if (navBackdrop) {
  navBackdrop.addEventListener("click", schliesseMenue);
}

window.addEventListener("resize", () => {
  if (!istMobileNavigation()) schliesseMenue();
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

if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const privacy = contactForm.querySelector('input[name="privacy"]');
    if (privacy && !privacy.checked) {
      alert("Bitte bestätigen Sie die Datenschutzhinweise.");
      return;
    }

    if (formspreeEndpoint.includes("DEINE_FORMSPREE_ID")) {
      alert("Bitte Formspree-ID eintragen.");
      return;
    }

    const btn = contactForm.querySelector(".submit-btn");
    const text = btn.textContent;

    btn.disabled = true;
    btn.textContent = "Wird gesendet...";

    try {
      const response = await fetch(formspreeEndpoint, {
        method: "POST",
        body: new FormData(contactForm),
        headers: { Accept: "application/json" }
      });

      if (response.ok) {
        alert("Gesendet!");
        contactForm.reset();
      } else {
        alert("Fehler beim Senden.");
      }
    } catch (e) {
      alert("Serverfehler.");
    }

    btn.disabled = false;
    btn.textContent = text;
  });
}

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

    const res = await fetch(
      `https://${projectId}.api.sanity.io/v2023-01-01/data/query/${dataset}?query=${query}`
    );

    if (!res.ok) throw new Error();

    const data = await res.json();
    objekteListe = (data.result || []).filter(
      (o) => o.status !== "verkauft"
    );

    if (!objekteListe.length) {
      container.innerHTML = "<p>Keine Objekte vorhanden.</p>";
      return;
    }

    container.innerHTML = "";

    objekteListe.forEach((obj, i) => {
      const btn = document.createElement("button");
      btn.className = "object-item";

      const img =
        obj?.bild?.asset?._ref
          ? bildUrlAusRef(obj.bild.asset._ref)
          : "assets/makler.jpg";

      btn.innerHTML = `
        <img src="${img}" alt="">
        <div class="object-text">
          <strong>${escapeHtml(obj.titel)}</strong>
          <p>${escapeHtml(obj.wohnflaeche)} · ${escapeHtml(obj.ort)}</p>
          <span class="${statusBadgeClass(obj.status)}">
            ${statusText(obj.status)}
          </span>
        </div>
      `;

      btn.onclick = () => {
        aktuellerObjektIndex = i;
        zeigeObjektModal(i);
      };

      container.appendChild(btn);
    });
  } catch (e) {
    container.innerHTML = "<p>Fehler beim Laden.</p>";
  }
}

const objectModal = document.getElementById("object-modal");
const objectModalContent = document.getElementById("object-modal-content");
const objectModalTitle = document.getElementById("object-modal-title");

function zeigeObjektModal(i) {
  const obj = objekteListe[i];
  if (!obj) return;

  const img =
    obj?.bild?.asset?._ref
      ? bildUrlAusRef(obj.bild.asset._ref)
      : "assets/makler.jpg";

  objectModalTitle.textContent = obj.titel;

  objectModalContent.innerHTML = `
    <img src="${img}" style="width:100%;margin-bottom:20px;">
    <p>${escapeHtml(obj.beschreibung)}</p>
  `;

  objectModal.classList.add("open");
}

document
  .getElementById("close-object-modal")
  ?.addEventListener("click", () => {
    objectModal.classList.remove("open");
  });

ladeObjekte();
