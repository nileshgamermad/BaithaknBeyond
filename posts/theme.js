(function () {
  // ─── Theme toggle ────────────────────────────────
  var key = "baithak-theme";
  var button = document.getElementById("themeSwitch");
  var label = document.getElementById("themeLabel");
  var current = localStorage.getItem(key) || "light";
  document.body.dataset.theme = current;
  label.textContent = current === "light" ? "Dark mode" : "Light mode";

  button.addEventListener("click", function () {
    var next = document.body.dataset.theme === "dark" ? "light" : "dark";
    document.body.dataset.theme = next;
    localStorage.setItem(key, next);
    label.textContent = next === "light" ? "Dark mode" : "Light mode";
  });

  // ─── Reading progress bar ────────────────────────
  var progress = document.createElement("div");
  progress.id = "reading-progress";
  document.body.prepend(progress);

  window.addEventListener("scroll", function () {
    var doc = document.documentElement;
    var scrollTop = doc.scrollTop || document.body.scrollTop;
    var scrollHeight = doc.scrollHeight - doc.clientHeight;
    var pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    progress.style.width = pct + "%";
  }, { passive: true });

  // ─── Back to top button ──────────────────────────
  var backBtn = document.createElement("button");
  backBtn.id = "back-to-top-blog";
  backBtn.textContent = "↑";
  backBtn.setAttribute("aria-label", "Back to top");
  document.body.appendChild(backBtn);

  window.addEventListener("scroll", function () {
    backBtn.classList.toggle("visible", window.scrollY > 400);
  }, { passive: true });

  backBtn.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // ─── Share buttons ───────────────────────────────
  document.querySelectorAll("[data-share]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var type = btn.dataset.share;
      var url = encodeURIComponent(window.location.href);
      var title = encodeURIComponent(document.title);
      var shareUrl;
      if (type === "whatsapp") {
        shareUrl = "https://wa.me/?text=" + title + "%20" + url;
      } else if (type === "twitter") {
        shareUrl = "https://twitter.com/intent/tweet?text=" + title + "&url=" + url;
      }
      if (shareUrl) window.open(shareUrl, "_blank", "noopener,noreferrer");
    });
  });
})();
