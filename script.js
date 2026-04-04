// ============================
// KONFIG
// ============================
const projectId = "lya1es34";
const dataset = "production";
const formspreeEndpoint = "https://formspree.io/f/DEINE_FORMSPREE_ID";

let objekteListe = [];
let aktuellerObjektIndex = 0;

// ============================
// HELPER
// ============================
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ============================
// MOBILE MENU
// ============================
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

// ============================
// FAQ
// ============================
document.querySelectorAll(".faq-question").forEach((btn) => {
  btn.addEventListener("click", () => {
    const item = btn.closest(".faq-item");
    item.classList.toggle("open");
  });
});

// ============================
// REVEAL ANIMATION
// ============================
const revealElements = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
      }
    });
  });

  revealElements.forEach((el) => observer.observe(el));
}

// ============================
// SCROLL TOP BUTTON
// ============================
const scrollBtn = document.getElementById("scroll-top-btn");

window.addEventListener("scroll", () => {
  if (!scrollBtn) return;

  if (window.scrollY > 400) {
    scrollBtn.classList.add("show");
  } else {
    scrollBtn.classList.remove("show");
  }
});

if (scrollBtn) {
  scrollBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
}

// ============================
// KONTAKTFORMULAR
// ============================
const contactForm = document.getElementById("contact-form");

if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const privacy = contactForm.querySelector('[name="privacy"]');
    if (privacy && !privacy.checked) {
      alert("Bitte Datenschutz bestätigen");
      return;
    }

    if (formspreeEndpoint.includes("DEINE_FORMSPREE_ID")) {
      alert("Formspree ID fehlt");
      return;
    }

    const btn = contactForm.querySelector(".submit-btn");
    btn.disabled = true;
    btn.textContent = "Sende...";

    try {
      const formData = new FormData(contactForm);

      const res = await fetch(formspreeEndpoint, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" }
      });

      if (res.ok) {
        alert("Erfolgreich gesendet!");
        contactForm.reset();
      } else {
        alert("Fehler beim Senden");
      }

    } catch (err) {
      alert("Netzwerkfehler");
    }

    btn.disabled = false;
    btn.textContent = "Anfrage senden";
  });
}

// ============================
// OBJEKTE LADEN (CMS)
// ============================
async function ladeObjekte() {
  const container = document.getElementById("objekte-container");
  if (!container) return;

  try {
    const query = encodeURIComponent(`
      *[_type=="immobilie"]{
        _id,
        titel,
        ort,
        preis,
        wohnflaeche,
        bild
      }
    `);

    const url = `https://${projectId}.api.sanity.io/v1/data/query/${dataset}?query=${query}`;
    const res = await fetch(url);
    const data = await res.json();

    objekteListe = data.result || [];

    container.innerHTML = "";

    objekteListe.forEach((objekt, index) => {
      const el = document.createElement("div");
      el.className = "object-item";

      el.innerHTML = `
        <strong>${escapeHtml(objekt.titel)}</strong>
        <p>${escapeHtml(objekt.ort)}</p>
      `;

      el.addEventListener("click", () => openModal(index));
      container.appendChild(el);
    });

  } catch (err) {
    console.error(err);
  }
}

// ============================
// MODAL
// ============================
const modal = document.getElementById("object-modal");

function openModal(index) {
  aktuellerObjektIndex = index;

  const obj = objekteListe[index];
  if (!obj || !modal) return;

  modal.querySelector("#object-modal-title").textContent = obj.titel;

  modal.classList.add("open");
}

function closeModal() {
  modal.classList.remove("open");
}

document.getElementById("close-object-modal")?.addEventListener("click", closeModal);

// ============================
// KEYBOARD NAV
// ============================
document.addEventListener("keydown", (e) => {
  if (!modal?.classList.contains("open")) return;

  if (e.key === "Escape") closeModal();
});

// ============================
// INIT
// ============================
ladeObjekte();
