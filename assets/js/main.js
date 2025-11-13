const LANG_CONFIG = {
  zh: { file: "content.zh.json", htmlLang: "zh-TW" },
  en: { file: "content.en.json", htmlLang: "en" },
  ja: { file: "content.ja.json", htmlLang: "ja" },
  ko: { file: "content.ko.json", htmlLang: "ko" }
};

const BRAND_IMAGE_SRC = "assets/img/qyj-logo.png";

const state = {
  currentLang: sessionStorage.getItem("qiYuanLang") || "zh",
  cache: new Map(),
  navLinks: [],
  observers: {
    section: null,
    animation: null
  }
};

const selectors = {
  brandMark: document.querySelector(".brand__mark"),
  brandName: document.querySelector('[data-slot="brandName"]'),
  navToggleLabel: document.querySelector('[data-slot="navToggleLabel"]'),
  headerCta: document.querySelector('[data-slot="headerCta"]'),
  navList: document.querySelector('[data-slot="navList"]'),
  hero: {
    eyebrow: document.querySelector('[data-slot="hero.eyebrow"]'),
    title: document.querySelector('[data-slot="hero.title"]'),
    subtitle: document.querySelector('[data-slot="hero.subtitle"]'),
    primary: document.querySelector('[data-slot="hero.primaryCta"]'),
    secondary: document.querySelector('[data-slot="hero.secondaryCta"]'),
    highlights: document.querySelector('[data-slot="hero.highlights"]')
  },
  pillars: {
    eyebrow: document.querySelector('#pillars .eyebrow'),
    title: document.querySelector('#pillars .section__title'),
    subtitle: document.querySelector('#pillars .section__subtitle'),
    items: document.querySelector('[data-slot="pillars.items"]')
  },
  story: {
    title: document.querySelector('[data-slot="story.title"]'),
    paragraphs: document.querySelector('[data-slot="story.paragraphs"]'),
    quote: document.querySelector('[data-slot="story.blockquote"]')
  },
  chapters: {
    eyebrow: document.querySelector('[data-slot="chapters.eyebrow"]'),
    title: document.querySelector('[data-slot="chapters.title"]'),
    subtitle: document.querySelector('[data-slot="chapters.subtitle"]'),
    parts: document.querySelector('[data-slot="chapters.parts"]')
  },
  cta: {
    title: document.querySelector('[data-slot="cta.title"]'),
    subtitle: document.querySelector('[data-slot="cta.subtitle"]'),
    primary: document.querySelector('[data-slot="cta.primary"]'),
    secondary: document.querySelector('[data-slot="cta.secondary"]')
  },
  footer: {
    copyright: document.querySelector('[data-slot="footer.copyright"]'),
    links: document.querySelector('[data-slot="footer.links"]')
  },
  langButtons: Array.from(document.querySelectorAll('.lang-switcher button')),
  navToggle: document.querySelector('[data-action="toggle-nav"]'),
  nav: document.querySelector('.primary-nav'),
  animateSections: Array.from(document.querySelectorAll('[data-animate]')),
  spotifyEmbed: document.querySelector('[data-role="spotify-embed"]'),
  chaptersLoading: document.querySelector('[data-role="chapters-loading"]')
};

async function fetchContent(lang) {
  const config = LANG_CONFIG[lang];
  if (!config) {
    throw new Error(`Unsupported language: ${lang}`);
  }
  if (state.cache.has(lang)) {
    return state.cache.get(lang);
  }
  const response = await fetch(`assets/data/${config.file}`, { cache: "no-cache" });
  if (!response.ok) {
    throw new Error(`Failed to load content for ${lang}: ${response.status}`);
  }
  const data = await response.json();
  state.cache.set(lang, data);
  return data;
}

function updateMeta(meta, lang) {
  document.documentElement.lang = LANG_CONFIG[lang].htmlLang;
  if (meta?.title) {
    document.title = meta.title;
    setMetaTag('meta[property="og:title"]', meta.title, "property");
  }
  if (meta?.description) {
    setMetaTag('meta[name="description"]', meta.description);
    setMetaTag('meta[property="og:description"]', meta.description, "property");
  }
  if (meta?.keywords?.length) {
    setMetaTag('meta[name="keywords"]', meta.keywords.join(","));
  }
}

function setMetaTag(selector, value, attr = "name") {
  let tag = document.querySelector(selector);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, selector.match(/"(.*?)"/)?.[1] ?? "");
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", value);
}

function renderHeader(header) {
  if (!header) return;
  if (selectors.brandName) selectors.brandName.textContent = header.brand ?? "";
  if (selectors.navToggleLabel) {
    selectors.navToggleLabel.textContent = header.navToggleLabel ?? "";
  }
  if (selectors.navToggle) {
    selectors.navToggle.setAttribute("aria-label", header.navToggleLabel ?? "Toggle main menu");
  }

  if (selectors.navList) {
    selectors.navList.innerHTML = "";
    state.navLinks = (header.nav ?? []).map(({ label, target }) => {
      const li = document.createElement("li");
      const link = document.createElement("a");
      link.className = "primary-nav__link";
      link.href = target ?? "#";
      link.textContent = label ?? "";
      link.dataset.target = target ?? "";
      link.addEventListener("click", handleNavClick);
      li.appendChild(link);
      selectors.navList.appendChild(li);
      return link;
    });
  }

  if (selectors.headerCta) {
    selectors.headerCta.textContent = header.cta?.label ?? "Contact";
    selectors.headerCta.href = header.cta?.href ?? "#";
  }
}

function handleNavClick() {
  closeNav();
}

function updateBrandMark(lang) {
  const mark = selectors.brandMark;
  if (!mark) return;

  if (!mark.classList.contains("brand__mark--image")) {
    mark.classList.add("brand__mark--image");
  }

  const existingImage = mark.querySelector("img");
  if (!existingImage || existingImage.getAttribute("src") !== BRAND_IMAGE_SRC) {
    mark.innerHTML = "";
    const img = document.createElement("img");
    img.src = BRAND_IMAGE_SRC;
    img.alt = "";
    mark.appendChild(img);
  }
}

function renderHero(hero) {
  if (!hero) return;
  const { eyebrow, title, subtitle, primary, secondary, highlights } = selectors.hero;
  if (eyebrow) eyebrow.textContent = hero.eyebrow ?? "";
  if (title) title.textContent = hero.title ?? "";
  if (subtitle) subtitle.textContent = hero.subtitle ?? "";
  if (primary) {
    primary.textContent = hero.primaryCta?.label ?? "";
    primary.href = hero.primaryCta?.href ?? "#";
  }
  if (secondary) {
    secondary.textContent = hero.secondaryCta?.label ?? "";
    secondary.href = hero.secondaryCta?.href ?? "#";
  }
  if (highlights) {
    highlights.innerHTML = "";
    (hero.highlights ?? []).forEach(item => {
      const card = document.createElement("article");
      card.className = "hero__card";
      const heading = document.createElement("h3");
      heading.textContent = item.title ?? "";
      const desc = document.createElement("p");
      desc.textContent = item.description ?? "";
      card.append(heading, desc);
      highlights.appendChild(card);
    });
  }
}

function renderPillars(pillars) {
  if (!pillars) return;
  const { eyebrow, title, subtitle, items } = selectors.pillars;
  if (eyebrow) eyebrow.textContent = pillars.eyebrow ?? pillars.title ?? "";
  if (title) title.textContent = pillars.title ?? "Pillars";
  if (subtitle) subtitle.textContent = pillars.subtitle ?? "";
  if (items) {
    items.innerHTML = "";
    (pillars.items ?? []).forEach(item => {
      const card = document.createElement("article");
      card.className = "pillar-card";
      const heading = document.createElement("h3");
      heading.textContent = item.title ?? "";
      const desc = document.createElement("p");
      desc.textContent = item.description ?? "";
      card.append(heading, desc);
      items.appendChild(card);
    });
  }
}

function renderStory(story) {
  if (!story) return;
  if (selectors.story.title) selectors.story.title.textContent = story.title ?? "";
  if (selectors.story.paragraphs) {
    selectors.story.paragraphs.innerHTML = "";
    (story.paragraphs ?? []).forEach(text => {
      const p = document.createElement("p");
      p.textContent = text;
      selectors.story.paragraphs.appendChild(p);
    });
  }
  if (selectors.story.quote) {
    selectors.story.quote.textContent = story.blockquote ?? "";
  }
}

function renderChapters(chapters) {
  if (!chapters) return;
  if (selectors.chapters.eyebrow) {
    selectors.chapters.eyebrow.textContent = chapters.eyebrow ?? chapters.title ?? "";
  }
  if (selectors.chapters.title) selectors.chapters.title.textContent = chapters.title ?? "";
  if (selectors.chapters.subtitle) selectors.chapters.subtitle.textContent = chapters.subtitle ?? "";

  if (selectors.chapters.parts) {
    selectors.chapters.parts.innerHTML = "";
    toggleChaptersLoading(true);
    (chapters.parts ?? []).forEach(part => {
      const partCard = document.createElement("article");
      partCard.className = "part-card";
      const header = document.createElement("div");
      header.className = "part-card__header";

      const eyebrow = document.createElement("span");
      eyebrow.className = "part-card__eyebrow";
      eyebrow.textContent = part.label ?? "";

      const title = document.createElement("h3");
      title.className = "part-card__title";
      title.textContent = part.title ?? "";

      const desc = document.createElement("p");
      desc.className = "part-card__description";
      desc.textContent = part.description ?? "";

      header.append(eyebrow, title, desc);
      const chapterGrid = document.createElement("div");
      chapterGrid.className = "chapter-grid";

      (part.chapters ?? []).forEach(ch => {
        const card = document.createElement("article");
        card.className = "chapter-card";
        const heading = document.createElement("h3");
        heading.className = "chapter-card__title";
        heading.textContent = ch.title ?? "";
        const summary = document.createElement("p");
        summary.className = "chapter-card__summary";
        summary.textContent = ch.summary ?? "";
        const excerpt = document.createElement("p");
        excerpt.className = "chapter-card__excerpt";
        excerpt.textContent = ch.excerpt ?? "";
        card.append(heading, summary, excerpt);
        chapterGrid.appendChild(card);
      });

      partCard.append(header, chapterGrid);
      selectors.chapters.parts.appendChild(partCard);
    });
    toggleChaptersLoading(false);
  }
}

function renderCta(cta) {
  if (!cta) return;
  if (selectors.cta.title) selectors.cta.title.textContent = cta.title ?? "";
  if (selectors.cta.subtitle) selectors.cta.subtitle.textContent = cta.subtitle ?? "";
  if (selectors.cta.primary) {
    selectors.cta.primary.textContent = cta.primary?.label ?? "";
    selectors.cta.primary.href = cta.primary?.href ?? "#";
  }
  if (selectors.cta.secondary) {
    selectors.cta.secondary.textContent = cta.secondary?.label ?? "";
    selectors.cta.secondary.href = cta.secondary?.href ?? "#";
    if (cta.secondary?.target) {
      selectors.cta.secondary.target = cta.secondary.target;
    }
  }
}

function renderFooter(footer) {
  if (!footer) return;
  if (selectors.footer.copyright) {
    selectors.footer.copyright.textContent = footer.copyright ?? "";
  }
  if (selectors.footer.links) {
    selectors.footer.links.innerHTML = "";
    (footer.links ?? []).forEach(link => {
      const anchor = document.createElement("a");
      anchor.href = link.href ?? "#";
      anchor.textContent = link.label ?? "";
      anchor.target = "_blank";
      anchor.rel = "noopener";
      selectors.footer.links.appendChild(anchor);
    });
  }
}

async function setLanguage(lang) {
  const fallback = "zh";
  const targetLang = LANG_CONFIG[lang] ? lang : fallback;
  try {
    toggleChaptersLoading(true);
    const data = await fetchContent(targetLang);
    updateMeta(data.meta, targetLang);
    renderHeader(data.header);
    renderHero(data.hero);
    renderPillars(data.pillars);
    renderStory(data.story);
    renderChapters(data.chapters);
    renderCta(data.cta);
    renderFooter(data.footer);
    updateBrandMark(targetLang);
    updateLocalizedEmbeds(targetLang);
    highlightLangButton(targetLang);
    sessionStorage.setItem("qiYuanLang", targetLang);
    state.currentLang = targetLang;
    refreshObservers();
    updateResponsiveNav();
  } catch (error) {
    console.error(error);
    if (targetLang !== fallback) {
      await setLanguage(fallback);
    }
  } finally {
    toggleChaptersLoading(false);
  }
}

function highlightLangButton(lang) {
  selectors.langButtons.forEach(btn => {
    btn.classList.toggle("is-active", btn.dataset.lang === lang);
  });
}

function initLanguageSwitcher() {
  selectors.langButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const lang = btn.dataset.lang;
      if (lang && lang !== state.currentLang) {
        setLanguage(lang);
      }
    });
  });
}

function initNavToggle() {
  if (!selectors.navToggle || !selectors.nav) return;
  selectors.navToggle.addEventListener("click", () => {
    const expanded = selectors.navToggle.getAttribute("aria-expanded") === "true";
    selectors.navToggle.setAttribute("aria-expanded", String(!expanded));
    selectors.navToggle.classList.toggle("is-active", !expanded);
    selectors.nav.classList.toggle("is-open", !expanded);
  });

  document.addEventListener("click", event => {
    if (!selectors.nav.classList.contains("is-open")) return;
    const isToggleClick = selectors.navToggle.contains(event.target);
    if (!selectors.nav.contains(event.target) && !isToggleClick) {
      closeNav();
    }
  });

  updateResponsiveNav();
}

function closeNav() {
  if (!selectors.navToggle || !selectors.nav) return;
  selectors.navToggle.setAttribute("aria-expanded", "false");
  selectors.navToggle.classList.remove("is-active");
  selectors.nav.classList.remove("is-open");
}

function refreshObservers() {
  setupAnimateObserver();
  setupSectionObserver();
  requestAnimationFrame(revealVisibleSections);
}

function setupAnimateObserver() {
  if (state.observers.animation) {
    state.observers.animation.disconnect();
  }
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) {
    selectors.animateSections.forEach(section => section.classList.add("is-visible"));
    return;
  }
  state.observers.animation = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.25 });

  selectors.animateSections.forEach(section => state.observers.animation.observe(section));
  revealVisibleSections();
}

function setupSectionObserver() {
  if (state.observers.section) {
    state.observers.section.disconnect();
  }
  const sections = Array.from(document.querySelectorAll("main section")).filter(section => section.id);
  if (!sections.length || !state.navLinks.length) return;

  state.observers.section = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = `#${entry.target.id}`;
        state.navLinks.forEach(link => {
          link.classList.toggle("is-active", link.dataset.target === id);
        });
      }
    });
  }, { threshold: 0.6 });

  sections.forEach(section => state.observers.section.observe(section));
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", event => {
      const targetId = anchor.getAttribute("href");
      const targetElement = targetId && document.querySelector(targetId);
      if (targetElement) {
        event.preventDefault();
        targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
}

function init() {
  initLanguageSwitcher();
  initNavToggle();
  initSmoothScroll();
  setLanguage(state.currentLang);
  window.addEventListener("load", revealVisibleSections);
  window.addEventListener("resize", () => requestAnimationFrame(revealVisibleSections));
  window.addEventListener("resize", () => requestAnimationFrame(updateResponsiveNav));
  window.addEventListener("orientationchange", () => requestAnimationFrame(updateResponsiveNav));
}

document.addEventListener("DOMContentLoaded", init);

function revealVisibleSections() {
  selectors.animateSections.forEach(section => {
    const rect = section.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      section.classList.add("is-visible");
    }
  });
}

function updateLocalizedEmbeds(lang) {
  if (!selectors.spotifyEmbed) return;
  const visibleFor = (selectors.spotifyEmbed.dataset.langVisible || "all")
    .split(",")
    .map(value => value.trim())
    .filter(Boolean);
  const shouldShow = visibleFor.includes("all") || visibleFor.includes(lang);
  selectors.spotifyEmbed.classList.toggle("is-active", shouldShow);
  selectors.spotifyEmbed.setAttribute("aria-hidden", shouldShow ? "false" : "true");
}

function toggleChaptersLoading(show) {
  if (!selectors.chaptersLoading) return;
  selectors.chaptersLoading.classList.toggle("is-active", Boolean(show));
  selectors.chaptersLoading.setAttribute("aria-hidden", show ? "false" : "true");
}

function updateResponsiveNav() {
  if (!selectors.nav || !selectors.navToggle) return;
  const toggleVisible = window.getComputedStyle(selectors.navToggle).display !== "none";
  if (!toggleVisible) {
    selectors.nav.classList.add("is-open");
    selectors.navToggle.setAttribute("aria-expanded", "true");
    selectors.navToggle.classList.remove("is-active");
  } else if (!selectors.navToggle.classList.contains("is-active")) {
    selectors.nav.classList.remove("is-open");
    selectors.navToggle.setAttribute("aria-expanded", "false");
  }
}

