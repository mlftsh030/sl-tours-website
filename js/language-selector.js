(function () {
  var includedLanguages =
    "en,fr,de,es,it,pt,nl,zh-CN,ja,ko,ru,ar,hi,af,zu";
  var MOUNT_ID = "google_translate_element";

  window.googleTranslateElementInit = function () {
    var mount = document.getElementById(MOUNT_ID);
    if (!mount) {
      return;
    }
    new google.translate.TranslateElement(
      {
        pageLanguage: "en",
        includedLanguages: includedLanguages,
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
        autoDisplay: false,
      },
      MOUNT_ID
    );
  };

  function injectMount() {
    var targets = document.querySelectorAll(".traveltour-top-bar-right");
    var i;
    var target;

    if (document.getElementById(MOUNT_ID)) {
      return;
    }

    for (i = 0; i < targets.length; i += 1) {
      if (targets[i].offsetParent !== null) {
        target = targets[i];
        break;
      }
    }

    if (!target) {
      return;
    }

    var mount = document.createElement("div");
    mount.id = MOUNT_ID;
    mount.className = "sl-language-selector";
    target.insertBefore(mount, target.firstChild);
  }

  function loadGoogleTranslateScript() {
    var script = document.createElement("script");
    script.src =
      "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
  }

  function init() {
    injectMount();
    loadGoogleTranslateScript();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
