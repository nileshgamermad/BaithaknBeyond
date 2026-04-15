(function () {
  var key = 'baithak-theme';

  function applyTheme(nextTheme) {
    document.body.dataset.theme = nextTheme;
    localStorage.setItem(key, nextTheme);

    var label = document.getElementById('themeLabel');
    if (label) {
      label.textContent = nextTheme === 'light' ? 'Dark mode' : 'Light mode';
    }
  }

  function mountThemeSwitch() {
    var button = document.getElementById('themeSwitch');
    if (!button || button.dataset.ready === 'true') return;

    button.dataset.ready = 'true';
    applyTheme(localStorage.getItem(key) || 'light');

    button.addEventListener('click', function () {
      var nextTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountThemeSwitch, { once: true });
  } else {
    mountThemeSwitch();
  }
})();
