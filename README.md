# blast-scripts

# Documentation — Scripts JS Custom Blast Club

> Référence technique pour les fichiers `main.js` et `swipers.js` (Webflow + Val Town / jsDelivr).
> Cible : un développeur qui découvre le projet et doit comprendre **quelle fonction fait quoi, et pourquoi**.

---

## 1. Vue d'ensemble

Le site Blast Club (Webflow) charge deux scripts JS custom :

```html
<script src="https://cdn.jsdelivr.net/gh/nocode-factory/blast-scripts@main/main.js" defer></script>
<script src="https://cdn.jsdelivr.net/gh/nocode-factory/blast-scripts@main/swipers.js" defer></script>
```

- **`main.js`** : tous les comportements interactifs de la page (Typeform, navbar, animations GSAP, tabs, tooltips, lightbox vidéo, modal des levées de fonds…).
- **`swipers.js`** : tous les carrousels Swiper.js.

GSAP et ScrollTrigger sont chargés **en externe avant** ces deux fichiers. Swiper.js et le SDK Vimeo Player sont aussi chargés en externe.

### Conventions du projet à connaître

| Règle | Pourquoi |
|---|---|
| **JS vanilla**, pas de framework | Contrainte Webflow / nocode. |
| `var` + ES5 pour le code **modal/levées**, ES6+ ailleurs | Cohérence avec l'existant sur le bloc modal ; le reste est moderne. |
| Chaque fonction doit être **appelable en console** | Debug. Les fonctions clés sont attachées à `window` (`window.maFonction = maFonction`). |
| Éviter `MutationObserver`, sinon le limiter (guard + debounce 10 ms) | Coût perf, surtout sur mobile. |
| Pas de `setTimeout` à délai fixe pour attendre le DOM | Préférer la détection de changement réel. Quelques exceptions documentées plus bas (iOS Safari). |
| Mettre à jour la date `📆 UPDATE` en haut du fichier à chaque modif | Invalidation/lisibilité du cache. |

> **Note Val Town historique** : à l'origine les fichiers étaient servis par Val Town en `type="module"` (scope module, d'où l'exposition manuelle sur `window`). Le projet a migré vers **GitHub + jsDelivr** avec `defer` pour de meilleures perfs (cache CDN). L'exposition sur `window` reste néanmoins utile pour le debug console.

---

## 2. `main.js`

Ordre des blocs dans le fichier (= ordre d'exécution au parse) :

1. TypeformManager
2. Navbar mobile
3. GSAP anim global (`animateElements`)
4. Bento → tabs tablet/mobile (`initCardBlurTabs`)
5. Marquee highlight (`startRandomHighlight`)
6. Tags animés sur la map (`initTagsAnimateOnMap`)
7. Auto-rotate fake tabs (`AutoRotateFakeTabs`)
8. Effet magnétique (`initMagneticEffect`)
9. Lightbox Vimeo (`initVimeoLightboxAdvanced`)
10. Parallax (`initParallaxLayers`)
11. Tooltip mobile (`initMobileTooltips`)
12. Map rotator (`initMapRotator`)
13. Auto-tabs progress / opacity (`autoTabsProgress`, `autoTabsOpacity`)
14. **Modal Levées** (gros bloc dédié)
15. `initPageScripts()` — init conditionnelle

### Stratégie d'init (point d'attention)

L'init est **volontairement éclatée** selon les blocs — utile à comprendre pour ne pas chercher un orchestrateur unique :

| Mécanisme de lancement | Blocs concernés |
|---|---|
| Exécuté **immédiatement** au parse | `animateElements()`, `autoTabsProgress()`, `autoTabsOpacity()` |
| Sur `DOMContentLoaded` | Navbar mobile, `initCardBlurTabs`, `AutoRotateFakeTabs`, `startRandomHighlight` (+500 ms) |
| Via `initPageScripts()` (guard par présence d'un attribut) | `initMagneticEffect`, `initVimeoLightboxAdvanced`, `initParallaxLayers`, `initMapRotator`, `initTagsAnimateOnMap`, `initMobileTooltips` |
| Sur `window.load` | `initModal()` (modal levées) |

---

### 2.1 TypeformManager (IIFE → `window.TypeformManager`)

**But** : ouvrir le bon popup Typeform et y pré-injecter l'email saisi.

| Fonction | Rôle | Pourquoi |
|---|---|---|
| `getEmailFromElement(element)` | Récupère la valeur d'un `input[type=email]` et encode le `+` en `%2B`. | Le `+` casse les query params d'URL Typeform. |
| `updateIframeParams({email})` | Ajoute `?email=` (ou `&email=`) à la `src` de l'iframe Typeform. | Pré-remplir le formulaire. |
| `openTf({role, email})` | Trouve le trigger `[OpenTf="trigger"][data-tf-role="…"]` (fallback : premier trigger), le clique, puis injecte l'email après 400 ms. | Le délai laisse Typeform créer l'iframe avant qu'on touche sa `src`. |

**Listeners posés à l'init** :
- `[OpenTf="form"]` → `submit` : preventDefault, lit email + `data-tf-role`, appelle `openTf`.
- `[OpenTf="btn"]` → `click` : ouvre le form lié via `data-tf-role`.

> Le `setTimeout(400ms)` ici est **intentionnel** (attente de la création de l'iframe Typeform), ce n'est pas une attente du DOM générale.

---

### 2.2 Navbar mobile

**But** : gérer l'ouverture/fermeture du menu mobile (fond flouté, blocage du scroll).

- S'exécute **uniquement si `window.innerWidth < 769`**, sur `DOMContentLoaded`.
- `openMenu()` : positionne `.background-navbar` en plein écran, floute `.main-wrapper`, bloque le scroll body.
- `closeMenu()` : masque les menus, retire le flou, restaure le scroll.
- Le clic sur `#menuButton` lit l'état réel des `.navbar5_menu` (via `getComputedStyle`) après 50 ms pour décider d'ouvrir ou fermer.
- Clic sur le fond `.slide-menu` → ferme + re-simule un clic sur le burger pour que **Webflow** remette l'icône dans le bon état.

> Le `setTimeout(50ms)` attend que Webflow ait basculé l'affichage des menus avant de lire leur état.

---

### 2.3 `animateElements()` — GSAP global

**But** : animer en `fade-up` les éléments `[data-animate="fade-up"]` au scroll, avec gestion optionnelle skeleton → final.

- `gsap.registerPlugin(ScrollTrigger)` en amont.
- Au début, **kill tous les ScrollTriggers existants** puis masque tous les `[display="final"]` — permet de relancer proprement l'anim (ex. après un changement de tab).
- Pour chaque élément : lit les data-attributes (`data-delay`, `data-start-y/x`, `data-end-y/x`, `data-start-rotate`, `data-end-rotate`) et joue un `fromTo` déclenché à `top 95%`, `once: true`.
- Si l'élément contient des couples `[display="skeleton"]` / `[display="final"]`, enchaîne un fondu skeleton → final après `delay + 500ms`.

**Relance** : tout `[gsap-trigger="click"]` rappelle `animateElements()` 300 ms après un clic (utile quand du contenu apparaît dynamiquement).

---

### 2.4 Bento → tabs (`initCardBlurTabs`)

**But** : en tablet/mobile (`max-width: 991px`), transformer un bloc « bento » en accordéon/tabs ; en desktop, tout réinitialiser.

| Fonction | Rôle |
|---|---|
| `getToggles()` | Cache la liste des `[card-blur-tabs="toggle"]` au 1er appel. Évite des `querySelectorAll` répétés. |
| `setListOpen(list, open)` | Ouvre/ferme une liste via styles `!important` + flag `data-cb-open`. |
| `isListOpen(list)` | Lit le flag `data-cb-open` (au lieu de `getComputedStyle`, plus coûteux). |
| `applyToggleStyle(toggle, open)` | Applique l'état visuel d'un toggle (rotation chevron, couleurs `dropdown` / `dropdown-dark`). |
| `resetToggleStyle(toggle)` | Remet les styles inline à vide (mode desktop). |
| `initCardBlurTabs()` | Desktop → reset complet. Mobile → ouvre la liste marquée `card-blur-tabs-load="first"`, ferme les autres, sync les toggles. |
| `handleCardBlurTabsClick()` | Pose les listeners de clic : ferme tout, puis ouvre la liste du toggle cliqué (comportement accordéon exclusif). |

**Réactivité** : `mediaQuery.addEventListener("change", initCardBlurTabs)` rejoue l'init au passage desktop ↔ mobile.

---

### 2.5 `startRandomHighlight()` — marquee « Investir »

**But** : dans un marquee horizontal (`[data-marquee-viewport]`), mettre en surbrillance aléatoirement un item **visible** à la fois, en tournant de ligne en ligne.

Logique interne :
- `getLines()` / `getVisibleItemsInLine(line)` : ne considère que les items dont le centre est dans le viewport (marge 50 px).
- `applyRandomHighlightOnCurrentLine()` : tire un item visible au hasard, ajoute `is-highlighted` + classe couleur + opacité du gradient.
- `findNextLineWithVisibleItems()` : passe à la ligne suivante ayant des items visibles.
- `checkVisibility()` (toutes les 100 ms) : si l'item surligné sort de l'écran (marquee qui défile), retire et re-tire ailleurs.
- Rotation auto toutes les **4000 ms** (`resetRotationInterval`).

> Lancé sur `DOMContentLoaded` après 500 ms (laisse le marquee se mettre en place).

---

### 2.6 `initTagsAnimateOnMap()` (→ `window`)

**But** : faire défiler des tags de startups dans des « slots » sur une carte, par petits lots, avec fondu.

- **Config** : `INTERVAL` 2000 ms (entre lots), `FADE` 1200 ms, `STAGGER` 1200 ms, `BATCH` 2 slots/lot.
- Mode de transition selon `data-tag-fade` : `"opacity"` (fondu pur) ou classe `.visible` / `.exit`.
- `IntersectionObserver` : ne rafraîchit que les slots réellement visibles à l'écran (`visibleSlots`).
- **File d'attente tournante** (`pickFromQueue`) : garantit que chaque slot visible est rafraîchi une fois avant qu'un autre repasse, puis remélange la tournée → ordre varié sans répétition immédiate.
- `nextTag()` pioche dans le pool de tags de façon cyclique (`poolIndex`).

---

### 2.7 `AutoRotateFakeTabs()` (→ `window`)

**But** : carrousel de « faux onglets » auto-rotatif avec barres de progression (zone `[data-tabs-wrap]`).

| Élément/attribut | Rôle |
|---|---|
| `[data-tabs-trigger]`, `[data-tabs-panel]`, `[data-tabs-progress-bar]` | Onglets, panneaux, barres. |
| `data-tabs-duration` | Durée par onglet (défaut 5000 ms). |
| `data-tabs-ready` | Posé en fin d'init → active le CSS qui masque les panneaux inactifs (sans JS, tout reste visible, ex. dans le Designer Webflow). |

- `switchToTab(index)` : active trigger + panel, remet toutes les barres à 0, anime la barre active à 100 % en `duration` ms.
- `goToNextTab()` / `startAutoplay()` / `stopAutoplay()` : autoplay par `setInterval`.
- Clic sur un onglet → `switchToTab` + redémarre l'autoplay.
- `void bars[index].offsetWidth` force un reflow pour que le reset à 0 soit appliqué avant l'animation.

> Init sur `DOMContentLoaded` si `[data-tabs-wrap]` présent.

---

### 2.8 `initMagneticEffect()`

**But** : effet « bouton magnétique » qui suit la souris (desktop uniquement, `> 991px`).

- Cible le wrapper `.btn-magnetic` (zone élargie) et déplace le bouton visuel `.btn-magnetic__click` à l'intérieur via GSAP.
- `data-magnetic-strength` / `data-magnetic-strength-inner` : intensité du déplacement (défaut 25). Un élément interne `[data-magnetic-inner-target]` peut bouger avec une intensité propre.
- `mouseenter` reset immédiat, `mousemove` suit le curseur (ease `power4.out`), `mouseleave` retour élastique au centre (`elastic.out`).

---

### 2.9 `initVimeoLightboxAdvanced()`

**But** : lightbox vidéo Vimeo custom avec contrôles maison (play/pause/mute/timeline/fullscreen), sizing adaptatif et gestion mobile.

C'est le bloc le plus volumineux. Points clés :

- **Une seule lightbox partagée** (`[data-vimeo-lightbox-init]`) ; plusieurs boutons `[data-vimeo-lightbox-control="open"]` avec chacun un `data-vimeo-lightbox-id`.
- `openLightbox(id, placeholderBtn)` :
  - Si on change de vidéo, **détruit et recrée l'iframe** (`unload` + remplacement DOM) pour repartir propre.
  - Construit un `new Vimeo.Player(iframe)`, met à jour l'image placeholder depuis le bouton cliqué.
  - **Mobile (`isTouch`)** : 1er play forcé en muet (autoplay mobile), puis remet le son si non-muet ; mémorise via `playedOnce` pour ne pas re-muter aux lectures suivantes.
- `setupPlayerEvents()` : branche les events Vimeo (play/pause/ended), la durée, la timeline (`timeupdate`), le masquage des contrôles après 3 s d'inactivité, et le fullscreen (avec fallback `webkit`).
- `runSizing()` : adapte les dimensions selon `data-vimeo-update-size` (`true` = ratio classique, `cover` = remplissage, sinon clamp). Re-déclenché sur `resize`.
- États exposés en attributs sur la lightbox : `data-vimeo-activated`, `-loaded`, `-playing`, `-muted`, `-hover`, `-fullscreen` → pilotent le CSS.
- Fermeture : bouton close, `Escape`, clic sur le fond (en ignorant les clics sur le player et les contrôles).

> Garde le `console.log` de debug au clic — pratique pour vérifier l'ID vidéo trouvé. Si un item CMS a un ID vide, le clic est ignoré avec un warning.

---

### 2.10 `initParallaxLayers()`

**But** : parallax au scroll sur `[data-parallax-layers]` via une timeline GSAP `scrub`.

- Deux couches (`data-parallax-layer="1"` et `"2"`) qui montent en `yPercent` (amplitude réduite sur mobile `< 768px`).
- `scrollTrigger` de `top bottom` à `bottom top`, `scrub: 1`.

---

### 2.11 `initMobileTooltips()`

**But** : sur mobile/tablette (`< 768px`), gérer les tooltips au **clic** (le hover desktop est géré en CSS).

- Stratégie hybride pour trouver la bulle : d'abord `querySelector('[data-css-tooltip]')` **dans** le trigger (cas Pricing), sinon l'élément frère suivant (cas Décacornes).
- À l'ouverture : déplace la tooltip dans `document.body` (classe `tooltip-moving`), bloque le scroll, ajoute `is-active` au double-`requestAnimationFrame` (pour déclencher la transition CSS).
- À la fermeture : retire `is-active`, restaure le scroll, et après 400 ms **remet la tooltip à sa place d'origine** dans le DOM (`originalParent`).
- Clics gérés : dans la bulle ouverte → ferme ; sur un trigger → ouvre/bascule ; ailleurs → ferme.

> Contient des `console.log` de trace volontaires (🕒 / ✨ / 🚀…) utiles au debug.

---

### 2.12 `initMapRotator()` (→ `window`)

**But** : faire apparaître/disparaître des noms de villes (`[data-city]`) sur une carte, par groupes aléatoires, en boucle infinie.

- Config : délai entre villes 200 ms, visible 500 ms, fondu 500 ms, groupes de 1 à 3 villes.
- `startLoop()` (async, `while(true)`) : mélange les villes, forme des groupes, les affiche en `stagger` puis les masque.
- `isCompatible(el, group)` : respecte les exclusions `data-city-exclude` (liste de villes qui ne doivent pas apparaître ensemble).

---

### 2.13 `autoTabsProgress()` et `autoTabsOpacity()`

Deux variantes d'un même composant « auto-tabs » avec image synchronisée. Lancées **immédiatement** au parse.

**Déclencheurs (wrapper)** :
- `auto-tabs-wrapper-progress` → variante avec **barre de progression** (`autoTabsProgress`).
- `auto-tabs-wrapper-opacity` → variante **opacité seule** (`autoTabsOpacity`).

**Structure commune** : `[auto-tab]` (onglets, indexés par `tab-index`), `[auto-tab-image]` (images, mêmes index), `[auto-tabs-media]` (conteneur image), `[auto-tab-body]`, `[auto-tab-bar]`, `[auto-tab-number]`.

| Fonction | Rôle |
|---|---|
| `injectStyles()` | Injecte un `<style>` scopé au wrapper (opacités, transitions, couleur active `#FF4920`, barre 2 px). |
| `setMediaHeight()` | Fixe la hauteur du conteneur média sur celle de la 1ʳᵉ image (attend `load` si pas encore chargée). Re-calculé au `resize`. |
| `setActive(index)` | Active l'onglet + l'image d'index donné, réinitialise les autres, lance le cycle. |
| **`autoTabsProgress` : `animate(ts)`** | `requestAnimationFrame` : remplit la barre active de 0→100 % sur `DURATION` (6000 ms), puis passe au tab suivant. |
| **`autoTabsOpacity` : `setTimeout`** | Avance simplement au tab suivant après `DURATION`. |

Clic sur un onglet → stoppe le cycle courant et `setActive` sur l'onglet cliqué.

> **Évolution prévue (issue de nos échanges)** : remplacer l'autoplay au timer de `autoTabsProgress` par une **progression pilotée au scroll** — section *pinned* + `scrub` ScrollTrigger, image *sticky* à côté. Cela implique de **remplacer** la logique d'autoplay (pas de la superposer). Le flicker d'opacité entre images identiques avait été résolu côté attributs.

---

### 2.14 Modal Levées

> Tout ce bloc est en `var` + ES5 (cohérence). Toutes les fonctions sont accessibles en console (scope module → debug via `window.xxx` quand exposé, sinon via les noms globaux du fichier).

**But** : afficher dans une **modal partagée** le détail des levées de fonds par startup, à partir de tableaux CMS Webflow **paginés par Finsweet Attributes v2**.

**État global** : `window.raisesIndex = {}` (index des levées par company), `window.modal` (l'élément modal courant).

#### Deux structures HTML de tableau source

- **Tableau « flat »** : le `[data-modal-open]` porte un `data-slug` **non vide** + `data-company`. Les `data-raise-*` sont sur ses enfants directs.
- **Tableau « nested »** : le `[data-modal-open]` a `data-slug=""` (vide) + `data-company`. Les levées sont dans des `[data-slug]` **descendants**. Les `data-raise-*` peuvent être en valeur d'attribut (`data-raise-serie="Seed"`) ou en `textContent`.

La détection flat vs nested se fait simplement : **présence ou non d'un `data-slug` non vide sur le trigger** (`isNested = !triggerSlug`).

#### Utilitaires

| Fonction | Rôle | Pourquoi |
|---|---|---|
| `readAttr(root, attr)` | Lit un `data-raise-*`. Priorité : valeur d'attribut non vide > `src` (IMG) > `textContent` d'un badge > objet tooltip > `textContent`. | Couvre les structures variées entre CMS items. **Ne pas utiliser pour `data-raise-operation`**. |
| `readOperationAttr(root)` | Lit `data-raise-operation` et **normalise toujours** vers `{ isTooltip, label, bubble }`. | L'opération peut être un simple texte ou une tooltip (`[data-css-tooltip-hover]` + `.css-tooltip-text` dans le `parentNode`). On uniformise pour l'injection. |
| `parseAmount(str)` | Parse un montant formaté (`"4,3M€"`, `"500K$"`, `"1,2Md€"`) → `{ value: Float (en millions), currency: '€'|'$'|'' }`. | Permet d'additionner des montants hétérogènes. |
| `formatAmount(totalM, currency)` | Formate un total (en millions) → string lisible. Devise **toujours en suffixe**. Seuils : `< 1M → K`, `1–999M → M`, `≥ 1000M → Md`. | Affichage cohérent des totaux. |

#### Index des levées

| Fonction | Rôle | Pourquoi |
|---|---|---|
| `buildRaisesIndex()` | Parcourt tous les `[data-modal-open]`, construit `{ companySlug: [{ slug, serie, operation, date, amount, img }] }`. | Source de vérité unique pour alimenter la modal et les totaux. |
| **Guard `hasData`** (dans `buildRaisesIndex`) | Ignore les items dont **tous** les champs sont vides. | Finsweet injecte les `[data-slug]` **vides** dans le DOM avant que le contenu CMS arrive → sinon on indexerait des coquilles vides. |
| `mergeIntoIndex(fresh)` | Fusionne un index partiel dans `window.raisesIndex`. **Remplace toujours** une entrée de même `slug` (pas de rejet de doublon). | Un même company peut avoir deux triggers (`combine-startup` true ET false). Le remplacement évite les conflits. |
| `applyCombineStartup()` | Pour `combine-startup="true"` : ne garde **visible que le premier `[data-slug]`** par company (tous triggers confondus), masque les suivants (`display:none !important`). | Affiche une seule ligne par startup au lieu d'une par levée. Le dictionnaire `firstSlugPerCompany` regroupe par company. |
| `preloadAllPages()` | `fetch` en arrière-plan des pages suivantes via `.w-pagination-next` (DOMParser), pour compléter `raisesIndex` avec les items hors page courante. | Les totaux et le contenu modal doivent être complets même pour les startups non encore affichées. **Déclenché au 1er clic** (pas au load) pour économiser la bande passante mobile. |

#### Injection

| Fonction | Rôle |
|---|---|
| `injectRaises(modalItem, raises)` | Clone `[data-raise-template]` pour chaque levée, supprime les `[data-raise-clone]` existants, injecte serie/date/amount/img (IMG → `src`, sinon `textContent`). Traite `operation` à part via `{ isTooltip, label, bubble }`. |
| `injectTotal(target)` | Somme les montants des clones injectés **par devise**, met à jour le `[data-raises-total]` **de la modal**, retourne la valeur formatée. |
| `injectTableTotals()` | Calcule les totaux **depuis `window.raisesIndex`** et met à jour les `[data-raises-total]` **dans les tableaux sources** (pas la modal). À rappeler après chaque `mergeIntoIndex` et à l'init. |

#### Ouverture / fermeture

| Fonction | Rôle |
|---|---|
| `handleModalOpen(e)` | Délégation de clic sur `[data-modal-open]` (**ignore `data-modal-open="kol"`**). Détecte flat vs nested, résout le `slug`, détermine `isCombined` via `combine-startup`, affiche le bon `[data-modal-item="slug"]`, pose `data-raises-count="single|multiple"`, appelle `injectRaises` + `injectTotal`, ouvre la modal. |
| `closeModal()` | Retire `is-open`, restaure le scroll. |
| `initModalListeners()` | Branche : clic délégué (`handleModalOpen`), clic hors `.modal_card` → ferme, boutons `[data-modal-close]`, touche `Escape`. |
| `initFinsweetListener()` | Détecte les ajouts de `[data-modal-open]` après un **load more** Finsweet, via `MutationObserver` + guard + debounce 10 ms ; aussi à l'écoute de l'event `fs-list-load`. Rejoue `mergeIntoIndex(buildRaisesIndex())` + `applyCombineStartup()` + `injectTableTotals()`. |
| `initModal()` | **Point d'entrée** (`window.load`). Guard si pas de `[data-modal-open]`. Séquence : `buildRaisesIndex` → `applyCombineStartup` → `injectTableTotals` → `initFinsweetListener` → `initModalListeners`, puis `preloadAllPages()` au **premier clic**. |

#### Pièges connus et solutions appliquées

| Problème | Solution |
|---|---|
| Finsweet injecte des `[data-slug]` vides avant le CMS | Guard `hasData` dans `buildRaisesIndex`. |
| Deux triggers par company (`combine-startup` true + false) | `mergeIntoIndex` remplace toujours (pas de rejet de doublon). |
| Load more Finsweet recrée les éléments **sans event fiable** | `MutationObserver` (guard `hasNewTriggers` + debounce 10 ms) + écoute `fs-list-load`. |
| Regrouper par company tous triggers confondus | dictionnaire `firstSlugPerCompany`. |
| Montants multi-devises (€ et $) | `parseAmount` renvoie `{ value, currency }`, totaux groupés par devise. |
| Fermeture KO en mobile (clic backdrop) | Listener basé sur `closest('.modal_card')` plutôt que sur l'égalité stricte `e.target`. |

> **Conflit modal KOL** : la modal KOL (`data-modal="kol"`, `data-modal-open="kol"`) est un script inline séparé (commenté pour l'instant). La modal levées **ignore** les triggers `kol` et ne cible que `[data-modal]:not([data-modal="kol"])`.

> **Point d'attention perf** : `initFinsweetListener` observe `document.body` en `subtree:true`, ce qui est coûteux pendant que Webflow/Finsweet manipulent le DOM. Bonne pratique : restreindre l'observation au conteneur de liste (`[fs-list-element="list"]`) plutôt qu'au body entier.

---

### 2.15 `initPageScripts()`

Init conditionnelle : chaque script n'est lancé que si son attribut déclencheur est présent sur la page.

```js
[data-magnetic-wrapper]    → initMagneticEffect()
[data-vimeo-lightbox-id]   → initVimeoLightboxAdvanced()
[data-parallax-layers]     → initParallaxLayers()
[data-city-rotator]        → initMapRotator()
[data-tag-rotator]         → initTagsAnimateOnMap()
[data-css-tooltip-hover]   → initMobileTooltips()
```

---

## 3. `swipers.js`

Tous les carrousels Swiper.js. **Ne jamais piloter ce fichier depuis `main.js`** (séparation stricte).

### 3.1 Helpers communs

| Fonction | Rôle | Pourquoi |
|---|---|---|
| `getSwiperPaginationConfig(paginationEl)` | Renvoie la config de pagination en **préservant les classes custom Webflow** des bullets (variants de couleur) via `renderBullet`. | Webflow style les bullets ; on ne veut pas perdre ces classes au re-render. |
| `setupSwiperPagination(instance, paginationEl, durationMs)` | Pose `--swiper-autoplay-duration` et anime la bullet active (classe `is-animating`) au `slideChange`. | Synchronise l'animation visuelle de la bullet avec l'autoplay. |
| `parseSwiperSpeed(section)` | Lit `data-sw-speed="desktop[, mobile]"` → `{ desktop, mobile }` (en ms). | Permet de régler l'autoplay par breakpoint depuis Webflow, sans toucher au JS. `0` = autoplay désactivé. |

### 3.2 Pattern partagé par tous les swipers

Chaque `Init_Swiper_*` suit la **même structure** — la comprendre une fois suffit :

1. Trouver la `section` (`[data-sw="…"]`) ; sortir si absente (guard).
2. Récupérer `slider`, `slides`, `prev/next`, `pagination` via `data-sw="…"`.
3. Ajouter les classes Swiper requises (`swiper`, `swiper-wrapper`, `swiper-slide`).
4. Lire les vitesses via `parseSwiperSpeed`.
5. `buildConfig(isDesktop)` : construit la config Swiper, **différente desktop/mobile**.
6. `updateSwiper(e)` : **détruit l'instance existante** (`destroy(true, true)`) et **recrée** une instance avec la bonne config, puis rebranche la pagination animée.
7. `matchMedia("(min-width: 768px)")` + `addEventListener("change", updateSwiper)` : reconstruit le swiper au franchissement du breakpoint.

> La reconstruction complète au changement de breakpoint (plutôt qu'un `update()`) est volontaire : elle garantit que les configs desktop/mobile (effets, espacement, centrage) soient appliquées proprement.

### 3.3 Spécificités par swiper

| Fonction | Sélecteur | Particularités |
|---|---|---|
| `Init_Swiper_1` | `[data-sw="swiper-1"]` | `loop`, `centeredSlides: true`. Desktop = effet `slide` ; mobile = effet `creative` (cartes empilées). Espace : 8 px desktop / **0** mobile. |
| `Init_Swiper_2` | `[data-sw="swiper-2"]` | Idem Swiper 1 mais espace **8 px mobile**. **C'est ici qu'on veut centrer la slide 2 (et pas la 1) au load** — voir note ci-dessous. |
| `InitSwiperInvestir` | `[data-sw="investir"]` | Section **unique** (pas de `forEach`). Effet `fade` + `crossFade`. |
| `Init_Swiper_4` | `[data-sw="swiper-4"]` | Comme Swiper 1, espace **168 px desktop** / 8 px mobile. |
| `InitSwiperKOL` | `[data-sw="kol"]` | `loop`, `loopedSlides`, `centeredSlides: true`. `touchEnd` relance l'autoplay s'il s'est arrêté. **Init différée de 150 ms** (délai iOS Safari, voir note). |
| `InitSwiperLevees` | `[data-sw="levees"]` | `loop`, `loopedSlides`. **`centeredSlides` géré par `breakpoints`** : `true` < 769 px, `false` ≥ 769 px. |
| `InitSwiperMembres` | `[data-sw="membres"]` | Espace 32 px. `centeredSlides: !isDesktop` (centré seulement en mobile). |
| `InitSwiperTrustpilot` | `[data-sw="trustpilot"]` | `centeredSlides: false`, `loopedSlides`, `watchSlidesProgress`. |

#### `initAllSwipers()`

Lance chaque swiper **seulement si son `data-sw` est présent** sur la page :

```js
[data-sw="swiper-1"]  → Init_Swiper_1()
[data-sw="swiper-2"]  → Init_Swiper_2()
[data-sw="investir"]  → InitSwiperInvestir()
[data-sw="swiper-4"]  → Init_Swiper_4()
[data-sw="kol"]       → InitSwiperKOL()
[data-sw="levees"]    → InitSwiperLevees()
[data-sw="membres"]   → InitSwiperMembres()
[data-sw="trustpilot"]→ InitSwiperTrustpilot()
```

#### Notes techniques importantes

- **Centrer une autre slide que la 1ʳᵉ au load (Swiper 2)** : ne **pas** utiliser `initialSlide` — il casse `centeredSlides` en mode `loop` (calcul des clones). La méthode fiable est `currentSwiper.slideToLoop(index, 0, false)` **après l'init**, dans `updateSwiper`, **après** `setupSwiperPagination`. (Les slides venant d'une collection CMS, on ne peut pas réordonner le DOM.)
- **Délai iOS Safari (KOL)** : l'init est enveloppée dans un `setTimeout(…, 150)` pour laisser le DOM se peindre avant l'init Swiper sur iOS — exception assumée à la règle « pas de setTimeout fixe ».

---

## 4. Mémo de debug console

Fonctions exposées sur `window` (appelables directement dans la console) :

```
window.TypeformManager.openTf({ role, email })
window.initTagsAnimateOnMap()
window.AutoRotateFakeTabs()
window.initMapRotator()
window.raisesIndex          // l'index courant des levées
window.modal                // l'élément modal levées actif
```

Les autres fonctions (`animateElements`, `initCardBlurTabs`, `initMagneticEffect`, `initVimeoLightboxAdvanced`, `initParallaxLayers`, `initMobileTooltips`, `autoTabsProgress`, `autoTabsOpacity`, et tous les `Init_Swiper_*`) sont déclarées au niveau racine du fichier : elles sont appelables tant que le fichier n'est pas servi en `type="module"` (cas jsDelivr actuel avec `defer`).

---

## 5. Points à améliorer (bonnes pratiques)

Honnêtement, quelques dettes techniques à garder en tête :

1. **Double init de `initMobileTooltips`** (DOMContentLoaded + `initPageScripts`) → garder un seul point d'entrée.
2. **`MutationObserver` sur `document.body`** dans la modal → restreindre au conteneur Finsweet (`[fs-list-element="list"]`) pour réduire le coût mobile.
3. **`console.log` de trace** encore présents (Tooltip, Vimeo) → à retirer en prod ou à passer derrière un flag debug.
4. **Stratégie d'init éclatée** (immédiat / DOMContentLoaded / initPageScripts / window.load) → fonctionnelle mais difficile à suivre ; à terme, centraliser dans un seul orchestrateur conditionnel comme `initPageScripts`.
5. Penser à **mettre à jour la date `📆 UPDATE`** et à bumper le tag jsDelivr (ou purger `@main`) à chaque déploiement.
