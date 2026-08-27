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
    codeParam: "code",                // nom du param dans l'URL ET dans le Typeform
    codePattern: /^[A-Za-z0-9]{7}$/,  // 7 caractères alphanumériques
    codePaths: ["/parrainage"],       // seules pages où le code est lu
  };

  /* =========================
       CODE PARRAINAGE
       ========================= */

  /**
   * Lit le param code dans l'URL, uniquement sur les pages de CONFIG.codePaths,
   * et le valide (7 caractères alphanumériques).
   *
   * La redirection 404 en cas d'absence/invalidité est gérée par un script
   * inline dans le <head> de la page /parrainage (évite le flash de contenu).
   * Garder les deux regex synchronisées.
   *
   * @returns {string} le code valide, ou "" si hors page / absent / invalide
   */
  function getReferralCode() {
    const path = window.location.pathname.replace(/\/+$/, "") || "/";
    const isCodePage = CONFIG.codePaths.some(
      (p) => path === p || path.startsWith(p + "/"),
    );
    if (!isCodePage) return "";

    const raw = new URLSearchParams(window.location.search).get(
      CONFIG.codeParam,
    );
    if (!raw) return "";

    const code = raw.trim();
    return CONFIG.codePattern.test(code) ? code : "";
  }

  const REFERRAL_CODE = getReferralCode();

  /* =========================
       HELPERS
       ========================= */
  function getEmailFromElement(element) {
    return (
      element.querySelector('input[type="email"]')?.value?.replace(
        /\+/g,
        "%2B",
      ) || ""
    );
  }

  function updateIframeParams(params) {
    const iframe = document.querySelector(CONFIG.iframeSelector);
    if (!iframe) return;

    const currentSrc = iframe.getAttribute("src");
    if (!currentSrc) return;

    // On isole le hash pour réinsérer les params avant lui
    const hashIndex = currentSrc.indexOf("#");
    let base = hashIndex === -1 ? currentSrc : currentSrc.slice(0, hashIndex);
    const hash = hashIndex === -1 ? "" : currentSrc.slice(hashIndex);

    // valeurs déjà sûres pour une URL (email : + → %2B), on ne ré-encode pas
    const append = (key, value) => {
      if (!value) return;
      if (new RegExp("[?&]" + key + "=").test(base)) return; // déjà présent
      base += (base.includes("?") ? "&" : "?") + key + "=" + value;
    };

    append("email", params.email);
    append(CONFIG.codeParam, params.code);

    const newSrc = base + hash;
    if (newSrc !== currentSrc) iframe.setAttribute("src", newSrc);
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

    // 2 — injecter email + code après création iframe
    if (email || REFERRAL_CODE) {
      setTimeout(
        () => updateIframeParams({ email, code: REFERRAL_CODE }),
        CONFIG.iframeDelayMs,
      );
    }
  }

  /* =========================
       LISTENERS
       ========================= */

  // submit formulaire → récupère email + role depuis data-tf-role
  document.querySelectorAll('[OpenTf="form"]').forEach((form) => {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      openTf({
        role: form.dataset.tfRole || "",
        email: getEmailFromElement(form),
      });
    });
  });

  // clic simple → ouvre le form lié via data-tf-role
  document.querySelectorAll('[OpenTf="btn"]').forEach((el) => {
    el.addEventListener("click", function (event) {
      event.preventDefault();
      openTf({ role: el.dataset.tfRole || "" });
    });
  });

  // Exposition globale pour debug console
  window.TypeformManager = { openTf, code: REFERRAL_CODE };
})();
