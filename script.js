(function () {
  "use strict";

  var loader = document.getElementById("pageLoader");
  var progress = document.getElementById("scrollProgress");
  var navToggle = document.getElementById("navToggle");
  var navMenu = document.getElementById("navMenu");
  var contactForm = document.getElementById("contactForm");
  var formNote = document.getElementById("formNote");
  var contactSubmit = document.getElementById("contactSubmit");

  function hideLoader() {
    if (!loader) return;
    loader.classList.add("is-done");
    loader.setAttribute("aria-hidden", "true");
  }

  if (document.readyState === "complete") {
    requestAnimationFrame(function () {
      setTimeout(hideLoader, 280);
    });
  } else {
    window.addEventListener("load", function () {
      setTimeout(hideLoader, 320);
    });
  }

  function updateScrollProgress() {
    if (!progress) return;
    var doc = document.documentElement;
    var scrollTop = doc.scrollTop || document.body.scrollTop;
    var height = doc.scrollHeight - doc.clientHeight;
    var pct = height > 0 ? Math.round((scrollTop / height) * 100) : 0;
    progress.style.width = pct + "%";
    progress.setAttribute("aria-valuenow", String(pct));
  }

  window.addEventListener("scroll", updateScrollProgress, { passive: true });
  updateScrollProgress();

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", function () {
      var open = navMenu.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    navMenu.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener("click", function () {
        navMenu.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length && "IntersectionObserver" in window) {
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      revealEls.forEach(function (el) {
        el.classList.add("is-visible");
      });
    } else {
      revealEls.forEach(function (el, index) {
        if (!el.classList.contains("reveal--delay")) {
          el.style.transitionDelay = Math.min(index * 0.04, 0.32) + "s";
        }
      });
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              io.unobserve(entry.target);
            }
          });
        },
        { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
      );
      revealEls.forEach(function (el) {
        io.observe(el);
      });
    }
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  var heroStats = document.querySelectorAll(".hero-stat__value[data-count]");
  if (heroStats.length && "IntersectionObserver" in window) {
    var statsReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function runCountUp(el) {
      if (el.dataset.counted === "true") return;
      el.dataset.counted = "true";
      var target = parseFloat(el.dataset.count);
      var suffix = el.dataset.suffix || "";
      var decimals = parseInt(el.dataset.decimals || "0", 10);
      if (statsReduced || isNaN(target)) {
        el.textContent = target.toFixed(decimals) + suffix;
        return;
      }
      var duration = 1400;
      var start = performance.now();
      function tick(now) {
        var progress = Math.min((now - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var value = target * eased;
        el.textContent = value.toFixed(decimals) + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }

    var statsIo = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            runCountUp(entry.target);
            statsIo.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    heroStats.forEach(function (el) {
      statsIo.observe(el);
    });
  }

  if (contactForm && formNote && contactSubmit) {
    var defaultBtnText = contactSubmit.textContent;

    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      formNote.textContent = "";
      formNote.classList.remove("is-success", "is-error");

      var action = contactForm.getAttribute("action") || "";
      if (action.indexOf("YOUR_FORM_ID") !== -1) {
        formNote.textContent =
          "Formspree is not configured yet. Replace YOUR_FORM_ID in the form action with your Formspree form ID.";
        formNote.classList.add("is-error");
        return;
      }

      var fd = new FormData(contactForm);
      var name = String(fd.get("name") || "").trim();
      var email = String(fd.get("email") || "").trim();
      var message = String(fd.get("message") || "").trim();

      if (!name || !email || !message) {
        formNote.textContent = "Please fill in all fields.";
        formNote.classList.add("is-error");
        return;
      }

      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!emailOk) {
        formNote.textContent = "Please enter a valid email address.";
        formNote.classList.add("is-error");
        return;
      }

      contactSubmit.disabled = true;
      contactSubmit.setAttribute("aria-busy", "true");
      contactSubmit.textContent = "Sending…";

      fetch(action, {
        method: "POST",
        body: fd,
        headers: { Accept: "application/json" },
      })
        .then(function (response) {
          return response
            .json()
            .catch(function () {
              return {};
            })
            .then(function (data) {
              return { ok: response.ok, status: response.status, data: data };
            });
        })
        .then(function (result) {
          if (result.ok) {
            formNote.textContent = "Thanks! Your message was sent — I’ll get back to you soon.";
            formNote.classList.add("is-success");
            contactForm.reset();
            return;
          }
          var errMsg = "Something went wrong. Please try again.";
          if (result.data) {
            if (typeof result.data.error === "string") {
              errMsg = result.data.error;
            } else if (result.data.errors && typeof result.data.errors === "object") {
              var first = Object.keys(result.data.errors)[0];
              if (first && result.data.errors[first]) {
                errMsg = String(result.data.errors[first]);
              }
            }
          }
          formNote.textContent = errMsg;
          formNote.classList.add("is-error");
        })
        .catch(function () {
          formNote.textContent =
            "Network error. Check your connection and try again, or email vg9584911@gmail.com directly.";
          formNote.classList.add("is-error");
        })
        .finally(function () {
          contactSubmit.disabled = false;
          contactSubmit.removeAttribute("aria-busy");
          contactSubmit.textContent = defaultBtnText;
        });
    });
  }

  var otherProjectsCarousel = document.getElementById("otherProjectsCarousel");
  var otherProjectsPrev = document.getElementById("otherProjectsPrev");
  var otherProjectsNext = document.getElementById("otherProjectsNext");

  if (otherProjectsCarousel && otherProjectsPrev && otherProjectsNext) {
    function getCarouselScrollAmount() {
      var track = otherProjectsCarousel.querySelector(".projects-carousel__track");
      var card = track && track.querySelector(".project-basic");
      if (!card) return otherProjectsCarousel.clientWidth;
      var gap = parseFloat(getComputedStyle(track).gap) || 0;
      var cardWidth = card.offsetWidth + gap;
      var visible = Math.max(1, Math.round(otherProjectsCarousel.clientWidth / cardWidth));
      return visible * cardWidth - gap;
    }

    function updateCarouselButtons() {
      var maxScroll = otherProjectsCarousel.scrollWidth - otherProjectsCarousel.clientWidth;
      otherProjectsPrev.disabled = otherProjectsCarousel.scrollLeft <= 2;
      otherProjectsNext.disabled = otherProjectsCarousel.scrollLeft >= maxScroll - 2;
    }

    otherProjectsPrev.addEventListener("click", function () {
      otherProjectsCarousel.scrollBy({ left: -getCarouselScrollAmount(), behavior: "smooth" });
    });

    otherProjectsNext.addEventListener("click", function () {
      otherProjectsCarousel.scrollBy({ left: getCarouselScrollAmount(), behavior: "smooth" });
    });

    otherProjectsCarousel.addEventListener("scroll", updateCarouselButtons, { passive: true });
    window.addEventListener("resize", updateCarouselButtons);
    updateCarouselButtons();
  }

  var blogsGrid = document.getElementById("blogsGrid");
  var blogCards = blogsGrid ? blogsGrid.querySelectorAll(".blog-card") : [];
  var activeBlogIndex = null;

  if (blogsGrid && blogCards.length) {
    blogCards.forEach(function (card, index) {
      var btn = card.querySelector(".blog-card__read");
      if (!btn) return;

      btn.addEventListener("click", function () {
        if (activeBlogIndex === index) {
          blogsGrid.classList.add("is-collapsing");
          setTimeout(function () {
            blogsGrid.classList.remove("is-expanded", "is-collapsing");
            blogCards.forEach(function (c) {
              c.classList.remove("is-active", "is-hidden");
            });
            blogCards.forEach(function (c) {
              var b = c.querySelector(".blog-card__read");
              if (b) {
                b.setAttribute("aria-expanded", "false");
                b.textContent = "Read article";
              }
            });
            activeBlogIndex = null;
          }, 380);
          return;
        }

        activeBlogIndex = index;
        blogsGrid.classList.add("is-expanded");
        blogCards.forEach(function (c, i) {
          if (i === index) {
            c.classList.add("is-active");
            c.classList.remove("is-hidden");
          } else {
            c.classList.add("is-hidden");
            c.classList.remove("is-active");
          }
          var b = c.querySelector(".blog-card__read");
          if (b) {
            b.setAttribute("aria-expanded", i === index ? "true" : "false");
            b.textContent = i === index ? "Close article" : "Read article";
          }
        });
      });
    });
  }
})();
