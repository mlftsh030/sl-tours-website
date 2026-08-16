(function () {
  var RATES_ENDPOINT = "https://api.frankfurter.dev/v1/latest?from=ZAR";
  var RATES_CACHE_KEY = "slToursRatesZAR";
  var RATES_TTL_MS = 60 * 60 * 1000;
  var CURRENCY_STORAGE_KEY = "slToursSelectedCurrency";
  var SUPPORTED_CURRENCIES = ["ZAR", "USD", "EUR", "GBP"];
  var CURRENCY_SYMBOLS = { ZAR: "R", USD: "$", EUR: "€", GBP: "£" };
  var PRICE_SELECTOR = ".tourmaster-tour-price .tourmaster-tail";

  function readCachedRates() {
    var raw;
    var parsed;

    try {
      raw = sessionStorage.getItem(RATES_CACHE_KEY);
    } catch (e) {
      return null;
    }

    if (!raw) {
      return null;
    }

    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      return null;
    }

    if (!parsed || !parsed.rates || !parsed.fetchedAt) {
      return null;
    }

    if (Date.now() - parsed.fetchedAt > RATES_TTL_MS) {
      return null;
    }

    return parsed.rates;
  }

  function writeCachedRates(rates) {
    try {
      sessionStorage.setItem(
        RATES_CACHE_KEY,
        JSON.stringify({ rates: rates, fetchedAt: Date.now() })
      );
    } catch (e) {
      // Ignore storage failures (private browsing, quota, etc.)
    }
  }

  function getSelectedCurrency() {
    var stored;

    try {
      stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
    } catch (e) {
      stored = null;
    }

    return SUPPORTED_CURRENCIES.indexOf(stored) !== -1 ? stored : "ZAR";
  }

  function setSelectedCurrency(currency) {
    try {
      localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
    } catch (e) {
      // Ignore storage failures.
    }
  }

  function parseZarValue(text) {
    var cleaned = (text || "").replace(/[^0-9.]/g, "");
    var value = parseFloat(cleaned);
    return isNaN(value) ? null : value;
  }

  function formatAmount(amount) {
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  function getPriceElements() {
    return Array.prototype.slice.call(document.querySelectorAll(PRICE_SELECTOR));
  }

  function primePriceElements(elements) {
    elements.forEach(function (el) {
      if (!el.getAttribute("data-zar-price")) {
        var zarValue = parseZarValue(el.textContent);
        if (zarValue !== null) {
          el.setAttribute("data-zar-price", String(zarValue));
          el.setAttribute("data-zar-text", el.textContent);
        }
      }
    });
  }

  function renderPrices(currency, rates) {
    var elements = getPriceElements();

    primePriceElements(elements);

    elements.forEach(function (el) {
      var zarAttr = el.getAttribute("data-zar-price");
      var zarText = el.getAttribute("data-zar-text");
      var zarValue;

      if (!zarAttr) {
        return;
      }

      if (currency === "ZAR" || !rates) {
        el.textContent = zarText;
        el.removeAttribute("title");
        return;
      }

      zarValue = parseFloat(zarAttr);
      var rate = rates[currency];

      if (!rate) {
        el.textContent = zarText;
        el.removeAttribute("title");
        return;
      }

      var converted = zarValue * rate;
      el.textContent =
        "≈ " + CURRENCY_SYMBOLS[currency] + formatAmount(converted);
      el.setAttribute("title", zarText + " (approx., live rate)");
    });
  }

  function fetchRates(callback) {
    var cached = readCachedRates();

    if (cached) {
      callback(cached);
      return;
    }

    fetch(RATES_ENDPOINT)
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Rate request failed");
        }
        return response.json();
      })
      .then(function (data) {
        if (!data || !data.rates) {
          throw new Error("Malformed rate response");
        }
        var rates = data.rates;
        rates.ZAR = 1;
        writeCachedRates(rates);
        callback(rates);
      })
      .catch(function () {
        callback(null);
      });
  }

  function buildSelector() {
    var wrap = document.createElement("div");
    var select = document.createElement("select");
    var i;
    var option;

    wrap.className = "sl-currency-selector";

    for (i = 0; i < SUPPORTED_CURRENCIES.length; i += 1) {
      option = document.createElement("option");
      option.value = SUPPORTED_CURRENCIES[i];
      option.textContent = SUPPORTED_CURRENCIES[i];
      select.appendChild(option);
    }

    wrap.appendChild(select);

    return { wrap: wrap, select: select };
  }

  function injectMounts() {
    var targets = document.querySelectorAll(".traveltour-top-bar-right");
    var mounts = [];
    var i;
    var placeholder;

    for (i = 0; i < targets.length; i += 1) {
      placeholder = document.createElement("span");
      placeholder.className = "sl-currency-selector-mount";
      targets[i].insertBefore(placeholder, targets[i].firstChild);
      mounts.push(placeholder);
    }

    return mounts;
  }

  function init() {
    var priceElements = getPriceElements();
    var mounts = injectMounts();

    if (!mounts.length && !priceElements.length) {
      return;
    }

    primePriceElements(priceElements);

    var selectedCurrency = getSelectedCurrency();
    var currentRates = null;

    var selectors = mounts.map(function (mount) {
      var built = buildSelector();
      built.select.value = selectedCurrency;
      mount.appendChild(built.wrap);
      return built.select;
    });

    function applyCurrency(currency) {
      selectedCurrency = currency;
      setSelectedCurrency(currency);
      selectors.forEach(function (select) {
        select.value = currency;
      });
      renderPrices(currency, currentRates);
    }

    selectors.forEach(function (select) {
      select.addEventListener("change", function () {
        applyCurrency(select.value);
      });
    });

    renderPrices(selectedCurrency, null);

    fetchRates(function (rates) {
      currentRates = rates;
      renderPrices(selectedCurrency, currentRates);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
