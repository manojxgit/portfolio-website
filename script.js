/**
 * Automotive-inspired portfolio — loader, particles, parallax,
 * reveals, tilt cards, typing, nav state, accessibility-aware motion.
 */

(function () {
  "use strict";

  var reducedMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** Elements */
  var loader = document.getElementById("page-loader");
  var cursorGlow = document.getElementById("cursor-glow");
  var navShell = document.querySelector(".nav-shell");
  var navProgress = document.getElementById("nav-progress-fill");
  var navBurger = document.getElementById("nav-burger");
  var navMenu = document.getElementById("nav-menu");
  var navItems = document.querySelectorAll(".nav-item");
  var parallaxWrap = document.getElementById("parallax-bg");
  var canvas = document.getElementById("particles-canvas");
  var timelineTrack = document.getElementById("timeline-track");
  var toTopBtn = document.getElementById("to-top");
  var typingEl = document.getElementById("typing-text");
  var contactForm = document.getElementById("contact-form");
  var formNote = document.getElementById("form-note");

  /** Utility */
  function clamp(v, lo, hi) {
    return Math.min(hi, Math.max(lo, v));
  }

  /* ------------------------------------------------------------------ */
  /* Loader                                                             */
  /* ------------------------------------------------------------------ */

  document.body.classList.add("loading");

  function finalizeIntro() {
    document.body.classList.add("intro-done");
    if (navShell) {
      navShell.classList.add("visible");
    }
  }

  function dismissLoader() {
    document.body.classList.remove("loading");
    finalizeIntro();
    if (loader) {
      loader.classList.add("is-done");
      window.setTimeout(function () {
        if (loader && loader.parentNode) {
          loader.parentNode.removeChild(loader);
        }
      }, 750);
    } else {
      finalizeIntro();
    }
  }

  var loaderHold = reducedMotion ? 280 : 1100;

  window.addEventListener("load", function () {
    window.setTimeout(dismissLoader, loaderHold);
  });

  /* ------------------------------------------------------------------ */
  /* Cursor glow (fine pointers only)                                   */
  /* ------------------------------------------------------------------ */

  var coarse =
    window.matchMedia && window.matchMedia("(pointer: coarse)").matches;

  if (
    cursorGlow &&
    window.matchMedia &&
    window.matchMedia("(hover: hover)").matches &&
    !coarse
  ) {
    document.documentElement.classList.add("has-pointer-glow");

    window.addEventListener(
      "pointermove",
      function (event) {
        cursorGlow.style.left = event.clientX + "px";
        cursorGlow.style.top = event.clientY + "px";
        document.documentElement.classList.add("cursor-active");
      },
      { passive: true }
    );

    document.documentElement.addEventListener(
      "pointerleave",
      function () {
        document.documentElement.classList.remove("cursor-active");
      },
      { passive: true }
    );
  }

  /* ------------------------------------------------------------------ */
  /* Scroll progress + navbar + timeline rail                           */
  /* ------------------------------------------------------------------ */

  function onScrollUi() {
    var root = document.documentElement;
    var max = root.scrollHeight - window.innerHeight;
    var r = max > 0 ? root.scrollTop / max : 0;

    if (navProgress) {
      navProgress.style.width = (clamp(r, 0, 1) * 100).toFixed(2) + "%";
    }

    if (navShell) {
      navShell.classList.toggle("scrolled", window.scrollY > 28);
    }

    if (toTopBtn) {
      toTopBtn.classList.toggle("visible", window.scrollY > 560);
    }

    if (timelineTrack) {
      var rect = timelineTrack.getBoundingClientRect();
      var vh = window.innerHeight;
      var start = vh * 0.22;
      var span = rect.height + vh * 0.35;
      var progress = (vh - rect.top - start) / span;
      timelineTrack.style.setProperty(
        "--line-scale",
        clamp(progress, 0, 1).toFixed(3)
      );
    }
  }

  window.addEventListener("scroll", onScrollUi, { passive: true });
  onScrollUi();

  /* ------------------------------------------------------------------ */
  /* Mobile nav                                                         */
  /* ------------------------------------------------------------------ */

  if (navBurger && navMenu) {
    navBurger.addEventListener("click", function () {
      var open = navMenu.classList.toggle("open");
      navBurger.setAttribute("aria-expanded", open ? "true" : "false");
      navBurger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });

    navItems.forEach(function (link) {
      link.addEventListener("click", function () {
        navMenu.classList.remove("open");
        navBurger.setAttribute("aria-expanded", "false");
        navBurger.setAttribute("aria-label", "Open menu");
      });
    });
  }

  var sectionIds = [
    "hero",
    "about",
    "skills",
    "projects",
    "timeline",
    "contact",
  ];

  var sectionElems = sectionIds
    .map(function (id) {
      return document.getElementById(id);
    })
    .filter(Boolean);

  if ("IntersectionObserver" in window && sectionElems.length && navItems.length) {
    var navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;

          var id = entry.target.id;

          navItems.forEach(function (item) {
            item.classList.toggle(
              "active",
              item.getAttribute("data-section") === id
            );
          });
        });
      },
      {
        threshold: [0.05, 0.2, 0.45],
        rootMargin: "-10% 0px -52% 0px",
      }
    );

    sectionElems.forEach(function (sec) {
      navObserver.observe(sec);
    });
  }

  if (!("IntersectionObserver" in window)) {
    window.addEventListener(
      "scroll",
      function () {
        var closest = sectionIds[0];

        sectionIds.forEach(function (sid) {
          var el = document.getElementById(sid);
          if (!el) return;

          if (el.getBoundingClientRect().top < window.innerHeight * 0.32) {
            closest = sid;
          }
        });

        navItems.forEach(function (item) {
          item.classList.toggle(
            "active",
            item.getAttribute("data-section") === closest
          );
        });
      },
      { passive: true }
    );
  }

  if (toTopBtn) {
    toTopBtn.addEventListener("click", function () {
      window.scrollTo({
        top: 0,
        behavior: reducedMotion ? "auto" : "smooth",
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Parallax background                                                */
  /* ------------------------------------------------------------------ */

  var planes = parallaxWrap
    ? parallaxWrap.querySelectorAll(".parallax-plane")
    : [];

  var targetX = 0;
  var targetY = 0;
  var currX = 0;
  var currY = 0;
  var scrollEase = 0;

  window.addEventListener(
    "pointermove",
    function (event) {
      if (!planes.length || reducedMotion) return;

      targetX = (event.clientX / window.innerWidth - 0.5) * 38;
      targetY = (event.clientY / window.innerHeight - 0.5) * 28;
    },
    { passive: true }
  );

  function animateParallax() {
    currX += (targetX - currX) * 0.045;
    currY += (targetY - currY) * 0.045;

    scrollEase +=
      (document.documentElement.scrollTop * -0.04 - scrollEase) * 0.06;

    if (planes[0]) {
      planes[0].style.transform =
        "translate3d(" +
        (-currX * 0.3).toFixed(2) +
        "px," +
        (-currY * 0.25 + scrollEase * 0.5).toFixed(2) +
        "px,0)";
    }

    if (planes[1]) {
      planes[1].style.transform =
        "translate3d(" +
        (currX * 0.2).toFixed(2) +
        "px," +
        (currY * 0.35 + scrollEase * 0.25).toFixed(2) +
        "px,0)";
    }

    if (planes[2]) {
      planes[2].style.transform =
        "translate3d(" +
        (currX * 0.06).toFixed(2) +
        "px," +
        (scrollEase * -0.2).toFixed(2) +
        "px,0)";
    }

    window.requestAnimationFrame(animateParallax);
  }

  if (planes.length && !reducedMotion) {
    window.requestAnimationFrame(animateParallax);
  }

  /* ------------------------------------------------------------------ */
  /* Particle field                                                     */
  /* ------------------------------------------------------------------ */

  if (canvas && canvas.getContext && !reducedMotion) {
    var ctx = canvas.getContext("2d");
    var parts = [];

    function sizeCanvas() {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
      fillParticles();
    }

    function fillParticles() {
      var count = clamp(Math.floor(window.innerWidth / 28), 32, 80);
      parts = [];

      for (var i = 0; i < count; i += 1) {
        parts.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.45) * 0.42,
          r: Math.random() * 1.1 + 0.35,
        });
      }
    }

    function drawParticles() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.fillStyle = "rgba(208,212,219,0.35)";

      for (var i = 0; i < parts.length; i += 1) {
        var p = parts[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > window.innerWidth) p.vx *= -1;
        if (p.y < 0 || p.y > window.innerHeight) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      window.requestAnimationFrame(drawParticles);
    }

    window.addEventListener(
      "resize",
      function () {
        window.requestAnimationFrame(sizeCanvas);
      },
      { passive: true }
    );

    sizeCanvas();
    window.requestAnimationFrame(drawParticles);
  }

  /* ------------------------------------------------------------------ */
  /* Scroll reveal                                                      */
  /* ------------------------------------------------------------------ */

  var revealItems = document.querySelectorAll("[data-reveal]");

  revealItems.forEach(function (el, index) {
    el.style.setProperty("--delay", Math.min(index, 12) * 70 + "ms");
  });

  if ("IntersectionObserver" in window && revealItems.length) {
    var revealObserver = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in-view");
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );

    revealItems.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Project tilt                                                       */
  /* ------------------------------------------------------------------ */

  var tiltCards = document.querySelectorAll(".tilt-card");

  if (!reducedMotion) {
    tiltCards.forEach(function (card) {
      card.addEventListener("mousemove", function (event) {
        var rect = card.getBoundingClientRect();
        var px = event.clientX - rect.left;
        var py = event.clientY - rect.top;
        var rx = clamp(((py / rect.height) - 0.5) * -10, -8, 8);
        var ry = clamp(((px / rect.width) - 0.5) * 12, -10, 10);

        card.style.transform =
          "perspective(900px) rotateX(" +
          rx.toFixed(2) +
          "deg) rotateY(" +
          ry.toFixed(2) +
          "deg) translateZ(6px)";
      });

      card.addEventListener("mouseleave", function () {
        card.style.transform =
          "perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0)";
      });
    });
  }

  document.querySelectorAll(".btn-primary, .btn-ghost").forEach(function (btn) {
    if (reducedMotion) return;

    btn.addEventListener("pointermove", function (event) {
      var rect = btn.getBoundingClientRect();
      var dx = event.clientX - (rect.left + rect.width / 2);
      var dy = event.clientY - (rect.top + rect.height / 2);

      btn.style.transform =
        "translate3d(" + dx * 0.04 + "px," + dy * 0.04 + "px,0)";
    });

    btn.addEventListener("pointerleave", function () {
      btn.style.transform = "";
    });
  });

  /* ------------------------------------------------------------------ */
  /* Typing effect                                                      */
  /* ------------------------------------------------------------------ */

  if (typingEl) {
    var phrasesTyping = [
      "Designing resilient AI workflows.",
      "Shipping interfaces with velocity and taste.",
      "Performance is the luxury detail.",
      "Every release should feel undeniable.",
    ];

    var pIndexTyping = 0;
    var charIndexTyping = 0;
    var deletingTyping = false;

    function stepTyping() {
      var phrase = phrasesTyping[pIndexTyping];

      if (!deletingTyping) {
        charIndexTyping += 1;
      } else {
        charIndexTyping -= 1;
      }

      typingEl.textContent = phrase.slice(0, charIndexTyping);

      var delayTyping = deletingTyping ? 40 : 70;

      if (!deletingTyping && charIndexTyping === phrase.length) {
        deletingTyping = true;
        delayTyping = 1100;
      } else if (deletingTyping && charIndexTyping === 0) {
        deletingTyping = false;
        pIndexTyping = (pIndexTyping + 1) % phrasesTyping.length;
        delayTyping = 220;
      }

      window.setTimeout(stepTyping, delayTyping);
    }

    if (!reducedMotion) {
      window.setTimeout(stepTyping, 780);
    } else {
      typingEl.textContent = phrasesTyping[0];
    }
  }

  /* ------------------------------------------------------------------ */
  /* Contact form validation + n8n webhook                              */
  /* ------------------------------------------------------------------ */

  if (contactForm && formNote) {
    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();

      var nameEl = contactForm.elements.namedItem("name");
      var emailEl = contactForm.elements.namedItem("email");
      var msgEl = contactForm.elements.namedItem("message");

      [nameEl, emailEl, msgEl].forEach(function (el) {
        if (el && el.classList) {
          el.classList.remove("input-error");
        }
      });

      var ok = true;
      var name = String(nameEl.value).trim();
      var email = String(emailEl.value).trim();
      var msg = String(msgEl.value).trim();

      if (!name) {
        ok = false;
        nameEl.classList.add("input-error");
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        ok = false;
        emailEl.classList.add("input-error");
      }

      if (msg.length < 12) {
        ok = false;
        msgEl.classList.add("input-error");
      }

      if (!ok) {
        formNote.style.color = "#e8a9a9";
        formNote.textContent =
          "Adjust the highlighted fields and try again.";
        return;
      }

      formNote.style.color = "#b8eecb";
      formNote.textContent = "Sending...";

      fetch(
        "https://manojx.app.n8n.cloud/webhook-test/ebfd6cb7-ddeb-4c73-9333-0a8097a2a358",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name,
            email: email,
            message: msg,
          }),
        }
      )
        .then(function (response) {
          if (!response.ok) {
            throw new Error("Webhook failed");
          }
          return response.text();
        })
        .then(function () {
          formNote.style.color = "#b8eecb";
          formNote.textContent =
            "Transmission received — thank you.";
          contactForm.reset();
        })
        .catch(function (error) {
          console.error(error);
          formNote.style.color = "#e8a9a9";
          formNote.textContent =
            "Error sending message. Try again.";
        });
    });
  }
})();
