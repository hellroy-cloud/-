/**
 * AutoImport Pro — интерактив лендинга
 *
 * Точки расширения:
 * - CatalogApp    — будущий каталог автомобилей
 * - DutyCalculator — калькулятор растаможки
 * - Forms         — заявки (сейчас: звонок / расчёт стоимости)
 */
(function () {
  "use strict";

  const SELECTORS = {
    header: "#header",
    nav: "#nav",
    burger: "#burger",
    navLinks: ".nav__link",
    reveal: ".reveal",
    year: "#year",
    callbackForm: "#callback-form",
    toast: "#toast",
    calcCta: "#cta-calc",
  };

  const Forms = {
    open(id, options = {}) {
      const modal = document.getElementById(id);
      if (!modal) return;
      modal.hidden = false;
      modal.classList.add("is-open");
      document.body.style.overflow = "hidden";

      if (options.title) {
        const title = modal.querySelector("h2");
        if (title) title.textContent = options.title;
      }
      if (options.lead) {
        const lead = modal.querySelector(".modal__lead");
        if (lead) lead.textContent = options.lead;
      }
      const intent = modal.querySelector("#form-intent");
      if (intent && options.intent) intent.value = options.intent;

      const firstInput = modal.querySelector("input:not([type='hidden'])");
      if (firstInput) firstInput.focus();
    },

    close(modal) {
      if (!modal) return;
      modal.classList.remove("is-open");
      modal.hidden = true;
      document.body.style.overflow = "";
    },

    closeAll() {
      document.querySelectorAll(".modal.is-open").forEach((m) => Forms.close(m));
    },
  };

  function initYear() {
    const el = document.querySelector(SELECTORS.year);
    if (el) el.textContent = String(new Date().getFullYear());
  }

  /* Плавный скролл к якорям (с учётом липкой шапки) */
  function initSmoothScroll() {
    const header = document.querySelector(SELECTORS.header);
    const offset = header ? header.offsetHeight : 0;

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (event) => {
        const id = link.getAttribute("href");
        if (!id || id === "#") return;
        const target = document.querySelector(id);
        if (!target) return;

        event.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - offset + 1;
        window.scrollTo({ top, behavior: "smooth" });
        document.body.classList.remove("nav-open");
        const burger = document.querySelector(SELECTORS.burger);
        if (burger) burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  function initMobileNav() {
    const burger = document.querySelector(SELECTORS.burger);
    if (!burger) return;

    burger.addEventListener("click", () => {
      const open = document.body.classList.toggle("nav-open");
      burger.setAttribute("aria-expanded", String(open));
    });
  }

  /* Fade-in блоков при появлении во вьюпорте */
  function initReveal() {
    const nodes = document.querySelectorAll(SELECTORS.reveal);
    if (!("IntersectionObserver" in window)) {
      nodes.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    nodes.forEach((el) => observer.observe(el));
  }

  function initModals() {
    document.querySelectorAll("[data-open-modal]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const name = btn.getAttribute("data-open-modal");
        if (name === "callback") {
          Forms.open("modal-callback", {
            title: "Заказать звонок",
            lead: "Оставьте контакты — менеджер перезвонит в рабочее время.",
            intent: "callback",
          });
        } else if (name === "privacy") {
          Forms.open("modal-privacy");
        }
      });
    });

    const calc = document.querySelector(SELECTORS.calcCta);
    if (calc) {
      calc.addEventListener("click", (event) => {
        event.preventDefault();
        Forms.open("modal-callback", {
          title: "Рассчитать стоимость",
          lead: "Укажите имя и телефон — подготовим расчёт под ваш бюджет и регион.",
          intent: "calculate",
        });
      });
    }

    document.querySelectorAll("[data-close-modal]").forEach((el) => {
      el.addEventListener("click", () => {
        Forms.close(el.closest(".modal"));
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") Forms.closeAll();
    });
  }

  function showToast() {
    const toast = document.querySelector(SELECTORS.toast);
    if (!toast) return;
    toast.hidden = false;
    window.clearTimeout(showToast._timer);
    showToast._timer = window.setTimeout(() => {
      toast.hidden = true;
    }, 3800);
  }

  function isValidPhone(value) {
    const digits = value.replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 15;
  }

  function initCallbackForm() {
    const form = document.querySelector(SELECTORS.callbackForm);
    if (!form) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = form.elements.namedItem("name");
      const phone = form.elements.namedItem("phone");
      let valid = true;

      [name, phone].forEach((input) => input.classList.remove("is-invalid"));

      if (!name.value.trim()) {
        name.classList.add("is-invalid");
        valid = false;
      }
      if (!isValidPhone(phone.value)) {
        phone.classList.add("is-invalid");
        valid = false;
      }
      if (!valid) return;

      /* Здесь позже: fetch('/api/leads') или интеграция с CRM */
      const payload = {
        name: name.value.trim(),
        phone: phone.value.trim(),
        intent: form.elements.namedItem("intent").value,
      };
      console.info("Lead submitted", payload);

      form.reset();
      Forms.closeAll();
      showToast();
    });
  }

  /* Подсветка пункта меню по текущей секции */
  function initActiveNav() {
    const sections = document.querySelectorAll("section[id], footer[id]");
    const links = document.querySelectorAll(SELECTORS.navLinks);
    if (!sections.length) return;

    const map = new Map();
    links.forEach((link) => {
      const id = link.getAttribute("href");
      if (id) map.set(id.replace("#", ""), link);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          links.forEach((l) => l.classList.remove("is-active"));
          const link = map.get(entry.target.id);
          if (link) link.classList.add("is-active");
        });
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
    );

    sections.forEach((s) => observer.observe(s));
  }

  document.addEventListener("DOMContentLoaded", () => {
    initYear();
    initSmoothScroll();
    initMobileNav();
    initReveal();
    initModals();
    initCallbackForm();
    initActiveNav();
  });

  /* Экспорт заготовок для следующих модулей */
  window.AutoImportPro = {
    Forms,
    CatalogApp: null,
    DutyCalculator: null,
  };
})();
