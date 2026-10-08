const intro = document.querySelector("#video-intro");
const introVideo = document.querySelector("#intro-video");
const startButton = document.querySelector("#start-video");
const videoError = document.querySelector("#video-error");
const invitation = document.querySelector("#invitation");
const soundtrack = document.querySelector("#soundtrack");
const soundToggle = document.querySelector("#sound-toggle");
const soundStatus = document.querySelector("#sound-status");
const countdown = document.querySelector("#countdown");
const flowerReturn = document.querySelector(".flower-return");
const locationButton = document.querySelector("#location-button");
const mapDialog = document.querySelector("#map-dialog");
const mapClose = document.querySelector("#map-close");
const fadeDuration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 640;
let pageTransitionInProgress = false;

function updateCountdown() {
  const target = new Date(countdown.dataset.date).getTime();
  const remaining = Math.max(0, target - Date.now());
  const totalSeconds = Math.floor(remaining / 1000);
  const values = {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60
  };

  for (const [unit, value] of Object.entries(values)) {
    countdown.querySelector(`[data-unit="${unit}"]`).textContent = String(value).padStart(2, "0");
  }

  if (remaining === 0) countdown.setAttribute("aria-label", "Hoy celebramos los XV años de Nathaly");
}

function showSoundError(error) {
  soundToggle.setAttribute("aria-pressed", "false");
  soundToggle.setAttribute("aria-label", "Reintentar música");
  soundStatus.textContent = "No se pudo reproducir la música. Revisa el archivo de audio.";
  console.error("No se pudo reproducir la música de la invitación.", error);
}

async function playSoundtrack() {
  soundStatus.textContent = "";
  try {
    await soundtrack.play();
    soundToggle.setAttribute("aria-pressed", "true");
    soundToggle.setAttribute("aria-label", "Silenciar música");
  } catch (error) {
    showSoundError(error);
  }
}

async function startVideo() {
  videoError.hidden = true;
  soundToggle.hidden = false;

  const musicPlayback = playSoundtrack();
  try {
    await introVideo.play();
    startButton.hidden = true;
  } catch (error) {
    soundToggle.hidden = true;
    startButton.disabled = false;
    videoError.hidden = false;
    console.error("No se pudo reproducir el video de introducción.", error);
  }

  await musicPlayback;
}

function showInvitation() {
  intro.classList.add("is-fading");
  invitation.hidden = false;
  invitation.classList.add("is-entering");
  invitation.scrollTop = 0;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => invitation.classList.remove("is-entering"));
  });
  document.querySelector("#pagina-1").focus({ preventScroll: true });
  window.setTimeout(() => {
    intro.hidden = true;
  }, fadeDuration);
}

function transitionToPage(target) {
  if (!target || pageTransitionInProgress) return false;
  const pages = [...invitation.querySelectorAll(".page")];
  const current = pages.reduce((closest, page) =>
    Math.abs(page.offsetTop - invitation.scrollTop) < Math.abs(closest.offsetTop - invitation.scrollTop)
      ? page
      : closest
  );
  if (current === target) return false;

  pageTransitionInProgress = true;
  current.classList.add("is-fading");

  window.setTimeout(() => {
    invitation.scrollTop = target.offsetTop;
    current.classList.remove("is-active");
    current.classList.remove("is-fading");
    target.classList.add("is-active", "is-fading");
    target.focus({ preventScroll: true });

    requestAnimationFrame(() => {
      target.classList.remove("is-fading");
      window.setTimeout(() => {
        pageTransitionInProgress = false;
      }, fadeDuration + 20);
    });
  }, fadeDuration);
  return true;
}

updateCountdown();
window.setInterval(updateCountdown, 1000);
document.querySelector("#pagina-1").classList.add("is-active");

startButton.addEventListener("click", () => {
  startButton.disabled = true;
  void startVideo();
});

introVideo.addEventListener("ended", showInvitation);

introVideo.addEventListener("playing", () => {
  videoError.hidden = true;
});

introVideo.addEventListener("error", () => {
  if (startButton.disabled) {
    startButton.disabled = false;
    soundToggle.hidden = true;
    videoError.hidden = false;
    console.error("No se pudo cargar el video de introducción.", introVideo.error);
  }
});

invitation.querySelectorAll(".page-arrow").forEach((arrow) => {
  arrow.addEventListener("click", (event) => {
    event.preventDefault();
    const target = document.querySelector(arrow.getAttribute("href"));
    if (!target) return;
    if (transitionToPage(target)) history.pushState(null, "", `#${target.id}`);
  });
});

soundToggle.addEventListener("click", async () => {
  if (!soundtrack.paused) {
    soundtrack.pause();
    soundToggle.setAttribute("aria-pressed", "false");
    soundToggle.setAttribute("aria-label", "Activar música");
    soundStatus.textContent = "";
    return;
  }

  await playSoundtrack();
});

soundtrack.addEventListener("error", () => {
  if (soundToggle.hidden) return;
  showSoundError(new Error("No se pudo cargar el archivo de audio."));
});

flowerReturn.addEventListener("click", () => {
  if (transitionToPage(document.querySelector("#pagina-1"))) {
    history.pushState(null, "", "#pagina-1");
  }
});

locationButton.addEventListener("click", () => mapDialog.showModal());
mapClose.addEventListener("click", () => mapDialog.close());
mapDialog.addEventListener("click", (event) => {
  if (event.target === mapDialog) mapDialog.close();
});
