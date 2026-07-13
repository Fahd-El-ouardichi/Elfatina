/* ELFATINA — shared behaviour */
(function () {
  "use strict";

  // Scroll reveal
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.18 });
  document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });

  // Golden thread progress + header shadow
  var bar = document.querySelector(".thread-progress");
  var hdr = document.querySelector("header.site");
  function onScroll() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    if (bar) bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
    if (hdr) hdr.classList.toggle("scrolled", h.scrollTop > 10);
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Lightbox — any element with [data-lb] (uses its <img> and data-lb text)
  var lb = document.getElementById("lightbox");
  if (lb) {
    var lbImg = lb.querySelector("img");
    var lbCap = lb.querySelector(".lb-cap");
    document.querySelectorAll("[data-lb]").forEach(function (el) {
      el.addEventListener("click", function () {
        var img = el.tagName === "IMG" ? el : el.querySelector("img");
        if (!img) return;
        lbImg.src = img.currentSrc || img.src;
        lbImg.alt = img.alt;
        lbCap.textContent = el.getAttribute("data-lb") || img.alt || "";
        lb.classList.add("show");
      });
    });
    lb.addEventListener("click", function () { lb.classList.remove("show"); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") lb.classList.remove("show");
    });
  }

  // Product page: thumbnail swap
  var mainImg = document.querySelector(".pdp-main img");
  var thumbs = document.querySelectorAll(".pdp-thumbs button");
  if (mainImg && thumbs.length) {
    thumbs.forEach(function (b) {
      b.addEventListener("click", function () {
        var t = b.querySelector("img");
        mainImg.src = t.getAttribute("data-full") || t.src;
        mainImg.alt = t.alt;
        thumbs.forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on");
      });
    });
  }

  // Size chips: visual selection
  document.querySelectorAll(".sizes span.s").forEach(function (s) {
    s.addEventListener("click", function () {
      s.parentElement.querySelectorAll(".s").forEach(function (x) { x.classList.remove("on"); });
      s.classList.add("on");
    });
  });

  // Atelier corner: tap-to-toggle for touch screens
  var atelier = document.getElementById("atelier");
  if (atelier) {
    atelier.addEventListener("click", function () { atelier.classList.toggle("open"); });
  }
})();
