/**
 * Clean Reader site — Wero-style motion system.
 * Lenis smooth scroll + GSAP ScrollTrigger.
 * Three signature animations:
 *   1. Hero intro — headline lines rise from clipped masks, badge pops, hands slide up.
 *   2. Statement — word-by-word scrubbed reveal + paper plane flies across on scroll.
 *   3. Statement block — simple scroll reveal (no concentric rings).
 * Plus: top progress bar, sticky logo pill state, tilted card deck, FAQ highlight
 * wipe, dock scrollspy. All motion disabled under prefers-reduced-motion.
 */
(function () {
  "use strict";

  var reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  ready(function () {
    var hasGsap =
      typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";
    var lenis = null;

    /* ---------- Lenis + GSAP wiring ---------- */
    if (!reduceMotion && typeof Lenis !== "undefined") {
      lenis = new Lenis({
        duration: 1.15,
        easing: function (t) {
          return Math.min(1, 1.001 - Math.pow(2, -10 * t));
        },
        smoothWheel: true,
      });
      if (hasGsap) {
        lenis.on("scroll", ScrollTrigger.update);
        gsap.ticker.add(function (time) {
          lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);
      } else {
        var raf = function (time) {
          lenis.raf(time);
          requestAnimationFrame(raf);
        };
        requestAnimationFrame(raf);
      }
    }

    /* ---------- anchor clicks scroll smoothly through Lenis ---------- */
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        if (id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        if (lenis) {
          lenis.scrollTo(target, { offset: 0 });
        } else {
          target.scrollIntoView({ behavior: "smooth" });
        }
      });
    });

    /* ---------- sticky logo pill state ---------- */
    var topbar = document.querySelector(".topbar");
    function onScrollTopbar() {
      if (!topbar) return;
      topbar.classList.toggle("is-stuck", window.scrollY > 40);
    }
    onScrollTopbar();
    window.addEventListener("scroll", onScrollTopbar, { passive: true });
    if (lenis) lenis.on("scroll", onScrollTopbar);

    if (!hasGsap || reduceMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    /* ---------- top progress bar ---------- */
    var bar = document.querySelector(".progress__bar");
    if (bar) {
      gsap.to(bar, {
        scaleX: 1,
        ease: "none",
        scrollTrigger: { start: 0, end: "max", scrub: 0.3 },
      });
    }

    /* ============================================================
       1. HERO INTRO
       ============================================================ */
    var heroLines = gsap.utils.toArray(".hero-title .line > span");
    if (heroLines.length) {
      gsap.fromTo(
        heroLines,
        { yPercent: 112 },
        {
          yPercent: 0,
          duration: 1.05,
          ease: "power4.out",
          stagger: 0.11,
          delay: 0.15,
        }
      );
    }
    var badge = document.querySelector(".badge");
    if (badge) {
      gsap.fromTo(
        badge,
        { scale: 0, rotate: -30 },
        { scale: 1, rotate: 9, duration: 0.8, ease: "back.out(1.8)", delay: 0.75 }
      );
    }
    gsap.utils.toArray(".hand").forEach(function (hand, i) {
      /* entrance only — hands then scroll away with the hero as one unit,
         like the reference. A scroll parallax here leaves chopped fingertips
         at the section seam, so deliberately none. */
      gsap.fromTo(
        hand,
        { yPercent: 100 },
        {
          yPercent: 0,
          duration: 1.1,
          ease: "power3.out",
          delay: 0.5 + i * 0.12,
        }
      );
    });
    var scrollPill = document.querySelector(".scroll-pill");
    if (scrollPill) {
      gsap.fromTo(
        scrollPill,
        { opacity: 0, y: 22 },
        { opacity: 1, y: 0, duration: 0.7, ease: "power2.out", delay: 1.05, clearProps: "transform" }
      );
      /* fade out as the hero leaves so it never collides with the logo pill */
      gsap.to(scrollPill, {
        autoAlpha: 0,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "12% top",
          end: "38% top",
          scrub: true,
        },
      });
    }

    /* ============================================================
       2. STATEMENT — scrubbed word reveal + plane flight
       ============================================================ */
    var statementText = document.querySelector(".js-words");
    if (statementText) {
      /* wrap each word in a span, keeping the inline sticker in place */
      var nodes = Array.prototype.slice.call(statementText.childNodes);
      nodes.forEach(function (node) {
        if (node.nodeType === 3) {
          var words = node.textContent.split(/\s+/).filter(Boolean);
          var frag = document.createDocumentFragment();
          words.forEach(function (w) {
            var s = document.createElement("span");
            s.className = "w";
            s.textContent = w;
            frag.appendChild(s);
          });
          statementText.replaceChild(frag, node);
        }
      });
      var words = statementText.querySelectorAll(".w");
      gsap.to(words, {
        opacity: 1,
        ease: "none",
        stagger: 0.06,
        scrollTrigger: {
          trigger: ".statement",
          start: "top 72%",
          end: "center 45%",
          scrub: 0.4,
        },
      });
      var sticker = statementText.querySelector(".statement__sticker");
      if (sticker) {
        gsap.fromTo(
          sticker,
          { scale: 0, rotate: -40 },
          {
            scale: 1,
            rotate: -7,
            ease: "back.out(2)",
            scrollTrigger: {
              trigger: ".statement",
              start: "top 55%",
              toggleActions: "play none none none",
            },
          }
        );
      }
    }
    var plane = document.querySelector(".statement__plane");
    if (plane) {
      gsap.fromTo(
        plane,
        { x: "-14vw", y: "8vh", rotate: -8 },
        {
          x: "86vw",
          y: "-34vh",
          rotate: 14,
          ease: "none",
          scrollTrigger: {
            trigger: ".statement",
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );
    }

    /* ============================================================
       3. STATEMENT BLOCK — simple reveal (no concentric rings)
       ============================================================ */
    var statementBlock = document.querySelector(".statement-block__inner");
    if (statementBlock) {
      gsap.fromTo(
        statementBlock,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".statement-block",
            start: "top 78%",
            toggleActions: "play none none none",
          },
        }
      );
    }

    /* how steps rise */
    gsap.utils.toArray(".step").forEach(function (step, i) {
      gsap.fromTo(
        step,
        { y: 36, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power2.out",
          delay: (i % 3) * 0.08,
          scrollTrigger: {
            trigger: step,
            start: "top 90%",
            toggleActions: "play none none none",
          },
        }
      );
    });

    /* ---------- tilted card deck ---------- */
    gsap.utils.toArray(".card").forEach(function (card, i) {
      var tilt = i % 2 === 0 ? -4 : 4.5;
      gsap.fromTo(
        card,
        { y: 130, rotate: tilt * 2.6, opacity: 0 },
        {
          y: 0,
          rotate: tilt,
          opacity: 1,
          duration: 0.85,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top 88%",
            toggleActions: "play none none none",
          },
        }
      );
    });

    /* ---------- steps rise ---------- */
    gsap.utils.toArray(".step").forEach(function (step, i) {
      gsap.fromTo(
        step,
        { y: 44, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power2.out",
          delay: (i % 3) * 0.06,
          scrollTrigger: {
            trigger: step,
            start: "top 92%",
            toggleActions: "play none none none",
          },
        }
      );
    });

    /* ---------- FAQ big question + highlight wipe ---------- */
    var bigq = document.querySelector(".faq__bigq");
    if (bigq) {
      gsap.fromTo(
        bigq,
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: bigq,
            start: "top 82%",
            toggleActions: "play none none none",
          },
        }
      );
      var hl = bigq.querySelector(".hl");
      if (hl) {
        /* animate the ::before wipe via CSS variable-free approach: a real span overlay */
        gsap.fromTo(
          hl,
          { "--wipe": 0 },
          {
            "--wipe": 1,
            scrollTrigger: {
              trigger: bigq,
              start: "top 70%",
              toggleActions: "play none none none",
            },
            onStart: function () {
              hl.classList.add("is-on");
            },
          }
        );
      }
    }

    /* ---------- wordmark + bento entrance ---------- */
    var wordmark = document.querySelector(".wordmark");
    if (wordmark) {
      gsap.fromTo(
        wordmark,
        { yPercent: 46, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: wordmark,
            start: "top 94%",
            toggleActions: "play none none none",
          },
        }
      );
    }
    var bentoTiles = gsap.utils.toArray(".bento a");
    if (bentoTiles.length) {
      gsap.fromTo(
        bentoTiles,
        { y: 34, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.07,
          scrollTrigger: {
            trigger: ".bento",
            start: "top 90%",
            toggleActions: "play none none none",
          },
        }
      );
    }

    /* ---------- inner-page hero + prose reveals ---------- */
    gsap.utils.toArray(".page-hero .hero-line, .page-hero .hero-fade").forEach(
      function (el, i) {
        gsap.fromTo(
          el,
          { y: 34, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", delay: 0.1 + i * 0.09 }
        );
      }
    );
    gsap.utils.toArray(".prose .reveal").forEach(function (el) {
      gsap.fromTo(
        el,
        { y: 26, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 94%",
            toggleActions: "play none none none",
          },
          immediateRender: false,
        }
      );
    });

    /* ---------- dock scrollspy ---------- */
    var dockLinks = document.querySelectorAll(".dock a[data-spy]");
    dockLinks.forEach(function (link) {
      var section = document.getElementById(link.getAttribute("data-spy"));
      if (!section) return;
      ScrollTrigger.create({
        trigger: section,
        start: "top center",
        end: "bottom center",
        onToggle: function (self) {
          if (self.isActive) {
            dockLinks.forEach(function (l) { l.classList.remove("is-active"); });
            link.classList.add("is-active");
          }
        },
      });
    });

    /* ---------- safety: refresh after fonts/layout settle ---------- */
    window.addEventListener("load", function () {
      ScrollTrigger.refresh();
    });
  });
})();
