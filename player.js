(() => {
  const tracks = (window.trackList || []).filter(track => track.file !== "earrings.opus");
  const audio = document.getElementById("audio");
  const widget = document.getElementById("musicWidget");
  const panel = document.getElementById("musicPanel");
  const bubblePlay = document.getElementById("bubblePlay");
  const bubbleToggle = document.getElementById("togglePanel");
  const bubbleCover = document.getElementById("bubbleCover");
  const bubbleTitle = document.getElementById("bubbleTitle");
  const bubbleArtist = document.getElementById("bubbleArtist");
  const bubbleState = document.getElementById("bubbleState");
  const playerCover = document.getElementById("playerCover");
  const playerTitle = document.getElementById("playerTitle");
  const playerArtist = document.getElementById("playerArtist");
  const storeLink = document.getElementById("storeLink");
  const playButton = document.getElementById("panelPlay");
  const seek = document.getElementById("seek");
  const currentTime = document.getElementById("currentTime");
  const duration = document.getElementById("duration");
  const playlist = document.getElementById("playlist");
  let active = 0;
  let seeking = false;

  const artPath = cover => cover === "cover-earrings.jpg" ? cover : `covers/${cover || "placeholder.svg"}`;
  const formatTime = value => {
    if (!Number.isFinite(value)) return "0:00";
    const min = Math.floor(value / 60);
    const sec = Math.floor(value % 60).toString().padStart(2, "0");
    return `${min}:${sec}`;
  };

  function setPlaying(playing) {
    widget.classList.toggle("is-playing", playing);
    widget.classList.toggle("is-paused", !playing);
    const label = playing ? "Pause selected song" : "Play selected song";
    bubblePlay.setAttribute("aria-label", label);
    playButton.setAttribute("aria-label", label);
    bubblePlay.querySelector(".bubble-play-icon").textContent = playing ? "Ⅱ" : "▶";
    playButton.textContent = playing ? "Ⅱ" : "▶";
    bubbleState.textContent = playing ? "NOW PLAYING" : "READY TO PLAY";
  }

  function renderTrack() {
    const track = tracks[active];
    if (!track) return;
    audio.src = encodeURI(track.file);
    bubbleCover.src = artPath(track.cover);
    playerCover.src = artPath(track.cover);
    playerCover.alt = `Cover art for ${track.title} by ${track.artist}`;
    bubbleTitle.textContent = track.title;
    bubbleArtist.textContent = track.artist;
    playerTitle.textContent = track.title;
    playerArtist.textContent = track.artist;
    if (track.storeUrl) {
      storeLink.href = track.storeUrl;
      storeLink.hidden = false;
      storeLink.textContent = track.storeUrl.includes("spotify.com") ? "Open on Spotify" : "Open on Apple Music";
    } else {
      storeLink.hidden = true;
    }
    currentTime.textContent = "0:00";
    duration.textContent = "0:00";
    seek.value = "0";
    renderPlaylist();
  }

  function renderPlaylist() {
    playlist.replaceChildren();
    tracks.forEach((track, index) => {
      const item = document.createElement("li");
      item.className = `playlist-item${index === active ? " active" : ""}`;
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("aria-current", index === active ? "true" : "false");
      const number = document.createElement("span");
      number.className = "playlist-index";
      number.textContent = index === active && !audio.paused ? "♫" : String(index + 1);
      const meta = document.createElement("span");
      meta.className = "playlist-meta";
      const title = document.createElement("strong");
      title.textContent = track.title;
      const artist = document.createElement("small");
      artist.textContent = track.artist;
      meta.append(title, artist);
      const state = document.createElement("span");
      state.className = "playlist-playing";
      state.textContent = index === active && !audio.paused ? "●" : "";
      button.append(number, meta, state);
      button.addEventListener("click", () => selectTrack(index, !audio.paused));
      item.append(button);
      playlist.append(item);
    });
    document.getElementById("trackCount").textContent = `${tracks.length} TRACKS`;
  }

  async function togglePlay() {
    if (!audio.src && tracks.length) renderTrack();
    if (audio.paused) {
      try { await audio.play(); } catch { bubbleState.textContent = "CAN'T PLAY FILE"; }
    } else audio.pause();
  }

  async function selectTrack(index, autoplay = false) {
    if (!tracks.length) return;
    active = (index + tracks.length) % tracks.length;
    renderTrack();
    if (autoplay) {
      try { await audio.play(); } catch { setPlaying(false); }
    }
  }

  bubblePlay.addEventListener("click", togglePlay);
  playButton.addEventListener("click", togglePlay);
  document.getElementById("next").addEventListener("click", () => selectTrack(active + 1, !audio.paused));
  document.getElementById("previous").addEventListener("click", () => {
    if (audio.currentTime > 3) { audio.currentTime = 0; return; }
    selectTrack(active - 1, !audio.paused);
  });
  bubbleToggle.addEventListener("click", () => {
    const open = panel.hidden;
    panel.hidden = !open;
    widget.classList.toggle("is-open", open);
    bubbleToggle.setAttribute("aria-expanded", String(open));
    bubbleToggle.setAttribute("aria-label", open ? "Close music player" : "Open music player");
  });
  function closePanel() {
    panel.hidden = true;
    widget.classList.remove("is-open");
    bubbleToggle.setAttribute("aria-expanded", "false");
    bubbleToggle.setAttribute("aria-label", "Open music player");
  }
  document.getElementById("closePanel").addEventListener("click", closePanel);
  document.getElementById("togglePlaylist").addEventListener("click", event => {
    const open = playlist.hidden;
    playlist.hidden = !open;
    event.currentTarget.textContent = open ? "Hide list" : "Show list";
    event.currentTarget.setAttribute("aria-expanded", String(open));
  });
  document.getElementById("volume").addEventListener("input", event => { audio.volume = Number(event.currentTarget.value); });
  seek.addEventListener("input", () => {
    seeking = true;
    if (Number.isFinite(audio.duration)) {
      const point = Number(seek.value) / 1000 * audio.duration;
      currentTime.textContent = formatTime(point);
    }
  });
  seek.addEventListener("change", () => {
    if (Number.isFinite(audio.duration)) audio.currentTime = Number(seek.value) / 1000 * audio.duration;
    seeking = false;
  });
  audio.addEventListener("loadedmetadata", () => { duration.textContent = formatTime(audio.duration); });
  audio.addEventListener("timeupdate", () => {
    if (!seeking && Number.isFinite(audio.duration) && audio.duration > 0) seek.value = String(Math.round(audio.currentTime / audio.duration * 1000));
    currentTime.textContent = formatTime(audio.currentTime);
  });
  audio.addEventListener("play", () => { setPlaying(true); renderPlaylist(); });
  audio.addEventListener("pause", () => { setPlaying(false); renderPlaylist(); });
  audio.addEventListener("ended", () => selectTrack(active + 1, true));
  audio.addEventListener("error", () => { bubbleState.textContent = "FILE UNAVAILABLE"; setPlaying(false); });

  if (tracks.length) renderTrack();
  else bubbleState.textContent = "NO TRACKS FOUND";
  setPlaying(false);
})();

