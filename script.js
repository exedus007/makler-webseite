document.addEventListener("DOMContentLoaded", function () {
  const faqQuestions = document.querySelectorAll(".faq-question");
  const menuToggle = document.getElementById("menu-toggle");
  const navMenu = document.getElementById("nav-links");
  const navLinks = document.querySelectorAll(".nav-links a");
  const sections = document.querySelectorAll("section[id], header[id]");
  const revealElements = document.querySelectorAll(".reveal");

  const objectItems = document.querySelectorAll(".object-item");
  const objectModal = document.getElementById("object-modal");
  const objectModalTitle = document.getElementById("object-modal-title");
  const objectModalImage = document.getElementById("object-modal-image");
  const objectModalText = document.getElementById("object-modal-text");
  const closeObjectModal = document.getElementById("close-object-modal");

  const scrollTopBtn = document.getElementById("scroll-top-btn");

  faqQuestions.forEach(function (question) {
    question.addEventListener("click", function () {
      const item = question.parentElement;
      const isOpen = item.classList.contains("active");

      document.querySelectorAll(".faq-item").forEach(function (faqItem) {
        faqItem.classList.remove("active");
        const button = faqItem.querySelector(".faq-question");
        if (button) {
          button.setAttribute("aria-expanded", "false");
        }
      });

      if (!isOpen) {
        item.classList.add("active");
        question.setAttribute("aria-expanded", "true");
      }
    });
  });

  if (menuToggle && navMenu) {
    menuToggle.addEventListener("click", function () {
      menuToggle.classList.toggle("active");
      navMenu.classList.toggle("open");

      const expanded = menuToggle.getAttribute("aria-expanded") === "true";
      menuToggle.setAttribute("aria-expanded", String(!expanded));
    });

    navLinks.forEach(function (link) {
      link.addEventListener("click", function () {
        if (window.innerWidth <= 768) {
          navMenu.classList.remove("open");
          menuToggle.classList.remove("active");
          menuToggle.setAttribute("aria-expanded", "false");
        }
      });
    });
  }

  function updateActiveNav() {
    let current = "";

    sections.forEach(function (section) {
      const sectionTop = section.offsetTop - 160;
      const sectionHeight = section.offsetHeight;

      if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
        current = section.getAttribute("id");
      }
    });

    navLinks.forEach(function (link) {
      link.classList.remove("active");
      if (link.getAttribute("href") === "#" + current) {
        link.classList.add("active");
      }
    });
  }

  function openObjectModal(title, img, details) {
    if (!objectModal) return;

    objectModalTitle.textContent = title;
    objectModalImage.src = img;
    objectModalImage.alt = title;
    objectModalText.textContent = details;

    objectModal.classList.add("open");
    objectModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }

  function closeObject() {
    if (!objectModal) return;

    objectModal.classList.remove("open");
    objectModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  objectItems.forEach(function (item) {
    item.addEventListener("click", function () {
      const title = item.getAttribute("data-title") || "Objekt";
      const img = item.getAttribute("data-img") || "";
      const details = item.getAttribute("data-details") || "";

      openObjectModal(title, img, details);
    });
  });

  if (closeObjectModal) {
    closeObjectModal.addEventListener("click", function () {
      closeObject();
    });
  }

  if (objectModal) {
    objectModal.addEventListener("click", function (event) {
      if (event.target === objectModal) {
        closeObject();
      }
    });
  }

  if (scrollTopBtn) {
    scrollTopBtn.addEventListener("click", function () {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
  }

  function toggleScrollTopButton() {
    if (!scrollTopBtn) return;

    if (window.scrollY > 500) {
      scrollTopBtn.classList.add("show");
    } else {
      scrollTopBtn.classList.remove("show");
    }
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      if (objectModal && objectModal.classList.contains("open")) {
        closeObject();
      }
    }
  });

  function revealOnScroll() {
    revealElements.forEach(function (element) {
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      if (rect.top < windowHeight - 80) {
        element.classList.add("visible");
      }
    });
  }

  updateActiveNav();
  revealOnScroll();
  toggleScrollTopButton();

  window.addEventListener("scroll", updateActiveNav);
  window.addEventListener("scroll", revealOnScroll);
  window.addEventListener("scroll", toggleScrollTopButton);
  window.addEventListener("resize", updateActiveNav);
});