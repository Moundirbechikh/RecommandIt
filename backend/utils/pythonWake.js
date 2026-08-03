const PYTHON_API_URL = process.env.PYTHON_API_URL;

let wakePromise = null;
let isAwake = false;

async function pingOnce(timeoutMs = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${PYTHON_API_URL}/keep-alive`, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    return true;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

async function retryWake(maxAttempts = 8, delayMs = 6000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await pingOnce();
      console.log(`✅ Python réveillé (tentative ${attempt}/${maxAttempts})`);
      isAwake = true;
      return true;
    } catch (err) {
      console.warn(`⏳ Réveil Python: tentative ${attempt}/${maxAttempts} échouée -> ${err.message}`);
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }
  console.error("❌ Python injoignable après toutes les tentatives");
  isAwake = false;
  return false;
}

/**
 * Garantit qu'une seule requête de réveil est en vol à la fois.
 * Tout appelant (démarrage, route hybride, etc.) attend la même promesse
 * au lieu de déclencher un nouveau ping concurrent (source du 429 Render).
 */
function ensurePythonAwake() {
  if (!PYTHON_API_URL) {
    console.warn("⚠️ PYTHON_API_URL non défini");
    return Promise.resolve(false);
  }

  if (!wakePromise) {
    wakePromise = retryWake().finally(() => {
      // Après 10 min on considère que Render peut avoir remis l'instance
      // en veille, donc on autorise un nouveau cycle de réveil.
      setTimeout(() => {
        wakePromise = null;
      }, 10 * 60 * 1000);
    });
  }

  return wakePromise;
}

function isPythonAwake() {
  return isAwake;
}

module.exports = { ensurePythonAwake, isPythonAwake };
