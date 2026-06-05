/* =========================
   GESTION DES SWIPERS (laisser tout en bas)
   ========================= */
// Helper pour préserver les classes Custom Webflow des bullets (variants de couleur)
function getSwiperPaginationConfig(paginationEl) {
  if (!paginationEl) return { el: paginationEl, clickable: true };
  var existingBullet = paginationEl.querySelector(".swiper-pagination-bullet");
  var extraClasses = existingBullet
    ? existingBullet.className.replace("swiper-pagination-bullet", "").trim()
    : "";

  return {
    el: paginationEl,
    clickable: true,
    renderBullet: function (index, className) {
      var fullClass = extraClasses ? className + " " + extraClasses : className;
      return '<span class="' + fullClass + '"></span>';
    },
  };
}

// Helper pour la pagination animée globale
function setupSwiperPagination(swiperInstance, paginationEl, durationMs) {
  if (!paginationEl) return;

  if (durationMs) {
    paginationEl.style.setProperty(
      "--swiper-autoplay-duration",
      durationMs + "ms",
    );
  }

  var lastBulletIndex = -1;

  var updateAnimation = function () {
    var currentIndex = swiperInstance.realIndex;
    if (currentIndex === lastBulletIndex) return;
    lastBulletIndex = currentIndex;

    var bullets = paginationEl.querySelectorAll(".swiper-pagination-bullet");
    bullets.forEach(function (b) {
      b.classList.remove("is-animating");
    });

    requestAnimationFrame(function () {
      var activeBullet = paginationEl.querySelector(
        ".swiper-pagination-bullet-active",
      );
      if (activeBullet) activeBullet.classList.add("is-animating");
    });
  };

  swiperInstance.on("slideChange", updateAnimation);
  setTimeout(updateAnimation, 50);
}

// Helper pour lire data-sw-speed="desktop[, mobile]"
function parseSwiperSpeed(section) {
  var raw = section.getAttribute("data-sw-speed");
  if (!raw) return { desktop: 0, mobile: 0 };
  var parts = raw.split(",");
  var desktop = parseInt(parts[0].trim()) || 0;
  var mobile = parts.length > 1 ? (parseInt(parts[1].trim()) || 0) : desktop;
  return { desktop: desktop, mobile: mobile };
}

//////////////////////////////////// 1. Swiper 1 (Autoplay: true, espace mobile: 0)
function Init_Swiper_1() {
  //console.log("[Swiper 1] Initialisation lancée");

  var sections = document.querySelectorAll('[data-sw="swiper-1"]');
  if (sections.length === 0) {
    //console.log(
    //'[Swiper 1] Section parent introuvable (pas de data-sw="swiper-1" sur la page)',
    //);
    return;
  }

  sections.forEach(function (section) {
    //console.log("[Swiper 1] Section trouvée !", section);

    var sliderEl = section.querySelector('[data-sw="slider"]');
    var slidesEl = section.querySelector('[data-sw="slides"]');
    var slides = section.querySelectorAll('[data-sw="slide"]');
    var prevBtn = section.querySelector('[data-sw="prev"]');
    var nextBtn = section.querySelector('[data-sw="next"]');
    var pagination = section.querySelector('[data-sw="pagination"]');

    if (!sliderEl) {
      //console.error(
      //'[Swiper 1] Configuration incomplète : data-sw="slider" introuvable !',
      //);
      return;
    }

    if (slides.length === 0) {
      console.warn(
        '[Swiper 1] Aucune slide (data-sw="slide") trouvée à l\'intérieur du slider.',
      );
      return;
    } else {
      //console.log("[Swiper 1] Nombre de slides trouvées: " + slides.length);
    }

    if (sliderEl) sliderEl.classList.add("swiper");
    if (slidesEl) slidesEl.classList.add("swiper-wrapper");
    slides.forEach(function (s) {
      s.classList.add("swiper-slide");
    });

    // Paramètres "en dur" propres au Swiper 1
    var desktopSpace = 8;
    var mobileSpace = 0;
    var speed = 500;
    var speeds = parseSwiperSpeed(section);

    var buildConfig = function (isDesktop) {
      var effect = isDesktop ? "slide" : "creative";
      var autoplayDelay = isDesktop ? speeds.desktop : speeds.mobile;

      var config = {
        slidesPerView: "auto",
        spaceBetween: isDesktop ? desktopSpace : mobileSpace,
        direction: "horizontal",
        loop: true,
        centeredSlides: true,
        speed: speed,
        grabCursor: true,
        effect: effect,
        observer: true,
        observeParents: true,
        slideActiveClass: "active",
        slideNextClass: "next",
        slidePrevClass: "prev",
        autoplay: autoplayDelay > 0
          ? {
            delay: autoplayDelay,
            disableOnInteraction: false,
            pauseOnMouseEnter: isDesktop,
          }
          : false,
      };

      if (prevBtn && nextBtn) {
        //console.log("[Swiper 1] Flèches de navigation activées");
        config.navigation = { prevEl: prevBtn, nextEl: nextBtn };
      }

      if (pagination) {
        //console.log("[Swiper 1] Pagination activée");
        config.pagination = getSwiperPaginationConfig(pagination);
      }

      // Effet carte customisé sur mobile
      if (effect === "creative") {
        config.creativeEffect = {
          prev: {
            shadow: false,
            translate: ["-120%", 0, -500],
            rotate: [0, 0, -8],
            opacity: 0,
          },
          next: {
            shadow: false,
            translate: ["12%", "-2%", -1],
            scale: 0.85,
            origin: "center center",
          },
          limitProgress: 2,
        };
      }

      return config;
    };

    var mql = window.matchMedia("(min-width: 768px)");
    var currentSwiper;

    var updateSwiper = function (e) {
      //console.log(
      //"[Swiper 1] Adaptation de l'écran. Mode desktop ? " + e.matches,
      //);
      if (currentSwiper && !currentSwiper.destroyed) {
        currentSwiper.destroy(true, true);
      }
      var currentDelay = e.matches ? speeds.desktop : speeds.mobile;
      currentSwiper = new Swiper(sliderEl, buildConfig(e.matches));
      setupSwiperPagination(currentSwiper, pagination, currentDelay);
      //console.log(
      //"[Swiper 1] Nouvelle instance Swiper créée avec succès",
      //currentSwiper,
      //);
    };

    mql.addEventListener("change", updateSwiper);
    updateSwiper(mql);
  });
}

//////////////////////////////////// 2. Swiper 2 (Autoplay: false, espace mobile: 8)
function Init_Swiper_2() {
  //console.log("[Swiper 2] Initialisation lancée");

  var sections = document.querySelectorAll('[data-sw="swiper-2"]');
  if (sections.length === 0) {
    //console.log(
    //'[Swiper 2] Section parent introuvable (pas de data-sw="swiper-2" sur la page)',
    //);
    return;
  }

  sections.forEach(function (section) {
    //console.log("[Swiper 2] Section trouvée !", section);

    var sliderEl = section.querySelector('[data-sw="slider"]');
    var slidesEl = section.querySelector('[data-sw="slides"]');
    var slides = section.querySelectorAll('[data-sw="slide"]');
    var prevBtn = section.querySelector('[data-sw="prev"]');
    var nextBtn = section.querySelector('[data-sw="next"]');
    var pagination = section.querySelector('[data-sw="pagination"]');

    if (!sliderEl) {
      console.error(
        '[Swiper 2] Configuration incomplète : data-sw="slider" introuvable !',
      );
      return;
    }

    if (slides.length === 0) {
      console.warn(
        '[Swiper 2] Aucune slide (data-sw="slide") trouvée à l\'intérieur du slider.',
      );
      return;
    } else {
      //console.log("[Swiper 2] Nombre de slides trouvées: " + slides.length);
    }

    if (sliderEl) sliderEl.classList.add("swiper");
    if (slidesEl) slidesEl.classList.add("swiper-wrapper");
    slides.forEach(function (s) {
      s.classList.add("swiper-slide");
    });

    // Paramètres "en dur" propres au Swiper 2
    var desktopSpace = 8;
    var mobileSpace = 8;
    var speed = 500;
    var speeds = parseSwiperSpeed(section);

    var buildConfig = function (isDesktop) {
      var effect = isDesktop ? "slide" : "creative";
      var autoplayDelay = isDesktop ? speeds.desktop : speeds.mobile;

      var config = {
        slidesPerView: "auto",
        spaceBetween: isDesktop ? desktopSpace : mobileSpace,
        direction: "horizontal",
        loop: true,
        centeredSlides: true,
        speed: speed,
        grabCursor: true,
        effect: effect,
        observer: true,
        observeParents: true,
        slideActiveClass: "active",
        slideNextClass: "next",
        slidePrevClass: "prev",
        autoplay: autoplayDelay > 0
          ? {
            delay: autoplayDelay,
            disableOnInteraction: false,
            pauseOnMouseEnter: isDesktop,
          }
          : false,
      };

      if (prevBtn && nextBtn) {
        //console.log("[Swiper 2] Flèches de navigation activées");
        config.navigation = { prevEl: prevBtn, nextEl: nextBtn };
      }

      if (pagination) {
        //console.log("[Swiper 2] Pagination activée");
        config.pagination = getSwiperPaginationConfig(pagination);
      }

      // Effet carte customisé sur mobile
      if (effect === "creative") {
        config.creativeEffect = {
          prev: {
            shadow: false,
            translate: ["-120%", 0, -500],
            rotate: [0, 0, -8],
            opacity: 0,
          },
          next: {
            shadow: false,
            translate: ["12%", "-2%", -1],
            scale: 0.85,
            origin: "center center",
          },
          limitProgress: 2,
        };
      }

      return config;
    };

    var mql = window.matchMedia("(min-width: 768px)");
    var currentSwiper;

    var updateSwiper = function (e) {
      //console.log(
      //"[Swiper 2] Adaptation de l'écran. Mode desktop ? " + e.matches,
      //);
      if (currentSwiper && !currentSwiper.destroyed) {
    currentSwiper.destroy(true, true);
  }
  var currentDelay = e.matches ? speeds.desktop : speeds.mobile;
  currentSwiper = new Swiper(sliderEl, buildConfig(e.matches));
  setupSwiperPagination(currentSwiper, pagination, currentDelay);
};

    mql.addEventListener("change", updateSwiper);
    updateSwiper(mql);
  });
}

//////////////////////////////////// Swiper INVESTIR
function InitSwiperInvestir() {
  //console.log("[Swiper Investir] Initialisation lancée");
  var section = document.querySelector('[data-sw="investir"]');
  if (!section) return;

  var sliderEl = section.querySelector('[data-sw="slider"]');
  var slidesEl = section.querySelector('[data-sw="slides"]');
  var slides = section.querySelectorAll('[data-sw="slide"]');
  var btnPrev = section.querySelector('[data-sw="prev"]');
  var btnNext = section.querySelector('[data-sw="next"]');
  var pagination = section.querySelector('[data-sw="pagination"]');

  if (!sliderEl) return;

  sliderEl.classList.add("swiper");
  slidesEl.classList.add("swiper-wrapper");
  slides.forEach(function (s) {
    s.classList.add("swiper-slide");
  });

  var speeds = parseSwiperSpeed(section);

  var buildConfig = function (isDesktop) {
    var autoplayDelay = isDesktop ? speeds.desktop : speeds.mobile;
    return {
      loop: true,
      speed: 600,
      effect: "fade",
      fadeEffect: { crossFade: true },
      allowTouchMove: true,
      observer: true,
      observeParents: true,
      watchSlidesProgress: true,
      navigation: { prevEl: btnPrev, nextEl: btnNext },
      pagination: pagination ? getSwiperPaginationConfig(pagination) : false,
      slideActiveClass: "active",
      autoplay: autoplayDelay > 0
        ? { delay: autoplayDelay, disableOnInteraction: false }
        : false,
    };
  };

  var mql = window.matchMedia("(min-width: 768px)");
  var currentSwiper;

  var updateSwiper = function (e) {
    //console.log(
    //"[Swiper Investir] Adaptation de l'écran. Mode desktop ? " + e.matches,
    //);
    if (currentSwiper && !currentSwiper.destroyed) {
      currentSwiper.destroy(true, true);
    }
    var currentDelay = e.matches ? speeds.desktop : speeds.mobile;
    currentSwiper = new Swiper(sliderEl, buildConfig(e.matches));
    setupSwiperPagination(currentSwiper, pagination, currentDelay);
    //console.log(
    //"[Swiper Investir] Nouvelle instance Swiper créée avec succès",
    //currentSwiper,
    //);
  };

  mql.addEventListener("change", updateSwiper);
  updateSwiper(mql);
}

//////////////////////////////////// Swiper 4 (Page Levées ?)
function Init_Swiper_4() {
  //console.log("[Swiper 4] Initialisation lancée");

  var sections = document.querySelectorAll('[data-sw="swiper-4"]');
  if (sections.length === 0) {
    //console.log(
    //'[Swiper 4] Section parent introuvable (pas de data-sw="swiper-4" sur la page)',
    //);
    return;
  }

  sections.forEach(function (section) {
    //console.log("[Swiper 4] Section trouvée !", section);

    var sliderEl = section.querySelector('[data-sw="slider"]');
    var slidesEl = section.querySelector('[data-sw="slides"]');
    var slides = section.querySelectorAll('[data-sw="slide"]');
    var prevBtn = section.querySelector('[data-sw="prev"]');
    var nextBtn = section.querySelector('[data-sw="next"]');
    var pagination = section.querySelector('[data-sw="pagination"]');

    if (!sliderEl) {
      console.error(
        '[Swiper 4] Configuration incomplète : data-sw="slider" introuvable !',
      );
      return;
    }

    if (slides.length === 0) {
      console.warn(
        '[Swiper 4] Aucune slide (data-sw="slide") trouvée à l\'intérieur du slider.',
      );
      return;
    } else {
      //console.log("[Swiper 4] Nombre de slides trouvées: " + slides.length);
    }

    if (sliderEl) sliderEl.classList.add("swiper");
    if (slidesEl) slidesEl.classList.add("swiper-wrapper");
    slides.forEach(function (s) {
      s.classList.add("swiper-slide");
    });

    // Paramètres "en dur" propres au Swiper 4
    var desktopSpace = 168;
    var mobileSpace = 8;
    var speed = 500;
    var speeds = parseSwiperSpeed(section);

    var buildConfig = function (isDesktop) {
      var effect = isDesktop ? "slide" : "creative";
      var autoplayDelay = isDesktop ? speeds.desktop : speeds.mobile;

      var config = {
        slidesPerView: "auto",
        spaceBetween: isDesktop ? desktopSpace : mobileSpace,
        direction: "horizontal",
        loop: true,
        centeredSlides: true,
        speed: speed,
        grabCursor: true,
        effect: effect,
        observer: true,
        observeParents: true,
        slideActiveClass: "active",
        slideNextClass: "next",
        slidePrevClass: "prev",
        autoplay: autoplayDelay > 0
          ? {
            delay: autoplayDelay,
            disableOnInteraction: false,
            pauseOnMouseEnter: isDesktop,
          }
          : false,
      };

      if (prevBtn && nextBtn) {
        //console.log("[Swiper 4] Flèches de navigation activées");
        config.navigation = { prevEl: prevBtn, nextEl: nextBtn };
      }

      if (pagination) {
        //console.log("[Swiper 4] Pagination activée");
        config.pagination = getSwiperPaginationConfig(pagination);
      }

      // Effet carte customisé sur mobile
      if (effect === "creative") {
        config.creativeEffect = {
          prev: {
            shadow: false,
            translate: ["-120%", 0, -500],
            rotate: [0, 0, -8],
            opacity: 0,
          },
          next: {
            shadow: false,
            translate: ["12%", "-2%", -1],
            scale: 0.85,
            origin: "center center",
          },
          limitProgress: 2,
        };
      }

      return config;
    };

    var mql = window.matchMedia("(min-width: 768px)");
    var currentSwiper;

    var updateSwiper = function (e) {
      //console.log(
      //"[Swiper 4] Adaptation de l'écran. Mode desktop ? " + e.matches,
      //);
      if (currentSwiper && !currentSwiper.destroyed) {
        currentSwiper.destroy(true, true);
      }
      var currentDelay = e.matches ? speeds.desktop : speeds.mobile;
      currentSwiper = new Swiper(sliderEl, buildConfig(e.matches));
      setupSwiperPagination(currentSwiper, pagination, currentDelay);
      //console.log(
      //"[Swiper 4] Nouvelle instance Swiper créée avec succès",
      //currentSwiper,
      //);
    };

    mql.addEventListener("change", updateSwiper);
    updateSwiper(mql);
  });
}

//////////////////////////////////// Swiper KOL
function InitSwiperKOL() {
  //console.log("[Swiper KOL] Initialisation lancée");
  var section = document.querySelector('[data-sw="kol"]');
  if (!section) return;

  var sliderEl = section.querySelector('[data-sw="slider"]');
  var slidesEl = section.querySelector('[data-sw="slides"]');
  var slides = section.querySelectorAll('[data-sw="slide"]');
  var btnPrev = section.querySelector('[data-sw="prev"]');
  var btnNext = section.querySelector('[data-sw="next"]');
  var pagination = section.querySelector('[data-sw="pagination"]');

  if (!sliderEl) return;

  sliderEl.classList.add("swiper");
  slidesEl.classList.add("swiper-wrapper");
  slides.forEach(function (s) {
    s.classList.add("swiper-slide");
  });

  var speeds = parseSwiperSpeed(section);

  var buildConfig = function (isDesktop) {
    var autoplayDelay = isDesktop ? speeds.desktop : speeds.mobile;
    return {
      loop: true,
      loopedSlides: slides.length || 5,
      slidesPerView: "auto",
      spaceBetween: 8,
      centeredSlides: true,
      allowTouchMove: true,
      grabCursor: true,
      observer: true,
      observeParents: true,
      watchSlidesProgress: true,
      navigation: { prevEl: btnPrev, nextEl: btnNext },
      pagination: pagination ? getSwiperPaginationConfig(pagination) : false,
      slideActiveClass: "active",
      autoplay: autoplayDelay > 0
        ? {
          delay: autoplayDelay,
          disableOnInteraction: false,
          pauseOnMouseEnter: false,
        }
        : false,
      on: {
        touchEnd: function () {
          var s = this;
          if (s.autoplay && !s.autoplay.running) {
            s.autoplay.start();
          }
        },
      },
    };
  };

  var mql = window.matchMedia("(min-width: 768px)");
  var currentSwiper;

  var updateSwiper = function (e) {
    //console.log(
    //"[Swiper KOL] Adaptation de l'écran. Mode desktop ? " + e.matches,
    //);
    if (currentSwiper && !currentSwiper.destroyed) {
      currentSwiper.destroy(true, true);
    }
    var currentDelay = e.matches ? speeds.desktop : speeds.mobile;
    currentSwiper = new Swiper(sliderEl, buildConfig(e.matches));
    setupSwiperPagination(currentSwiper, pagination, currentDelay);
    //console.log(
    //"[Swiper KOL] Nouvelle instance Swiper créée avec succès",
    //currentSwiper,
    //);
  };

  mql.addEventListener("change", updateSwiper);
  // Délai iOS Safari : laisser le DOM se peindre avant d'init
  setTimeout(function () {
    updateSwiper(mql);
  }, 150);
}

//////////////////////////////////// Swiper Levées
function InitSwiperLevees() {
  //console.log("[Swiper Levées] Initialisation lancée");
  var section = document.querySelector('[data-sw="levees"]');
  if (!section) return;

  var sliderEl = section.querySelector('[data-sw="slider"]');
  var slidesEl = section.querySelector('[data-sw="slides"]');
  var slides = section.querySelectorAll('[data-sw="slide"]');
  var btnPrev = section.querySelector('[data-sw="prev"]');
  var btnNext = section.querySelector('[data-sw="next"]');
  var pagination = section.querySelector('[data-sw="pagination"]');

  if (!sliderEl) return;

  sliderEl.classList.add("swiper");
  slidesEl.classList.add("swiper-wrapper");
  slides.forEach(function (s) {
    s.classList.add("swiper-slide");
  });

  var speeds = parseSwiperSpeed(section);

  var buildConfig = function (isDesktop) {
    var autoplayDelay = isDesktop ? speeds.desktop : speeds.mobile;
    return {
      loop: true,
      spaceBetween: 8,
      slidesPerView: "auto",
      allowTouchMove: true,
      grabCursor: true,
      loopedSlides: slides.length || 5,
      observer: true,
      observeParents: true,
      watchSlidesProgress: true,
      navigation: { prevEl: btnPrev, nextEl: btnNext },
      pagination: pagination ? getSwiperPaginationConfig(pagination) : false,
      breakpoints: {
        0: { centeredSlides: true },
        769: { centeredSlides: false },
      },
      slideActiveClass: "active",
      autoplay: autoplayDelay > 0
        ? {
          delay: autoplayDelay,
          disableOnInteraction: false,
          pauseOnMouseEnter: false,
        }
        : false,
    };
  };

  var mql = window.matchMedia("(min-width: 768px)");
  var currentSwiper;

  var updateSwiper = function (e) {
    //console.log(
    //"[Swiper Levées] Adaptation de l'écran. Mode desktop ? " + e.matches,
    //);
    if (currentSwiper && !currentSwiper.destroyed) {
      currentSwiper.destroy(true, true);
    }
    var currentDelay = e.matches ? speeds.desktop : speeds.mobile;
    currentSwiper = new Swiper(sliderEl, buildConfig(e.matches));
    setupSwiperPagination(currentSwiper, pagination, currentDelay);
    //console.log(
    //"[Swiper Levées] Nouvelle instance Swiper créée avec succès",
    //currentSwiper,
    //);
  };

  mql.addEventListener("change", updateSwiper);
  updateSwiper(mql);
}

//////////////////////////////////// Swiper Membres
function InitSwiperMembres() {
  //console.log("[Swiper Membres] Initialisation lancée");

  var sections = document.querySelectorAll('[data-sw="membres"]');
  if (sections.length === 0) {
    //console.log(
    //'[Swiper Membres] Section parent introuvable (pas de data-sw="membres" sur la page)',
    //);
    return;
  }

  sections.forEach(function (section) {
    //console.log("[Swiper Membres] Section trouvée !", section);

    var sliderEl = section.querySelector('[data-sw="slider"]');
    var slidesEl = section.querySelector('[data-sw="slides"]');
    var slides = section.querySelectorAll('[data-sw="slide"]');
    var prevBtn = section.querySelector('[data-sw="prev"]');
    var nextBtn = section.querySelector('[data-sw="next"]');
    var pagination = section.querySelector('[data-sw="pagination"]');

    if (!sliderEl) {
      console.error(
        '[Swiper Membres] Configuration incomplète : data-sw="slider" introuvable !',
      );
      return;
    }

    if (slides.length === 0) {
      console.warn(
        '[Swiper Membres] Aucune slide (data-sw="slide") trouvée à l\'intérieur du slider.',
      );
      return;
    } else {
      //console.log(
      //"[Swiper Membres] Nombre de slides trouvées: " + slides.length,
      //);
    }

    if (sliderEl) sliderEl.classList.add("swiper");
    if (slidesEl) slidesEl.classList.add("swiper-wrapper");
    slides.forEach(function (s) {
      s.classList.add("swiper-slide");
    });

    // Paramètres "en dur" propres au Swiper Membres
    var desktopSpace = 32;
    var mobileSpace = 32;
    var speed = 500;
    var speeds = parseSwiperSpeed(section);

    var buildConfig = function (isDesktop) {
      var autoplayDelay = isDesktop ? speeds.desktop : speeds.mobile;

      var config = {
        slidesPerView: "auto",
        spaceBetween: isDesktop ? desktopSpace : mobileSpace,
        loop: true,
        speed: speed,
        centeredSlides: !isDesktop,
        slideActiveClass: "active",
        autoplay: autoplayDelay > 0
          ? { delay: autoplayDelay, disableOnInteraction: false }
          : false,
      };

      if (prevBtn && nextBtn) {
        //console.log("[Swiper Membres] Flèches de navigation activées");
        config.navigation = { prevEl: prevBtn, nextEl: nextBtn };
      }

      if (pagination) {
        //console.log("[Swiper Membres] Pagination activée");
        config.pagination = getSwiperPaginationConfig(pagination);
      }

      return config;
    };

    var mql = window.matchMedia("(min-width: 768px)");
    var currentSwiper;

    var updateSwiper = function (e) {
      //console.log(
      //"[Swiper Membres] Adaptation de l'écran. Mode desktop ? " + e.matches,
      //);
      if (currentSwiper && !currentSwiper.destroyed) {
        currentSwiper.destroy(true, true);
      }
      var currentDelay = e.matches ? speeds.desktop : speeds.mobile;
      currentSwiper = new Swiper(sliderEl, buildConfig(e.matches));
      setupSwiperPagination(currentSwiper, pagination, currentDelay);
      //console.log(
      //"[Swiper Membres] Nouvelle instance Swiper créée avec succès",
      //currentSwiper,
      //);
    };

    mql.addEventListener("change", updateSwiper);
    updateSwiper(mql);
  });
}

//////////////////////////////////// Swiper Trustpilot
function InitSwiperTrustpilot() {
  //console.log("[Swiper Trustpilot] Initialisation lancée");

  var sections = document.querySelectorAll('[data-sw="trustpilot"]');
  if (sections.length === 0) {
    //console.log(
    //'[Swiper Trustpilot] Section parent introuvable (pas de data-sw="trustpilot" sur la page)',
    //);
    return;
  }

  sections.forEach(function (section) {
    //console.log("[Swiper Trustpilot] Section trouvée !", section);

    var sliderEl = section.querySelector('[data-sw="slider"]');
    var slidesEl = section.querySelector('[data-sw="slides"]');
    var slides = section.querySelectorAll('[data-sw="slide"]');
    var prevBtn = section.querySelector('[data-sw="prev"]');
    var nextBtn = section.querySelector('[data-sw="next"]');
    var pagination = section.querySelector('[data-sw="pagination"]');

    if (!sliderEl) {
      console.error(
        '[Swiper Trustpilot] Configuration incomplète : data-sw="slider" introuvable !',
      );
      return;
    }

    if (slides.length === 0) {
      console.warn(
        '[Swiper Trustpilot] Aucune slide (data-sw="slide") trouvée à l\'intérieur du slider.',
      );
      return;
    } else {
      //console.log(
      //"[Swiper Trustpilot] Nombre de slides trouvées: " + slides.length,
      //);
    }

    if (sliderEl) sliderEl.classList.add("swiper");
    if (slidesEl) slidesEl.classList.add("swiper-wrapper");
    slides.forEach(function (s) {
      s.classList.add("swiper-slide");
    });

    var speeds = parseSwiperSpeed(section);

    var buildConfig = function (isDesktop) {
      var autoplayDelay = isDesktop ? speeds.desktop : speeds.mobile;

      var config = {
        slidesPerView: "auto",
        spaceBetween: 8,
        centeredSlides: false,
        loop: true,
        allowTouchMove: true,
        grabCursor: true,
        loopedSlides: slides.length || 5,
        observer: true,
        observeParents: true,
        watchSlidesProgress: true,
        slideActiveClass: "active",
        autoplay: autoplayDelay > 0
          ? {
            delay: autoplayDelay,
            disableOnInteraction: false,
            pauseOnMouseEnter: false,
          }
          : false,
      };

      if (prevBtn && nextBtn) {
        //console.log("[Swiper Trustpilot] Flèches de navigation activées");
        config.navigation = { prevEl: prevBtn, nextEl: nextBtn };
      }

      if (pagination) {
        //console.log("[Swiper Trustpilot] Pagination activée");
        config.pagination = getSwiperPaginationConfig(pagination);
      }

      return config;
    };

    var mql = window.matchMedia("(min-width: 768px)");
    var currentSwiper;

    var updateSwiper = function (e) {
      //console.log(
      //"[Swiper Trustpilot] Adaptation de l'écran. Mode desktop ? " +
      //e.matches,
      //);
      if (currentSwiper && !currentSwiper.destroyed) {
        currentSwiper.destroy(true, true);
      }
      var currentDelay = e.matches ? speeds.desktop : speeds.mobile;
      currentSwiper = new Swiper(sliderEl, buildConfig(e.matches));
      setupSwiperPagination(currentSwiper, pagination, currentDelay);
      //console.log(
      //"[Swiper Trustpilot] Nouvelle instance Swiper créée avec succès",
      //currentSwiper,
      //);
    };

    mql.addEventListener("change", updateSwiper);
    updateSwiper(mql);
  });
}

// ============================================================
// init SWIPERS
// ============================================================

//////////////////////////////////// Init swipers
function initAllSwipers() {
  document.querySelector('[data-sw="swiper-1"]') && Init_Swiper_1();
  document.querySelector('[data-sw="swiper-2"]') && Init_Swiper_2();
  document.querySelector('[data-sw="investir"]') && InitSwiperInvestir();
  document.querySelector('[data-sw="swiper-4"]') && Init_Swiper_4();
  document.querySelector('[data-sw="kol"]') && InitSwiperKOL();
  document.querySelector('[data-sw="levees"]') && InitSwiperLevees();
  document.querySelector('[data-sw="membres"]') && InitSwiperMembres();
  document.querySelector('[data-sw="trustpilot"]') && InitSwiperTrustpilot();
}

initAllSwipers();
