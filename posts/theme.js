(function () {
  const key = "baithak-theme";
  const button = document.getElementById("themeSwitch");
  const label = document.getElementById("themeLabel");
  const current = localStorage.getItem(key) || "light";
  document.body.dataset.theme = current;
  label.textContent = current === "light" ? "Dark mode" : "Light mode";
  button.addEventListener("click", function () {
    const next = document.body.dataset.theme === "dark" ? "light" : "dark";
    document.body.dataset.theme = next;
    localStorage.setItem(key, next);
    label.textContent = next === "light" ? "Dark mode" : "Light mode";
  });
})();
