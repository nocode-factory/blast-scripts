/* =========================
   📆 UPDATE 04-06-2026
   ========================= */

/* =========================
   ✅ GESTION TYPEFORM (laisser en haut)
   ========================= */
(function TypeformManager() {
  /* =========================
       CONFIG
       ========================= */
  const CONFIG = {
    iframeSelector: ".tf-v1-iframe-wrapper iframe",
    iframeDelayMs: 400,
  };

  /* =========================
       HELPERS
       ========================= */
  function getEmailFromElement(element) {
    const mailInput =
      element.querySelector('input[type="email"]')?.value?.replace(
        /\+/g,
        "%2B",
      ) || "";
    if (mailInput) console.log(mailInput);
    return mailInput;
  }

  function updateIframeParams(params) {
    const iframe = document.querySelector(CONFIG.iframeSelector);
    if (!iframe) return;
    const currentSrc = iframe.getAttribute("src");
    let newSrc = currentSrc;
    if (params.email) {
      const sep = currentSrc.includes("?") ? "&" : "?";
      newSrc = `${currentSrc}${sep}email=${params.email}`;
    }
    iframe.setAttribute("src", newSrc);
    console.log("Updated iframe src:", iframe.src);
  }

  /**
   * Ouvre le Typeform correspondant au rôle demandé.
   * Fallback sur le premier trigger trouvé si aucun rôle ne correspond.
   *
   * @param {string} role  - data-tf-role du trigger (ex: "default", "special")
   * @param {string} email - email pré-rempli (optionnel)
   */
  function openTf({ role = "", email = "" } = {}) {
    const trigger =
      document.querySelector(`[OpenTf="trigger"][data-tf-role="${role}"]`) ??
        document.querySelectorAll('[OpenTf="trigger"]')[0];

    if (!trigger) {
      console.warn(
        `Typeform trigger not found${role ? ` for role: ${role}` : ""}`,
      );
      return;
    }

    // 1 — ouvrir popup
    trigger.click();

    // 2 — injecter email après création iframe
    if (email) {
      setTimeout(() => updateIframeParams({ email }), CONFIG.iframeDelayMs);
    }
  }

  /* =========================
       LISTENERS
       ========================= */

  // submit formulaire → récupère email + role depuis data-tf-role
  document.querySelectorAll('[OpenTf="form"]').forEach((form) => {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const email = getEmailFromElement(form);
      const role = form.dataset.tfRole || "";
      openTf({ role, email });
    });
  });

  // clic simple → ouvre le form lié via data-tf-role
  document.querySelectorAll('[OpenTf="btn"]').forEach((el) => {
    el.addEventListener("click", function (event) {
      event.preventDefault();
      const role = el.dataset.tfRole || "";
      openTf({ role });
    });
  });
  // Exposition globale pour debug console
  window.TypeformManager = { openTf };
})();

/* =========================
   ✅ NAVBAR
   ========================= */

if (window.innerWidth < 769) {
  document.addEventListener("DOMContentLoaded", function () {
    const menuButton = document.querySelector("#menuButton");
    const navbarMenus = document.querySelectorAll(".navbar5_menu");
    const mainWrapper = document.querySelector(".main-wrapper");
    const backgroundNavbar = document.querySelector(".background-navbar");
    const slideMenu = document.querySelector(".slide-menu");

    function openMenu() {
      backgroundNavbar.style.position = "absolute";
      backgroundNavbar.style.top = "0";
      backgroundNavbar.style.left = "0";
      backgroundNavbar.style.width = "100vw";
      backgroundNavbar.style.height = "100vh";
      backgroundNavbar.style.transform = "translateY(0)";
      backgroundNavbar.style.display = "block";
      mainWrapper.style.filter = "blur(4px)";
      mainWrapper.style.transition =
        "filter 0.5s cubic-bezier(.165, .84, .44, 1)";
      document.body.style.overflow = "hidden";
    }

    function closeMenu() {
      navbarMenus.forEach((menu) => {
        menu.style.display = "none";
      });
      backgroundNavbar.style.display = "none";
      backgroundNavbar.style.transform = "translateY(-100%)";
      mainWrapper.style.filter = "blur(0px)";
      document.body.style.overflow = "";
    }

    if (menuButton) {
      menuButton.addEventListener("click", () => {
        setTimeout(() => {
          const atLeastOneMenuOpen = Array.from(navbarMenus).some((menu) => {
            return window.getComputedStyle(menu).display === "flex";
          });
          atLeastOneMenuOpen ? openMenu() : closeMenu();
        }, 50);
      });
    }

    if (slideMenu) {
      slideMenu.addEventListener("click", (e) => {
        if (e.target === slideMenu) {
          closeMenu();
          // Simuler le clic sur menuButton pour que Webflow remette l'icône burger
          setTimeout(() => menuButton.click(), 10);
        }
      });
    }
  });
}

/* =========================
   ✅ GSAP ANIM GLOBAL
   ========================= */

gsap.registerPlugin(ScrollTrigger);

function animateElements() {
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());

  // Masquer tous les finals dès le départ
  document.querySelectorAll('[display="final"]').forEach((final) => {
    gsap.set(final, { display: "none", opacity: 0 });
  });

  gsap.utils.toArray('[data-animate="fade-up"]').forEach((element) => {
    const delay = parseFloat(element.dataset.delay) || 0;
    const startY = element.dataset.startY;
    const startX = element.dataset.startX;
    const endY = element.dataset.endY;
    const endX = element.dataset.endX;
    const startRotate = element.dataset.startRotate || 0;
    const endRotate = element.dataset.endRotate || 0;

    const skeletons = element.querySelectorAll('[display="skeleton"]');
    const finals = element.querySelectorAll('[display="final"]');

    gsap.fromTo(element, {
      opacity: 0,
      y: startY,
      x: startX,
      rotate: startRotate,
    }, {
      opacity: 1,
      y: endY,
      x: endX,
      rotate: endRotate,
      duration: 1,
      delay: delay,
      ease: "power3.out",
      scrollTrigger: {
        trigger: element,
        start: "top 95%",
        toggleActions: "play none none none",
        once: true,
        onEnter: () => {
          if (!skeletons.length || !finals.length) return;

          const skeletonDuration = 500;

          setTimeout(() => {
            skeletons.forEach((skeleton, i) => {
              const final = finals[i];
              if (!final) return;

              const tl = gsap.timeline();

              tl.to(skeleton, {
                opacity: 0,
                duration: 0.3,
                ease: "power2.in",
                onComplete: () => gsap.set(skeleton, { display: "none" }),
              });

              tl.set(final, { display: "block" });

              tl.to(final, {
                opacity: 1,
                duration: 0.4,
                ease: "power2.out",
              });
            });
          }, (delay * 1) + skeletonDuration);
        },
      },
    });
  });
}

// ============================================
// INIT
// ============================================

animateElements();


document.querySelectorAll('[gsap-trigger="click"]').forEach((trigger) => {
  trigger.addEventListener("click", function () {
    setTimeout(() => {
      animateElements();
    }, 300);
  });
});

/* =========================
   ✅ BENTO TO TABS TABLET/MOBILE
   ========================= */

const mediaQuery = window.matchMedia("(max-width: 991px)");

// Cache DOM au premier appel, évite les querySelectorAll répétés
let toggles = null;
function getToggles() {
  if (!toggles) {
    toggles = [...document.querySelectorAll('[card-blur-tabs="toggle"]')];
  }
  return toggles;
}

// Ouvre/ferme une liste via data-attribute (évite getComputedStyle)
function setListOpen(list, open) {
  if (open) {
    list.style.setProperty("height", "auto", "important");
    list.style.setProperty("overflow", "visible", "important");
    list.style.setProperty("display", "flex", "important");
    list.dataset.cbOpen = "1";
  } else {
    list.style.setProperty("height", "0px", "important");
    list.style.setProperty("overflow", "hidden", "important");
    list.style.setProperty("display", "none", "important");
    delete list.dataset.cbOpen;
  }
}

function isListOpen(list) {
  return list.dataset.cbOpen === "1";
}

// Met à jour le style d'un toggle en fonction de l'état (sans setTimeout ni rAF imbriqué)
function applyToggleStyle(toggle, open) {
  const dropdown = toggle.querySelector('[card-blur-tabs="dropdown"]');
  const dropdownDark = toggle.querySelector('[card-blur-tabs="dropdown-dark"]');

  // dropdown-close color
  toggle.querySelectorAll("[dropdown-close]").forEach((el) => {
    const closeColor = el.getAttribute("dropdown-close");
    if (!closeColor) return;
    el.style.setProperty("color", open ? "white" : closeColor, "important");
  });

  if (dropdown) {
    const child = dropdown.children[0];
    if (child) {
      child.style.setProperty(
        "transform",
        open ? "rotate(0deg)" : "rotate(180deg)",
        "important",
      );
    }
    dropdown.style.setProperty("color", open ? "white" : "", "important");
    dropdown.style.setProperty(
      "background-image",
      open ? "none" : "",
      "important",
    );
  }

  if (dropdownDark) {
    const child = dropdownDark.children[0];
    if (child) {
      child.style.setProperty(
        "transform",
        open ? "rotate(0deg)" : "rotate(180deg)",
        "important",
      );
    }
    dropdownDark.style.setProperty(
      "background-color",
      open ? "#00094A" : "",
      "important",
    );
    dropdownDark.style.setProperty("color", open ? "white" : "", "important");
    dropdownDark.style.setProperty("border", open ? "none" : "", "important");
  }
}

function resetToggleStyle(toggle) {
  const dropdown = toggle.querySelector('[card-blur-tabs="dropdown"]');
  const dropdownDark = toggle.querySelector('[card-blur-tabs="dropdown-dark"]');

  toggle.querySelectorAll("[dropdown-close]").forEach((el) => {
    el.style.color = "";
  });
  if (dropdown) {
    const child = dropdown.children[0];
    if (child) child.style.transform = "";
    dropdown.style.color = "";
    dropdown.style.backgroundImage = "";
  }
  if (dropdownDark) {
    const child = dropdownDark.children[0];
    if (child) child.style.transform = "";
    dropdownDark.style.backgroundColor = "";
    dropdownDark.style.color = "";
    dropdownDark.style.border = "";
  }
}

function initCardBlurTabs() {
  if (!mediaQuery.matches) {
    // Desktop : reset tout
    document.querySelectorAll('[card-blur-tabs="list"]').forEach((list) => {
      list.style.height = "";
      list.style.overflow = "";
      list.style.display = "";
      delete list.dataset.cbOpen;
    });
    getToggles().forEach(resetToggleStyle);
    return;
  }

  // Mobile/tablet : init état initial
  document.querySelectorAll('[card-blur-tabs="list"]').forEach((list) => {
    const isFirst = list.getAttribute("card-blur-tabs-load") === "first";
    setListOpen(list, isFirst);
  });

  // Sync les styles des toggles sur l'état initial
  getToggles().forEach((toggle) => {
    const lists = [
      ...toggle.parentElement.querySelectorAll('[card-blur-tabs="list"]'),
    ];
    const open = lists.some(isListOpen);
    applyToggleStyle(toggle, open);
  });
}

function handleCardBlurTabsClick() {
  getToggles().forEach((toggle) => {
    toggle.addEventListener("click", () => {
      if (!mediaQuery.matches) return;

      const siblingLists = [
        ...toggle.parentElement.querySelectorAll('[card-blur-tabs="list"]'),
      ];
      const wasOpen = siblingLists.some(isListOpen);

      // Ferme tout
      document.querySelectorAll('[card-blur-tabs="list"]').forEach((list) =>
        setListOpen(list, false)
      );
      // Reset les styles de tous les toggles
      getToggles().forEach((t) => applyToggleStyle(t, false));

      if (!wasOpen) {
        // Ouvre les listes du toggle cliqué
        siblingLists.forEach((list) => setListOpen(list, true));
        applyToggleStyle(toggle, true);
      }
    });
  });
}

mediaQuery.addEventListener("change", initCardBlurTabs);

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initCardBlurTabs();
    handleCardBlurTabsClick();
  });
} else {
  initCardBlurTabs();
  handleCardBlurTabsClick();
}

/* =========================
   ✅ IM MARQUEE INVESTIR : GESTION HIGHLIGHT
   ========================= */
function startRandomHighlight() {
  const viewport = document.querySelector("[data-marquee-viewport]");

  if (!viewport) {
    return;
  }

  let currentHighlightedItem = null;
  let currentLineIndex = 0;
  let rotationInterval = null;

  function getLines() {
    const lines = viewport.querySelectorAll("[data-line]");
    return Array.from(lines);
  }

  function getVisibleItemsInLine(line) {
    const viewportRect = viewport.getBoundingClientRect();
    const items = line.querySelectorAll("[data-highlight-target]");
    const visibleItems = [];

    const margin = 50;
    const visibleLeft = viewportRect.left + margin;
    const visibleRight = viewportRect.right - margin;

    items.forEach((item) => {
      const itemRect = item.getBoundingClientRect();
      const itemCenter = itemRect.left + itemRect.width / 2;
      const isVisible = itemCenter > visibleLeft && itemCenter < visibleRight;

      if (isVisible) {
        visibleItems.push({
          element: item,
          center: itemCenter,
          text: item.textContent.trim(),
        });
      }
    });

    return visibleItems;
  }

  function isItemStillVisible(item) {
    if (!item) return false;

    const viewportRect = viewport.getBoundingClientRect();
    const itemRect = item.element.getBoundingClientRect();
    const itemCenter = itemRect.left + itemRect.width / 2;

    const margin = 50;
    const visibleLeft = viewportRect.left + margin;
    const visibleRight = viewportRect.right - margin;

    return itemCenter > visibleLeft && itemCenter < visibleRight;
  }

  function removeHighlight() {
    if (currentHighlightedItem) {
      currentHighlightedItem.element.classList.remove("is-highlighted");

      // Retirer la classe couleur du label
      const labelElement = currentHighlightedItem.element.querySelector(
        ".label-industrie",
      );
      if (labelElement) {
        labelElement.classList.remove("text-color-custom");
      }

      // Remettre l'opacité à 0 pour .gradient-industrie
      const gradientElement = currentHighlightedItem.element.querySelector(
        ".gradient-industrie",
      );
      if (gradientElement) {
        gradientElement.style.opacity = "0";
      }

      currentHighlightedItem = null;
    }
  }

  function applyRandomHighlightOnCurrentLine() {
    const lines = getLines();
    const currentLine = lines[currentLineIndex];

    if (!currentLine) return false;

    const visibleItems = getVisibleItemsInLine(currentLine);

    if (visibleItems.length === 0) {
      return false;
    }

    const randomIndex = Math.floor(Math.random() * visibleItems.length);
    const selectedItem = visibleItems[randomIndex];

    currentHighlightedItem = selectedItem;
    selectedItem.element.classList.add("is-highlighted");

    // Ajouter la classe couleur au label
    const labelElement = selectedItem.element.querySelector(".label-industrie");
    if (labelElement) {
      labelElement.classList.add("text-color-custom");
    }

    // Mettre l'opacité à 1 pour .gradient-industrie
    const gradientElement = selectedItem.element.querySelector(
      ".gradient-industrie",
    );
    if (gradientElement) {
      gradientElement.style.opacity = "1";
    }

    return true;
  }

  function findNextLineWithVisibleItems() {
    const lines = getLines();
    let attempts = 0;
    const maxAttempts = lines.length;

    while (attempts < maxAttempts) {
      currentLineIndex = (currentLineIndex + 1) % lines.length;
      attempts++;

      if (applyRandomHighlightOnCurrentLine()) {
        return true;
      }
    }

    return false;
  }

  function applyRandomHighlightOnNextLine() {
    removeHighlight();

    if (findNextLineWithVisibleItems()) {
      resetRotationInterval();
    }
  }

  function checkVisibility() {
    if (currentHighlightedItem && !isItemStillVisible(currentHighlightedItem)) {
      removeHighlight();

      if (!applyRandomHighlightOnCurrentLine()) {
        findNextLineWithVisibleItems();
      }

      resetRotationInterval();
    }
  }

  function resetRotationInterval() {
    if (rotationInterval) {
      clearInterval(rotationInterval);
    }

    rotationInterval = setInterval(() => {
      applyRandomHighlightOnNextLine();
    }, 4000);
  }

  setInterval(checkVisibility, 100);

  setTimeout(() => {
    if (!applyRandomHighlightOnCurrentLine()) {
      findNextLineWithVisibleItems();
    }

    resetRotationInterval();
  }, 100);
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    startRandomHighlight();
  }, 500);
});

/* =========================
   🚧 Auto animate Startup Tags on map
   ========================= */
window.initTagsAnimateOnMap = initTagsAnimateOnMap;
function initTagsAnimateOnMap() {
  // ── CONFIG ──
  var INTERVAL = 2000; // délai entre chaque batch
  var FADE = 1200; // durée du fondu
  var STAGGER = 1200; // écart entre slots dans un même batch
  var BATCH = 2; // nb de slots changés par batch (fixe, plus prévisible)

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  document.querySelectorAll("[data-tag-rotator]").forEach(function (container) {
    var opacityOnly = container.dataset.tagFade === "opacity";
    var pool = Array.from(container.querySelectorAll("[data-tag]"));
    var slots = Array.from(container.querySelectorAll("[data-tag-slot]"))
      .filter(function (slot) {
        return getComputedStyle(slot).display !== "none";
      });

    var poolIndex = 0;
    function nextTag() {
      var tag = pool[poolIndex].cloneNode(true);
      poolIndex = (poolIndex + 1) % pool.length;
      return tag;
    }

    // ── Visibilité par slot ──
    var visibleSlots = new Set();
    var slotObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) visibleSlots.add(entry.target);
        else visibleSlots.delete(entry.target);
      });
    }, { threshold: 0.1 });

    // ── Affichage initial ──
    slots.forEach(function (slot) {
      slot.innerHTML = "";
      slot.style.width = "auto";
      slot.style.height = "auto";
      slot.appendChild(nextTag());
      if (opacityOnly) {
        slot.style.opacity = "0";
        slot.style.transition = "opacity " + FADE + "ms ease";
        slot.style.opacity = "1";
      } else {
        slot.classList.add("visible");
      }
      slotObserver.observe(slot);
    });

    // ── File d'attente tournante ──
    // Garantit que chaque slot visible est rafraîchi avant qu'un autre
    // repasse, puis on mélange la prochaine tournée pour varier l'ordre.
    var queue = [];
    function pickFromQueue(n) {
      var visible = Array.from(visibleSlots);
      if (visible.length === 0) return [];

      // Retire de la queue les slots devenus invisibles
      queue = queue.filter(function (s) {
        return visibleSlots.has(s);
      });

      // Complète / recharge la queue si elle est trop courte
      if (queue.length < n) {
        // Tous les slots visibles ont déjà été vus → on prépare un nouveau tour
        var remaining = visible.filter(function (s) {
          return !queue.includes(s);
        });
        queue = queue.concat(shuffle(remaining));
      }

      return queue.splice(0, Math.min(n, queue.length));
    }

    // ── Cycle batch ──
    function runBatch() {
      var picked = pickFromQueue(BATCH);
      picked.forEach(function (slot, i) {
        setTimeout(function () {
          if (opacityOnly) {
            slot.style.opacity = "0";
            setTimeout(function () {
              slot.innerHTML = "";
              slot.appendChild(nextTag());
              slot.style.opacity = "1";
            }, FADE);
          } else {
            slot.classList.remove("visible");
            slot.classList.add("exit");
            setTimeout(function () {
              slot.innerHTML = "";
              slot.appendChild(nextTag());
              slot.style.transition = "none";
              slot.classList.remove("exit");
              slot.offsetHeight; // force reflow
              slot.style.transition = "";
              slot.classList.add("visible");
            }, FADE);
          }
        }, i * STAGGER);
      });
    }

    // ── Démarrage ──
    runBatch();
    setInterval(runBatch, INTERVAL);
  });
}
/* =========================
   ✅ AUTO ROTATE FAKE TABS ANIMATION
   ========================= */

window.AutoRotateFakeTabs = AutoRotateFakeTabs;
function AutoRotateFakeTabs() {
  // ---- FIND ELEMENTS ----
  var wrap = document.querySelector("[data-tabs-wrap]");
  var triggers = wrap.querySelectorAll("[data-tabs-trigger]");
  var panels = wrap.querySelectorAll("[data-tabs-panel]");
  var bars = wrap.querySelectorAll("[data-tabs-progress-bar]");
  var duration = Number(wrap.getAttribute("data-tabs-duration")) || 5000;

  // ---- STATE ----
  var currentIndex = 0;
  var timer = null;

  // ---- SWITCH TO A TAB ----
  function switchToTab(index) {
    // 1. Remove "is-active" from all triggers and panels
    for (var i = 0; i < triggers.length; i++) {
      triggers[i].classList.remove("is-active");
      panels[i].classList.remove("is-active");
    }

    // 2. Add "is-active" to the chosen trigger and panel
    triggers[index].classList.add("is-active");
    panels[index].classList.add("is-active");

    // 3. Reset all progress bars to 0
    for (var i = 0; i < bars.length; i++) {
      bars[i].style.transition = "none";
      bars[i].style.width = "0%";
    }

    // 4. Animate the active progress bar to 100%
    void bars[index].offsetWidth; // force browser to apply the reset before animating
    bars[index].style.transition = "width " + duration + "ms linear";
    bars[index].style.width = "100%";

    // 5. Update state
    currentIndex = index;
  }

  // ---- GO TO NEXT TAB ----
  function goToNextTab() {
    var nextIndex = (currentIndex + 1) % triggers.length;
    switchToTab(nextIndex);
  }

  // ---- START / STOP AUTOPLAY ----
  function startAutoplay() {
    stopAutoplay();
    timer = setInterval(goToNextTab, duration);
  }

  function stopAutoplay() {
    clearInterval(timer);
  }

  // ---- CLICK ON A TAB ----
  for (var i = 0; i < triggers.length; i++) {
    (function (index) {
      triggers[index].addEventListener("click", function () {
        switchToTab(index);
        startAutoplay(); // restart timer after manual click
      });
    })(i);
  }

  // ---- PAUSE ON HOVER ----
  //wrap.addEventListener("mouseenter", stopAutoplay);
  //wrap.addEventListener("mouseleave", startAutoplay);

  // ---- INIT ----
  switchToTab(0);
  startAutoplay();
  // Mark as ready — this activates the CSS that hides inactive panels
  // Without JS (e.g. in the Webflow Designer), all panels stay visible
  wrap.setAttribute("data-tabs-ready", "");
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.querySelector("[data-tabs-wrap]")) {
    AutoRotateFakeTabs();
  }
});

/* =========================
   ✅ VIDEO MAGNETIC BTN
   ========================= */

/* ---------- Magnetic Effect ---------- */
function initMagneticEffect() {
  // On sélectionne maintenant la zone "wrapper" (.btn-magnetic) qui est plus grande
  const magnets = document.querySelectorAll(".btn-magnetic");
  if (window.innerWidth <= 991) return;

  // Fonction pour tuer les tweens et réinitialiser
  const resetEl = (el, immediate) => {
    if (!el) return;
    gsap.killTweensOf(el);
    (immediate ? gsap.set : gsap.to)(el, {
      x: "0em",
      y: "0em",
      rotate: "0deg",
      clearProps: "all",
      ...(!immediate && { ease: "elastic.out(1, 0.3)", duration: 1.6 }),
    });
  };

  const resetOnEnter = (e) => {
    const m = e.currentTarget;
    const target = m.querySelector(".btn-magnetic__click");
    if (!target) return;
    resetEl(target, true);
    resetEl(target.querySelector("[data-magnetic-inner-target]"), true);
  };

  const moveMagnet = (e) => {
    const m = e.currentTarget; // Le wrapper invisible grand format
    const target = m.querySelector(".btn-magnetic__click"); // Le bouton visuel
    if (!target) return;

    const b = m.getBoundingClientRect(),
      strength = parseFloat(target.getAttribute("data-magnetic-strength")) ||
        25,
      inner = target.querySelector("[data-magnetic-inner-target]"),
      innerStrength =
        parseFloat(target.getAttribute("data-magnetic-strength-inner")) ||
        strength,
      // offsetX et Y calculent la position par rapport au wrapper (350x350)
      offsetX = ((e.clientX - b.left) / m.offsetWidth - 0.5) * (strength / 16),
      offsetY = ((e.clientY - b.top) / m.offsetHeight - 0.5) * (strength / 16);

    // On déplace le bouton ".btn-magnetic__click" à l'intérieur du wrapper
    gsap.to(target, {
      x: offsetX + "em",
      y: offsetY + "em",
      rotate: "0.001deg",
      ease: "power4.out",
      duration: 1.6,
    });

    if (inner) {
      const innerOffsetX = ((e.clientX - b.left) / m.offsetWidth - 0.5) *
          (innerStrength / 16),
        innerOffsetY = ((e.clientY - b.top) / m.offsetHeight - 0.5) *
          (innerStrength / 16);
      gsap.to(inner, {
        x: innerOffsetX + "em",
        y: innerOffsetY + "em",
        rotate: "0.001deg",
        ease: "power4.out",
        duration: 2,
      });
    }
  };

  const resetMagnet = (e) => {
    const m = e.currentTarget;
    const target = m.querySelector(".btn-magnetic__click");
    if (!target) return;

    const inner = target.querySelector("[data-magnetic-inner-target]");

    // Retour fluide au centre
    gsap.to(target, {
      x: "0em",
      y: "0em",
      ease: "elastic.out(1, 0.3)",
      duration: 1.6,
      clearProps: "all",
    });
    if (inner) {
      gsap.to(inner, {
        x: "0em",
        y: "0em",
        ease: "elastic.out(1, 0.3)",
        duration: 2,
        clearProps: "all",
      });
    }
  };

  magnets.forEach((m) => {
    m.addEventListener("mouseenter", resetOnEnter);
    m.addEventListener("mousemove", moveMagnet);
    m.addEventListener("mouseleave", resetMagnet);
  });
}

/* ---------- Init Vimeo Lightbox ---------- */
function initVimeoLightboxAdvanced() {
  const lightbox = document.querySelector("[data-vimeo-lightbox-init]");
  if (!lightbox) return;

  const openButtons = document.querySelectorAll(
    '[data-vimeo-lightbox-control="open"]',
  );
  const closeButtons = document.querySelectorAll(
    '[data-vimeo-lightbox-control="close"]',
  );

  let iframe = lightbox.querySelector("iframe");
  const placeholder = lightbox.querySelector(".vimeo-lightbox__placeholder");
  const calcEl = lightbox.querySelector(".vimeo-lightbox__calc");
  const wrapEl = lightbox.querySelector(".vimeo-lightbox__calc-wrap");
  const playerContainer = lightbox.querySelector("[data-vimeo-lightbox-player]");

  let player = null;
  let currentVideoID = null;
  let videoAspectRatio = null;
  let globalMuted = lightbox.getAttribute("data-vimeo-muted") === "true";
  const isTouch = ("ontouchstart" in window) || navigator.maxTouchPoints > 0;
  const playedOnce = new Set();

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }

  function clampWrapSize(ar) {
    const w = calcEl.offsetWidth;
    const h = calcEl.offsetHeight;
    wrapEl.style.maxWidth = Math.min(w, h / ar) + "px";
  }

  function adjustCoverSizing() {
    if (!videoAspectRatio) return;
    const cH = playerContainer.offsetHeight;
    const cW = playerContainer.offsetWidth;
    const r = cH / cW;
    const wEl = lightbox.querySelector(".vimeo-lightbox__iframe");
    if (r > videoAspectRatio) {
      wEl.style.width = (r / videoAspectRatio * 100) + "%";
      wEl.style.height = "100%";
    } else {
      wEl.style.height = (videoAspectRatio / r * 100) + "%";
      wEl.style.width = "100%";
    }
  }

  function closeLightbox() {
    lightbox.setAttribute("data-vimeo-activated", "false");
    document.body.style.overflow = "";
    if (player) {
      player.pause();
      lightbox.setAttribute("data-vimeo-playing", "false");
    }
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });
  closeButtons.forEach((btn) => btn.addEventListener("click", closeLightbox));

  lightbox.addEventListener("click", (e) => {
    if (e.target.closest("[data-vimeo-lightbox-player]")) return;
    if (e.target.closest("[data-vimeo-control]")) return;
    if (
      e.target.closest('[data-vimeo-lightbox-control="open"]') ||
      (e.target.closest("[data-vimeo-lightbox-control]") &&
        !e.target.closest(".vimeo-lightbox__bg") &&
        !e.target.closest('[data-vimeo-lightbox-control="close"]'))
    ) {
      return;
    }
    closeLightbox();
  });

  function setupPlayerEvents() {
    player.on("play", () => {
      lightbox.setAttribute("data-vimeo-loaded", "true");
      lightbox.setAttribute("data-vimeo-playing", "true");
    });
    player.on("ended", closeLightbox);
    player.on("pause", () => {
      lightbox.setAttribute("data-vimeo-playing", "false");
    });

    const durEl = lightbox.querySelector("[data-vimeo-duration]");
    player.getDuration().then((d) => {
      if (durEl) durEl.textContent = formatTime(d);
      lightbox.querySelectorAll('[data-vimeo-control="timeline"],progress')
        .forEach((el) => el.max = d);
    });

    const tl = lightbox.querySelector('[data-vimeo-control="timeline"]');
    const pr = lightbox.querySelector("progress");
    player.on("timeupdate", (data) => {
      if (tl) tl.value = data.seconds;
      if (pr) pr.value = data.seconds;
      if (durEl) durEl.textContent = formatTime(Math.trunc(data.seconds));
    });
    if (tl) {
      ["input", "change"].forEach((evt) =>
        tl.addEventListener(evt, (e) => {
          const v = e.target.value;
          player.setCurrentTime(v);
          if (pr) pr.value = v;
        })
      );
    }

    let hoverTimer;
    playerContainer.addEventListener("mousemove", () => {
      lightbox.setAttribute("data-vimeo-hover", "true");
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => {
        lightbox.setAttribute("data-vimeo-hover", "false");
      }, 3000);
    });

    const fsBtn = lightbox.querySelector('[data-vimeo-control="fullscreen"]');
    if (fsBtn) {
      const isFS = () =>
        document.fullscreenElement || document.webkitFullscreenElement;
      if (!(document.fullscreenEnabled || document.webkitFullscreenEnabled)) {
        fsBtn.style.display = "none";
      }
      fsBtn.addEventListener("click", () => {
        if (isFS()) {
          lightbox.setAttribute("data-vimeo-fullscreen", "false");
          (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        } else {
          lightbox.setAttribute("data-vimeo-fullscreen", "true");
          (playerContainer.requestFullscreen || playerContainer.webkitRequestFullscreen)
            .call(playerContainer);
        }
      });
      ["fullscreenchange", "webkitfullscreenchange"].forEach((evt) =>
        document.addEventListener(evt, () =>
          lightbox.setAttribute("data-vimeo-fullscreen", isFS() ? "true" : "false")
        )
      );
    }
  }

  async function runSizing() {
    const mode = lightbox.getAttribute("data-vimeo-update-size");
    const w = await player.getVideoWidth();
    const h = await player.getVideoHeight();
    const ar = h / w;
    const bef = lightbox.querySelector(".vimeo-lightbox__before");
    if (mode === "true") {
      if (bef) bef.style.paddingTop = (ar * 100) + "%";
      clampWrapSize(ar);
    } else if (mode === "cover") {
      videoAspectRatio = ar;
      if (bef) bef.style.paddingTop = "0%";
      adjustCoverSizing();
    } else {
      clampWrapSize(ar);
    }
  }

  window.addEventListener("resize", () => {
    if (player) runSizing();
  });

  // ── Logique play touch — appelée depuis openLightbox ET bouton play ──
  function touchFirstPlay() {
    player.ready().then(() => {
      player.setVolume(0).then(() => {
        lightbox.setAttribute("data-vimeo-playing", "true");
        player.play();
        playedOnce.add(currentVideoID);
        if (!globalMuted) {
          setTimeout(() => {
            player.setVolume(1);
            lightbox.setAttribute("data-vimeo-muted", "false");
          }, 100);
        }
      });
    });
  }

  async function openLightbox(id, placeholderBtn) {
    lightbox.setAttribute("data-vimeo-activated", "loading");
    document.body.style.overflow = "hidden";
    lightbox.setAttribute("data-vimeo-loaded", "false");

    if (player && id !== currentVideoID) {
      await player.pause();
      await player.unload();

      const oldIframe = iframe;
      const newIframe = document.createElement("iframe");
      newIframe.className = oldIframe.className;
      newIframe.setAttribute("allow", oldIframe.getAttribute("allow"));
      newIframe.setAttribute("frameborder", "0");
      newIframe.setAttribute("allowfullscreen", "true");
      newIframe.setAttribute("allow", "autoplay; encrypted-media");
      oldIframe.parentNode.replaceChild(newIframe, oldIframe);

      iframe = newIframe;
      player = null;
      currentVideoID = null;
      lightbox.setAttribute("data-vimeo-playing", "false");
    }

    if (placeholderBtn) {
      ["src", "srcset", "sizes", "alt", "width"].forEach((attr) => {
        const val = placeholderBtn.getAttribute(attr);
        if (val != null) {
          placeholder.setAttribute(attr, val);
        } else {
          placeholder.removeAttribute(attr);
        }
      });
    }

    if (!player) {
      iframe.src = `https://player.vimeo.com/video/${id}?api=1&autoplay=0&loop=0&muted=0`;
      player = new Vimeo.Player(iframe);
      setupPlayerEvents();
      currentVideoID = id;
      runSizing();
    }

    lightbox.setAttribute("data-vimeo-activated", "true");

    if (!isTouch) {
      player.setVolume(globalMuted ? 0 : 1).then(() => {
        lightbox.setAttribute("data-vimeo-playing", "true");
        setTimeout(() => player.play(), 50);
      });
    } else {
      if (!playedOnce.has(currentVideoID)) {
        touchFirstPlay();
      } else {
        player.setVolume(globalMuted ? 0 : 1).then(() => {
          lightbox.setAttribute("data-vimeo-playing", "true");
          player.play();
        });
      }
    }
  }

  lightbox.querySelector('[data-vimeo-control="play"]').addEventListener("click", () => {
    if (isTouch) {
      if (!playedOnce.has(currentVideoID)) {
        touchFirstPlay();
      } else {
        player.setVolume(globalMuted ? 0 : 1).then(() => {
          lightbox.setAttribute("data-vimeo-playing", "true");
          player.play();
        });
      }
    } else {
      player.setVolume(globalMuted ? 0 : 1).then(() => {
        lightbox.setAttribute("data-vimeo-playing", "true");
        setTimeout(() => player.play(), 50);
      });
    }
  });

  lightbox.querySelector('[data-vimeo-control="pause"]').addEventListener("click", () => {
    player.pause();
  });

  lightbox.querySelector('[data-vimeo-control="mute"]').addEventListener("click", () => {
    globalMuted = !globalMuted;
    player.setVolume(globalMuted ? 0 : 1).then(() =>
      lightbox.setAttribute("data-vimeo-muted", globalMuted ? "true" : "false")
    );
  });

  openButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const vid = btn.getAttribute("data-vimeo-lightbox-id");
      if (!vid || vid.trim() === "") {
        e.preventDefault();
        console.warn("⚠️ [Vimeo Lightbox] Clic ignoré : aucun ID de vidéo trouvé pour cet item CMS.");
        return;
      }
      const img = btn.querySelector("[data-vimeo-lightbox-placeholder]");
      console.log("--- Vimeo Lightbox Clicked ---");
      console.log("Video ID found:", vid);
      console.log("Thumbnail (img) found:", img);
      openLightbox(vid, img);
    });
  });
}

/* ---------- Parallax Effect ---------- */
function initParallaxLayers() {
  document.querySelectorAll("[data-parallax-layers]").forEach(
    (triggerElement) => {
      let tl = gsap.timeline({
        scrollTrigger: {
          trigger: triggerElement,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });
      const isMobile = window.innerWidth < 768;
      const layers = [
        { layer: "1", yPercentFrom: 0, yPercent: isMobile ? -12 : -20 },
        { layer: "2", yPercentFrom: 0, yPercent: isMobile ? -15 : -25 },
      ];
      layers.forEach((layerObj, idx) => {
        tl.fromTo(
          triggerElement.querySelectorAll(
            `[data-parallax-layer="${layerObj.layer}"]`,
          ),
          {
            yPercent: layerObj
              .yPercentFrom,
          },
          { yPercent: layerObj.yPercent, ease: "none" },
          idx === 0 ? undefined : "<",
        );
      });
    },
  );
}

/* =========================
   ✅ TOOLTIP MOBILE
   ========================= */
function initMobileTooltips() {
  let activeTooltip = null;
  let originalParent = null;

  const closeActiveTooltip = () => {
    if (!activeTooltip) return;

    const tooltipToClose = activeTooltip;
    const parentToReturn = originalParent;

    console.log("🕒 [Tooltip] Fermeture :", tooltipToClose);

    tooltipToClose.classList.remove("is-active");
    document.body.style.overflow = "";

    setTimeout(() => {
      if (!tooltipToClose.classList.contains("is-active")) {
        tooltipToClose.classList.remove("tooltip-moving");
        // On remet la tooltip à sa place d'origine (dans le trigger ou après)
        if (parentToReturn) {
          console.log("♻️ [Tooltip] Retour au DOM d'origine.");
          parentToReturn.appendChild(tooltipToClose);
        }
      }
    }, 400);

    activeTooltip = null;
    originalParent = null;
  };

  const openTooltipMobile = (tooltip, trigger) => {
    console.log("✨ [Tooltip] Ouverture demandée.");

    if (activeTooltip) {
      closeActiveTooltip();
    }

    activeTooltip = tooltip;
    // On stocke le parent direct pour savoir où la remettre plus tard
    originalParent = tooltip.parentElement;

    document.body.style.overflow = "hidden";
    activeTooltip.classList.add("tooltip-moving");
    document.body.appendChild(activeTooltip);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        activeTooltip.classList.add("is-active");
        console.log("🚀 [Tooltip] Animation lancée (is-active).");
      });
    });
  };

  document.addEventListener("click", (e) => {
    // On ne s'active que sur mobile/tablette
    if (window.innerWidth >= 768) return;

    const trigger = e.target.closest("[data-css-tooltip-hover]");
    const clickedInsideTooltip = e.target.closest(
      "[data-css-tooltip].is-active",
    );

    // CAS 1 : Clic dans la bulle ouverte -> On ferme
    if (clickedInsideTooltip) {
      console.log("🖱️ [Click] Intérieur bulle -> Fermeture.");
      closeActiveTooltip();
      return;
    }

    // CAS 2 : Clic sur un déclencheur
    if (trigger) {
      // Stratégie hybride pour trouver la tooltip :
      // 1. On cherche dedans (cas Pricing)
      // 2. Si rien, on cherche l'élément frère suivant (cas Décacornes)
      let tooltip = trigger.querySelector("[data-css-tooltip]");

      if (!tooltip) {
        tooltip = trigger.nextElementSibling;
      }

      // Vérification finale de l'attribut
      if (!tooltip || !tooltip.hasAttribute("data-css-tooltip")) {
        console.warn(
          "⚠️ [Tooltip] Trigger détecté mais aucune bulle associée trouvée.",
          trigger,
        );
        return;
      }

      console.log("✅ [Tooltip] Correspondance trouvée !");

      if (activeTooltip === tooltip) {
        closeActiveTooltip();
        return;
      }

      openTooltipMobile(tooltip, trigger);
      e.preventDefault();
      return;
    }

    // CAS 3 : Clic n'importe où ailleurs
    if (activeTooltip) {
      console.log("🖱️ [Click] Extérieur -> Fermeture.");
      closeActiveTooltip();
    }
  });

  console.log("🛠️ [System] Tooltips initialisées (Mode Hybride Activé).");
}

// Lancement au chargement du DOM
//document.addEventListener("DOMContentLoaded", initMobileTooltips);
/* =========================
   ✅ MAP RENCONTRER CITY ROTATOR
   ========================= */
window.initMapRotator = initMapRotator;
function initMapRotator() {
  const DELAY_BETWEEN_CITIES = 200;
  const VISIBLE_DURATION = 500;
  const FADE_DURATION = 500;
  const MIN_GROUP_SIZE = 1;
  const MAX_GROUP_SIZE = 3;

  const cityRotator = document.querySelector("[data-city-rotator]");
  if (!cityRotator) return;

  const cityElements = cityRotator.querySelectorAll("[data-city]");
  if (cityElements.length === 0) return;

  function showCityElement(el) {
    el.style.opacity = "1";
    el.style.transform = "translateY(0)";
  }

  function hideCityElement(el) {
    el.style.opacity = "0";
    el.style.transform = "translateY(10px)";
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function getExclusions(el) {
    const raw = el.dataset.cityExclude;
    if (!raw) return [];
    return raw.split(",").map((s) => s.trim());
  }

  function isCompatible(el, group) {
    const elCity = el.dataset.city;
    const elExclusions = getExclusions(el);
    return group.every((groupEl) => {
      const groupCity = groupEl.dataset.city;
      const groupExclusions = getExclusions(groupEl);
      return !elExclusions.includes(groupCity) &&
        !groupExclusions.includes(elCity);
    });
  }

  async function startLoop() {
    while (true) {
      const shuffled = shuffleArray([...cityElements]);
      let i = 0;
      while (i < shuffled.length) {
        const groupSize = Math.min(
          randomInt(MIN_GROUP_SIZE, MAX_GROUP_SIZE),
          shuffled.length - i,
        );
        const group = [shuffled[i]];
        for (let j = i + 1; j < i + groupSize; j++) {
          if (isCompatible(shuffled[j], group)) {
            group.push(shuffled[j]);
          }
        }
        i += groupSize;
        group.forEach((el, index) => {
          setTimeout(() => showCityElement(el), index * DELAY_BETWEEN_CITIES);
        });
        await wait(FADE_DURATION + VISIBLE_DURATION);
        group.forEach((el, index) => {
          setTimeout(() => hideCityElement(el), index * DELAY_BETWEEN_CITIES);
        });
        await wait(DELAY_BETWEEN_CITIES);
      }
    }
  }

  startLoop();
}

/* ----------------------------------------------------------
     ✅ HowTo : variant progress bar et variant opacity
  ---------------------------------------------------------- */

// auto-tabs — variant 1 (progress bar)
// Attribut déclencheur sur le wrapper : auto-tabs-wrapper-progress=""

function autoTabsProgress() {
  const wrapper = document.querySelector("[auto-tabs-wrapper-progress]");
  if (!wrapper) return;

  const tabs   = wrapper.querySelectorAll("[auto-tab]");
  const images = wrapper.querySelectorAll("[auto-tab-image]");
  const media  = wrapper.querySelector("[auto-tabs-media]");

  if (!tabs.length) return;

  const DURATION = 6000;

  let currentIndex = 0;
  let startTime    = null;
  let animFrame    = null;

  function injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
      [auto-tabs-wrapper-progress] [auto-tab]               { opacity: 0.4; transition: opacity 0.4s ease; cursor: pointer; }
      [auto-tabs-wrapper-progress] [auto-tab][active]        { opacity: 1; }
      [auto-tabs-wrapper-progress] [auto-tab-body]           { opacity: 0; transition: opacity 0.4s ease; }
      [auto-tabs-wrapper-progress] [auto-tab-progress]       { height: 2px !important; overflow: hidden; background: rgba(0, 9, 74, 0.1); }
      [auto-tabs-wrapper-progress] [auto-tab-bar]            { height: 2px !important; display: block; background: #FF4920; }
      [auto-tabs-wrapper-progress] [auto-tabs-media]         { position: relative; }
      [auto-tabs-wrapper-progress] [auto-tab-image]          { position: absolute; inset: 0; opacity: 0; transition: opacity 0.4s ease; pointer-events: none; }
      [auto-tabs-wrapper-progress] [auto-tab-image][active]  { opacity: 1; pointer-events: auto; }
    `;
    document.head.appendChild(style);
  }

  function setMediaHeight() {
    if (!media || !images.length) return;

    const firstImg = images[0];

    function applyHeight() {
      images.forEach(function (img) { img.style.display = "block"; });
      const height = images[0].offsetHeight;
      images.forEach(function (img) { img.style.display = ""; });
      if (height > 0) media.style.height = height + "px";
    }

    if (firstImg.complete && firstImg.naturalHeight > 0) {
      applyHeight();
    } else {
      firstImg.addEventListener("load", applyHeight, { once: true });
    }
  }

  function setActive(index) {
    tabs.forEach(function (tab) {
      tab.removeAttribute("active");

      const bar    = tab.querySelector("[auto-tab-bar]");
      const body   = tab.querySelector("[auto-tab-body]");
      const number = tab.querySelector("[auto-tab-number]");

      if (bar)    bar.style.width = "0%";
      if (body)   { body.style.display = "none"; body.style.opacity = "0"; }
      if (number) number.style.color = "";
    });

    images.forEach(function (img) { img.removeAttribute("active"); });

    const activeTab = wrapper.querySelector('[auto-tab][tab-index="' + index + '"]');
    const activeImg = wrapper.querySelector('[auto-tab-image][tab-index="' + index + '"]');

    if (activeTab) {
      activeTab.setAttribute("active", "");

      const body   = activeTab.querySelector("[auto-tab-body]");
      const number = activeTab.querySelector("[auto-tab-number]");

      if (number) number.style.color = "#FF4920";
      if (body) {
        body.style.display = "block";
        requestAnimationFrame(function () { body.style.opacity = "1"; });
      }
    }

    if (activeImg) activeImg.setAttribute("active", "");

    currentIndex = index;
    startTime    = null;
    cancelAnimationFrame(animFrame);
    animFrame = requestAnimationFrame(animate);
  }

  function animate(timestamp) {
    if (!startTime) startTime = timestamp;

    const elapsed    = timestamp - startTime;
    const percentage = Math.min((elapsed / DURATION) * 100, 100);

    const activeTab = wrapper.querySelector('[auto-tab][tab-index="' + currentIndex + '"]');
    if (activeTab) {
      const bar = activeTab.querySelector("[auto-tab-bar]");
      if (bar) bar.style.width = percentage + "%";
    }

    if (percentage < 100) {
      animFrame = requestAnimationFrame(animate);
    } else {
      setActive((currentIndex + 1) % tabs.length);
    }
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      cancelAnimationFrame(animFrame);
      setActive(parseInt(tab.getAttribute("tab-index")));
    });
  });

  injectStyles();
  setMediaHeight();
  window.addEventListener("resize", setMediaHeight);
  setActive(0);
}

autoTabsProgress();
// auto-tabs — variant 2 (opacity only)
// Attribut déclencheur sur le wrapper : auto-tabs-wrapper-opacity=""

function autoTabsOpacity() {
  const wrapper = document.querySelector("[auto-tabs-wrapper-opacity]");
  if (!wrapper) return;

  const tabs   = wrapper.querySelectorAll("[auto-tab]");
  const images = wrapper.querySelectorAll("[auto-tab-image]");
  const media  = wrapper.querySelector("[auto-tabs-media]");

  if (!tabs.length) return;

  const DURATION = 6000;

  let currentIndex = 0;
  let timer        = null;

  function injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
      [auto-tabs-wrapper-opacity] [auto-tab]               { opacity: 0.3; transition: opacity 0.4s ease; cursor: pointer; }
      [auto-tabs-wrapper-opacity] [auto-tab][active]        { opacity: 1; }
      [auto-tabs-wrapper-opacity] [auto-tab-body]           { opacity: 1 !important; display: block !important; }
      [auto-tabs-wrapper-opacity] [auto-tabs-media]         { position: relative; }
      [auto-tabs-wrapper-opacity] [auto-tab-image]          { position: absolute; inset: 0; opacity: 0; transition: opacity 0.4s ease; pointer-events: none; }
      [auto-tabs-wrapper-opacity] [auto-tab-image][active]  { opacity: 1; pointer-events: auto; }
    `;
    document.head.appendChild(style);
  }

  function setMediaHeight() {
    if (!media || !images.length) return;

    const firstImg = images[0];

    function applyHeight() {
      images.forEach(function (img) { img.style.display = "block"; });
      const height = images[0].offsetHeight;
      images.forEach(function (img) { img.style.display = ""; });
      if (height > 0) media.style.height = height + "px";
    }

    if (firstImg.complete && firstImg.naturalHeight > 0) {
      applyHeight();
    } else {
      firstImg.addEventListener("load", applyHeight, { once: true });
    }
  }

  function setActive(index) {
    tabs.forEach(function (tab) {
      tab.removeAttribute("active");
      const number = tab.querySelector("[auto-tab-number]");
      if (number) number.style.color = "";
    });

    images.forEach(function (img) { img.removeAttribute("active"); });

    const activeTab = wrapper.querySelector('[auto-tab][tab-index="' + index + '"]');
    const activeImg = wrapper.querySelector('[auto-tab-image][tab-index="' + index + '"]');

    if (activeTab) {
      activeTab.setAttribute("active", "");
      const number = activeTab.querySelector("[auto-tab-number]");
      if (number) number.style.color = "#FF4920";
    }

    if (activeImg) activeImg.setAttribute("active", "");

    currentIndex = index;
    clearTimeout(timer);
    timer = setTimeout(function () {
      setActive((currentIndex + 1) % tabs.length);
    }, DURATION);
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      clearTimeout(timer);
      setActive(parseInt(tab.getAttribute("tab-index")));
    });
  });

  injectStyles();
  setMediaHeight();
  window.addEventListener("resize", setMediaHeight);
  setActive(0); 
}

autoTabsOpacity();

  // ════════════════════════════════════════════════════════════════════════════
  // MODALE LEVÉES TABLE
  // ════════════════════════════════════════════════════════════════════════════

window.raisesIndex = {};
window.modal;


// ════════════════════════════════════════════════════════════════════════════
// UTILITAIRES
// ════════════════════════════════════════════════════════════════════════════

/**
 * Lit la valeur d'un attribut data sur un élément ou son enfant.
 * Ordre de priorité :
 *  1. Valeur de l'attribut non vide sur root lui-même
 *  2. Valeur de l'attribut non vide sur un descendant
 *  3. src si IMG | textContent si badge | objet tooltip | textContent simple
 *
 * Note : ne pas utiliser pour data-raise-operation — utiliser readOperationAttr.
 */
function readAttr(root, attr) {
  if (root.hasAttribute(attr)) {
    var rootVal = root.getAttribute(attr);
    if (rootVal) return rootVal;
  }

  var child = root.querySelector('[' + attr + ']');
  if (!child) return '';

  var attrVal = child.getAttribute(attr);
  if (attrVal) return attrVal;

  if (child.tagName === 'IMG') return child.src || '';

  var badgeWrapper = child.closest('.perf-badge-wrapper');
  if (badgeWrapper) return child.textContent.trim();

  // Le .css-tooltip-text est dans le parentNode du [data-css-tooltip-hover]
  var tooltipTrigger = child.closest('[data-css-tooltip-hover]');
  if (tooltipTrigger) {
    var bubbleText = tooltipTrigger.parentNode.querySelector('.css-tooltip-text');
    return {
      isTooltip: true,
      label:     child.textContent.trim(),
      bubble:    bubbleText ? bubbleText.textContent.trim() : ''
    };
  }

  return child.textContent.trim();
}

/**
 * Lit data-raise-operation et normalise toujours vers { isTooltip, label, bubble }.
 * Couvre les deux structures :
 * — Tableau 1 : valeur dans textContent, [data-css-tooltip-hover] sans valeur d'attribut
 *   → readAttr retourne un objet isTooltip avec le bubble
 * — Tableau 2 : valeur dans l'attribut lui-même (data-raise-operation="PSFP")
 *   → readAttr retourne une string ; on cherche le bubble via parentNode
 */
function readOperationAttr(root) {
  var raw = readAttr(root, 'data-raise-operation');

  if (raw && typeof raw === 'object' && raw.isTooltip) return raw;

  var label = raw || '';
  var tooltipEl = root.querySelector('[data-css-tooltip-hover]');
  var bubble = '';
  if (tooltipEl) {
    var bubbleEl = tooltipEl.parentNode.querySelector('.css-tooltip-text');
    if (bubbleEl) bubble = bubbleEl.textContent.trim();
  }
  return { isTooltip: true, label: label, bubble: bubble };
}

/**
 * Parse un montant formaté vers des millions (Float) + détecte la devise.
 * Formats acceptés : "22,1M€" | "500K€" | "1,2Md€" | "4,3M$" | "500K$"
 * Retourne { value: Float, currency: '€' | '$' | '' }
 */
function parseAmount(str) {
  if (!str || typeof str !== 'string') return { value: 0, currency: '' };
  var s = str.trim().replace(',', '.');
  var currency = s.indexOf('$') !== -1 ? '$' : s.indexOf('€') !== -1 ? '€' : '';
  var num = parseFloat(s.replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return { value: 0, currency: currency };
  var value = s.indexOf('Md') !== -1 ? num * 1000
            : s.indexOf('K')  !== -1 ? num / 1000
            : num;
  return { value: value, currency: currency };
}

/**
 * Formate un total en millions vers la meilleure unité lisible.
 * Devise toujours en suffixe : 4,3M€ | 4,3M$
 * < 1M → K | 1-999M → M | >= 1000M → Md
 */
function formatAmount(totalM, currency) {
  var c = currency || '€';
  var num;
  if (totalM >= 1000)   num = (totalM / 1000).toFixed(1).replace('.', ',').replace(',0', '') + 'Md';
  else if (totalM >= 1) num = totalM.toFixed(1).replace('.', ',').replace(',0', '') + 'M';
  else                  num = Math.round(totalM * 1000) + 'K';
  return num + c;
}


// ════════════════════════════════════════════════════════════════════════════
// INDEX DES LEVÉES
// ════════════════════════════════════════════════════════════════════════════

/**
 * Parcourt tous les [data-modal-open] et construit
 * un index { companySlug: [{ slug, serie, operation, date, amount, img }, ...] }.
 *
 * Guard hasData : ignore les items dont tous les champs sont vides.
 * Cause : Finsweet injecte le contenu CMS après le load initial — les
 * [data-slug] existent dans le DOM mais sont vides au premier passage.
 */
function buildRaisesIndex() {
  var index = {};
  document.querySelectorAll('[data-modal-open]').forEach(function(trigger) {
    var company = (trigger.getAttribute('data-company') || '').trim().toLowerCase();
    if (!company) return;

    var triggerSlug = trigger.getAttribute('data-slug') || '';
    var isNested = !triggerSlug;

    var items = isNested
      ? Array.from(trigger.querySelectorAll('[data-slug]'))
      : [trigger];

    items.forEach(function(item) {
      var slug = (item.getAttribute('data-slug') || triggerSlug).trim().toLowerCase();
      if (!slug) return;

      var raise = {
        slug:      slug,
        serie:     readAttr(item, 'data-raise-serie'),
        operation: readOperationAttr(item),
        date:      readAttr(item, 'data-raise-date'),
        amount:    readAttr(item, 'data-raise-amount'),
        img:       readAttr(item, 'data-raise-img')
      };

      var hasData = raise.serie || raise.date || raise.amount || raise.img
        || (raise.operation && raise.operation.label);
      if (!hasData) return;

      index[company] = index[company] || [];
      var existingIdx = index[company].findIndex(function(r) { return r.slug === slug; });
      if (existingIdx === -1) {
        index[company].push(raise);
      } else {
        index[company][existingIdx] = raise;
      }
    });
  });
  return index;
}

/**
 * Fusionne un nouvel index partiel dans raisesIndex.
 * Remplace une entrée existante si la nouvelle a des données.
 */
function mergeIntoIndex(fresh) {
  Object.keys(fresh).forEach(function(company) {
    fresh[company].forEach(function(raise) {
      window.raisesIndex[company] = window.raisesIndex[company] || [];
      var existingIdx = window.raisesIndex[company].findIndex(function(r) {
        return r.slug === raise.slug;
      });
      if (existingIdx === -1) {
        window.raisesIndex[company].push(raise);
      } else {
        window.raisesIndex[company][existingIdx] = raise;
      }
    });
  });
}

/**
 * Pour les items [combine-startup="true"] :
 * — Garde visible uniquement le premier [data-slug] du company (tous triggers confondus)
 * — Masque tous les suivants
 *
 * CORRECTIF load more : utilise un WeakSet pour mémoriser les triggers déjà traités.
 * Avant de traiter les nouveaux triggers, on détecte quels company ont déjà
 * un slug visible dans les triggers existants et on les marque dans `seen`.
 * Les nouveaux triggers Finsweet pour ces company ont donc tous leurs slugs masqués.
 */
var knownTriggers = new WeakSet();

function applyCombineStartup() {
  var firstSlugPerCompany = {};

  document.querySelectorAll('[data-modal-open][combine-startup="true"]').forEach(function(trigger) {
    var company = (trigger.getAttribute('data-company') || '').trim().toLowerCase();
    if (!company) return;

    trigger.querySelectorAll('[data-slug]').forEach(function(child) {
      var slug = child.getAttribute('data-slug');
      if (!firstSlugPerCompany[company]) {
        firstSlugPerCompany[company] = slug;
        child.style.removeProperty('display');
      } else {
        child.style.setProperty('display', 'none', 'important');
      }
    });
  });
}

/**
 * Charge toutes les pages suivantes en arrière-plan via fetch
 * pour compléter raisesIndex avec les items hors page courante.
 */
function preloadAllPages() {
  var nextLink = document.querySelector('.w-pagination-next');
  if (!nextLink) return;

  function fetchPage(url) {
    fetch(url).then(function(r) { return r.text(); }).then(function(html) {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var fresh = {};
      doc.querySelectorAll('[data-modal-open]').forEach(function(trigger) {
        var company = (trigger.getAttribute('data-company') || '').trim().toLowerCase();
        if (!company) return;
        var triggerSlug = trigger.getAttribute('data-slug') || '';
        var isNested = !triggerSlug;

        var items = isNested
          ? Array.from(trigger.querySelectorAll('[data-slug]'))
          : [trigger];

        items.forEach(function(item) {
          var slug = (item.getAttribute('data-slug') || triggerSlug).trim().toLowerCase();
          if (!slug) return;

          var raise = {
            slug:      slug,
            serie:     readAttr(item, 'data-raise-serie'),
            operation: readOperationAttr(item),
            date:      readAttr(item, 'data-raise-date'),
            amount:    readAttr(item, 'data-raise-amount'),
            img:       readAttr(item, 'data-raise-img')
          };

          var hasData = raise.serie || raise.date || raise.amount || raise.img
            || (raise.operation && raise.operation.label);
          if (!hasData) return;

          fresh[company] = fresh[company] || [];
          var existingIdx = fresh[company].findIndex(function(r) { return r.slug === slug; });
          if (existingIdx === -1) {
            fresh[company].push(raise);
          } else {
            fresh[company][existingIdx] = raise;
          }
        });
      });
      mergeIntoIndex(fresh);
      var next = doc.querySelector('.w-pagination-next');
      if (next) fetchPage(next.href);
    });
  }

  fetchPage(nextLink.href);
}


// ════════════════════════════════════════════════════════════════════════════
// INJECTION DANS LA MODAL
// ════════════════════════════════════════════════════════════════════════════

/**
 * Clone le template [data-raise-template] pour chaque levée et injecte les données.
 */
function injectRaises(modalItem, raises) {
  var template = modalItem.querySelector('[data-raise-template]');
  if (!template || !raises) return;

  var parent = template.parentNode;
  modalItem.querySelectorAll('[data-raise-clone]').forEach(function(el) { el.remove(); });

  raises.forEach(function(raise) {
    var row = template.cloneNode(true);
    row.removeAttribute('data-raise-template');
    row.setAttribute('data-raise-clone', '');
    row.style.display = '';

    var dataRow = row.querySelector('.data-raise-row:not([data-raises-header])');

    var simpleFields = {
      'data-raise-serie':  raise.serie,
      'data-raise-date':   raise.date,
      'data-raise-amount': raise.amount,
      'data-raise-img':    raise.img
    };

    Object.keys(simpleFields).forEach(function(attr) {
      var cell = dataRow ? dataRow.querySelector('[' + attr + ']') : row.querySelector('[' + attr + ']');
      if (!cell) return;
      if (cell.tagName === 'IMG') {
        cell.src = simpleFields[attr] || '';
      } else {
        cell.textContent = simpleFields[attr] || '';
      }
    });

    // Injection operation — toujours { isTooltip, label, bubble }
    var opCell = dataRow
      ? dataRow.querySelector('[data-raise-operation]')
      : row.querySelector('[data-raise-operation]');
    if (opCell && raise.operation) {
      opCell.textContent = raise.operation.label || '';
      var tooltipTrigger = opCell.closest('[data-css-tooltip-hover]');
      if (tooltipTrigger) {
        var bubbleEl = tooltipTrigger.parentNode.querySelector('.css-tooltip-text');
        if (bubbleEl) bubbleEl.textContent = raise.operation.bubble || '';
      }
    }

    parent.appendChild(row);
  });
}

/**
 * Calcule la somme des montants des clones injectés dans la modal,
 * par devise, et met à jour [data-raises-total].
 * Retourne la valeur formatée.
 */
function injectTotal(target) {
  var totals = {};
  target.querySelectorAll('[data-raise-clone] [data-raise-amount]').forEach(function(el) {
    var parsed = parseAmount(el.textContent);
    if (!parsed.currency || !parsed.value) return;
    totals[parsed.currency] = (totals[parsed.currency] || 0) + parsed.value;
  });
  var formatted = Object.keys(totals).map(function(c) {
    return formatAmount(totals[c], c);
  }).join(' + ') || '0';
  var totalEl = target.querySelector('[data-raises-total]');
  if (totalEl) totalEl.textContent = formatted;
  return formatted;
}

/**
 * Injecte les totaux dans les [data-raises-total] du tableau source,
 * calculés depuis raisesIndex dès que Finsweet a chargé les données.
 * À appeler après chaque mergeIntoIndex.
 */
function injectTableTotals() {
  document.querySelectorAll('[data-modal-open]').forEach(function(trigger) {
    var company = (trigger.getAttribute('data-company') || '').trim().toLowerCase();
    if (!company || !window.raisesIndex[company]) return;

    var totalEl = trigger.querySelector('[data-raises-total]');
    if (!totalEl) return;

    var totals = {};
    window.raisesIndex[company].forEach(function(raise) {
      var parsed = parseAmount(raise.amount);
      if (!parsed.currency || !parsed.value) return;
      totals[parsed.currency] = (totals[parsed.currency] || 0) + parsed.value;
    });
    totalEl.textContent = Object.keys(totals).map(function(c) {
      return formatAmount(totals[c], c);
    }).join(' + ') || '0';
  });
}


// ════════════════════════════════════════════════════════════════════════════
// MODAL — OUVRIR / FERMER
// ════════════════════════════════════════════════════════════════════════════

/**
 * Gère l'ouverture de la modal au clic sur [data-modal-open].
 */
function handleModalOpen(e) {
  var trigger = e.target.closest('[data-modal-open]');
  if (!trigger) return;
  if (trigger.getAttribute('data-modal-open') === 'kol') return;

  var company = (trigger.getAttribute('data-company') || '').trim().toLowerCase();
  var triggerSlug = trigger.getAttribute('data-slug') || '';
  var isNested = !triggerSlug;

  var slug;
  if (isNested) {
    var slugEl = e.target.closest('[data-slug]');
    slug = (slugEl && slugEl !== trigger ? slugEl.getAttribute('data-slug') : '').trim().toLowerCase();
  } else {
    slug = triggerSlug.trim().toLowerCase();
  }

  if (!slug) return;

  document.querySelectorAll('[data-modal]:not([data-modal="kol"]) [data-company]').forEach(function(item) {
    item.setAttribute('data-modal-hidden', '');
  });

  var target = document.querySelector('[data-modal-item="' + slug + '"]');
  if (target) {
    var companyParent = target.closest('[data-company]');
    if (companyParent) {
      companyParent.removeAttribute('data-modal-hidden');
      companyParent.querySelectorAll('[data-modal-item]').forEach(function(item) {
        item.style.setProperty('display', 'none', 'important');
      });
    }
    target.style.setProperty('display', 'block', 'important');

    var count = companyParent
      ? companyParent.querySelectorAll('[data-modal-item]').length
      : 1;
    target.setAttribute('data-raises-count', count === 1 ? 'single' : 'multiple');

    var isCombined = trigger.getAttribute('combine-startup') === 'true';
    var raises = isCombined
      ? window.raisesIndex[company]
      : (window.raisesIndex[company] || []).filter(function(r) { return r.slug === slug; });

    injectRaises(target, raises);
    injectTotal(target);
  }

  window.modal.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

/**
 * Ferme la modal et restaure le scroll de la page.
 */
function closeModal() {
  window.modal.classList.remove('is-open');
  document.body.style.overflow = '';
}

/**
 * Branche tous les listeners de la modal.
 */
function initModalListeners() {
  document.addEventListener('click', handleModalOpen);

  window.modal.addEventListener('click', function(e) {
  if (!e.target.closest('.modal_card')) closeModal();
});

  window.modal.querySelectorAll('[data-modal-close]').forEach(function(btn) {
    btn.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && window.modal.classList.contains('is-open')) closeModal();
  });
}

/**
 * Écoute l'event Finsweet fs-list-load pour fusionner
 * les nouveaux items chargés sans écraser les pages déjà fetchées.
 */
function initFinsweetListener() {
  var observer = new MutationObserver(function(mutations) {
    var hasNewTriggers = mutations.some(function(mutation) {
      return Array.from(mutation.addedNodes).some(function(node) {
        return node.nodeType === 1 && (
          node.hasAttribute('data-modal-open') ||
          node.querySelector('[data-modal-open]')
        );
      });
    });

    if (!hasNewTriggers) return;

    clearTimeout(window._combineDebounce);
    window._combineDebounce = setTimeout(function() {
      mergeIntoIndex(buildRaisesIndex());
      applyCombineStartup();
      injectTableTotals();
    }, 10);
  });

  // Observe document.body pour couvrir toutes les listes Finsweet
  observer.observe(document.body, { childList: true, subtree: true });
 

  window.addEventListener('fs-list-load', function() {
    mergeIntoIndex(buildRaisesIndex());
    applyCombineStartup();
    injectTableTotals();
  });
}


// ════════════════════════════════════════════════════════════════════════════
// INIT MODALE
// ════════════════════════════════════════════════════════════════════════════

/**
 * Point d'entrée principal.
 * Guard : on ne charge rien si [data-modal-open] absent de la page.
 */
function initModal() {
  if (!document.querySelector('[data-modal-open]')) return;
  window.modal = document.querySelector('[data-modal]:not([data-modal="kol"])');
  if (!window.modal) return;
  window.raisesIndex = buildRaisesIndex();
  applyCombineStartup();
  injectTableTotals();
  //preloadAllPages();
  initFinsweetListener();
  initModalListeners();

  document.addEventListener('click', function() {
    preloadAllPages();
  }, { once: true });
}

window.addEventListener('load', initModal);

/* ----------------------------------------------------------
     Init Page Scripts
  ---------------------------------------------------------- */

function initPageScripts() {
  document.querySelector("[data-magnetic-wrapper]") && initMagneticEffect();
  document.querySelector("[data-vimeo-lightbox-id]") &&
    initVimeoLightboxAdvanced();
  document.querySelector("[data-parallax-layers]") && initParallaxLayers();
  document.querySelector("[data-city-rotator]") && initMapRotator();
  document.querySelector("[data-tag-rotator]") && initTagsAnimateOnMap();
  document.querySelector("[data-css-tooltip-hover]") &&
    initMobileTooltips();
}
initPageScripts();
