import { useEffect, useRef, useState } from "react";
import "./App.css";
import {
  setupBareMux,
  setupScramjet,
  getScramjet,
} from "./scramjet.js";

const API_BASE_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:5001"
    : "";

const themes = [
  {
    id: "nebula",
    name: "Nebula",
    description: "Deep blue and violet",
    icon: "🌌",
  },
  {
    id: "crimson",
    name: "Crimson",
    description: "Dark red cyber system",
    icon: "🔴",
  },
  {
    id: "matrix",
    name: "Matrix",
    description: "Black and neon green",
    icon: "🟢",
  },
  {
    id: "arctic",
    name: "Arctic",
    description: "Bright glass interface",
    icon: "❄️",
  },
  {
    id: "synthwave",
    name: "Synthwave",
    description: "Purple and pink neon",
    icon: "🌆",
  },
  {
    id: "void",
    name: "Void",
    description: "Minimal near-black",
    icon: "🌑",
  },
  { id: "ocean", name: "Ocean", description: "Deep navy and electric cyan", icon: "🌊" },
  { id: "solar", name: "Solar", description: "Black, gold, and solar orange", icon: "☀️" },
  { id: "sakura", name: "Sakura", description: "Dark rose and soft neon pink", icon: "🌸" },
  { id: "emerald", name: "Emerald", description: "Dark teal and luminous green", icon: "💚" },
  { id: "ultraviolet", name: "Ultraviolet", description: "Near-black and electric purple", icon: "🟣" },
  { id: "monochrome", name: "Monochrome", description: "Black, white, and silver", icon: "◐" },
];

const backgrounds = [
  { id: "grid", name: "Cyber Grid", description: "Animated neon grid", icon: "▦" },
  { id: "aurora", name: "Aurora", description: "Flowing northern lights", icon: "◒" },
  { id: "stars", name: "Starfield", description: "Deep-space parallax stars", icon: "✦" },
  { id: "minimal", name: "Minimal", description: "Clean atmospheric gradient", icon: "◼" },
  { id: "matrix", name: "Matrix Rain", description: "Digital falling-code atmosphere", icon: "⌁" },
  { id: "horizon", name: "Neon Horizon", description: "Retro-future glowing horizon", icon: "⌂" },
  { id: "particles", name: "Quantum Particles", description: "Floating energy field", icon: "⠿" },
  { id: "mesh", name: "Holographic Mesh", description: "Animated dimensional wireframe", icon: "◇" },
  { id: "nebula", name: "Cosmic Nebula", description: "Swirling deep-space energy", icon: "☄" },
  { id: "reactor", name: "Core Reactor", description: "Pulsing sci-fi energy core", icon: "◎" },
];

const adminBackgrounds = [
  { id: "admin-singularity", name: "Admin Singularity", description: "Event-horizon energy reserved for Aether admins", icon: "◉" },
  { id: "admin-redline", name: "Redline Protocol", description: "High-intensity crimson command grid", icon: "◆" },
  { id: "admin-celestial", name: "Celestial Core", description: "Gold and violet stellar command field", icon: "✦" },
  { id: "admin-ghost", name: "Ghost Grid", description: "Stealth monochrome holographic network", icon: "◇" },
  { id: "admin-prime", name: "Aether Prime", description: "Signature cyan-violet Aether energy system", icon: "⚡" },
];

const liveWallpapers = [
  {
    id: "minecraft-nature",
    name: "Minecraft Nature",
    description: "Animated Minecraft nature wallpaper",
    icon: "▦",
    src: "/wallpapers/minecraft-nature.1920x1080.mp4",
  },
  {
    id: "black-hole",
    name: "Black Hole",
    description: "4K animated black hole wallpaper",
    icon: "◉",
    src: "/wallpapers/black-hole.3840x2160.mp4",
  },
  {
    id: "snowfall",
    name: "Snowfall Forest",
    description: "4K animated snowy forest wallpaper",
    icon: "❄",
    src: "/wallpapers/snowfall-in-forest.3840x2160.mp4",
  },
];

const codeWallpapers = {
  GAVIN09: {
    id: "gavin",
    name: "Gavin",
    description: "Unlocked with wallpaper code GAVIN09",
    icon: "◆",
    src: "/wallpapers/gavin-wallpaper.mp4",
  },
};

const cyberGridLines = Array.from({ length: 18 }, (_, index) => index);
const cyberGridColumns = Array.from({ length: 22 }, (_, index) => index);

const matrixColumns = Array.from({ length: 30 }, (_, index) => ({
  id: index,
  left: `${(index / 30) * 100}%`,
  delay: `${-((index * 0.47) % 5.8)}s`,
  duration: `${3.2 + ((index * 0.73) % 3.8)}s`,
  opacity: 0.42 + ((index * 17) % 45) / 100,
  text: Array.from({ length: 28 }, (_, charIndex) => {
    const chars = "01アイウエオカキクケコサシスセソタチツテト";
    return chars[(index * 7 + charIndex * 5) % chars.length];
  }).join("\n"),
}));

const cursors = [
  { id: "glow", name: "Glow", description: "Classic trailing glow", icon: "●" },
  { id: "ring", name: "Ring", description: "Clean neon targeting ring", icon: "○" },
  { id: "crosshair", name: "Crosshair", description: "Precision cyber reticle", icon: "＋" },
  { id: "plasma", name: "Plasma", description: "Hot energy core and aura", icon: "✹" },
  { id: "orbit", name: "Orbit", description: "Particles orbit your pointer", icon: "⊙" },
  { id: "comet", name: "Comet", description: "Bright core with a long tail", icon: "☄" },
  { id: "pulse", name: "Pulse", description: "Expanding energy pulse", icon: "◎" },
  { id: "quantum", name: "Quantum", description: "Dual rotating energy rings", icon: "◉" },
  { id: "glitch", name: "Glitch", description: "Unstable cyber distortion", icon: "⌁" },
  { id: "tiny", name: "Tiny Dot", description: "Minimal precision pointer", icon: "·" },
  { id: "system", name: "System", description: "Normal system cursor", icon: "↖" },
];

const searchEngines = [
  { id: "google", name: "Google", icon: "G" },
  { id: "bing", name: "Bing", icon: "B" },
  { id: "duckduckgo", name: "DuckDuckGo", icon: "D" },
  { id: "brave", name: "Brave", icon: "Br" },
  { id: "yahoo", name: "Yahoo", icon: "Y!" },
];

function App() {
  const [browserOpen, setBrowserOpen] = useState(false);
  const [browserMinimized, setBrowserMinimized] = useState(false);
  const [browserMaximized, setBrowserMaximized] = useState(false);
  const [neonTVOpen, setNeonTVOpen] = useState(false);
  const [neonTVUrl, setNeonTVUrl] = useState("");

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsMinimized, setSettingsMinimized] = useState(false);

  const [messagesOpen, setMessagesOpen] = useState(false);
  const [messagesMinimized, setMessagesMinimized] = useState(false);

  const [messagesAccount, setMessagesAccount] = useState(null);
  const [messagesToken, setMessagesToken] = useState(() =>
    localStorage.getItem("my-os-auth-token") || ""
  );
  const [messagesAuthMode, setMessagesAuthMode] = useState("login");
  const [messagesAuthUsername, setMessagesAuthUsername] = useState("");
  const [messagesAuthPassword, setMessagesAuthPassword] = useState("");
  const [messagesAuthConfirm, setMessagesAuthConfirm] = useState("");
  const [messagesAuthError, setMessagesAuthError] = useState("");
  const [messagesAuthLoading, setMessagesAuthLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [onlineConversationsLoading, setOnlineConversationsLoading] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState("nova");
  const [messageDraft, setMessageDraft] = useState("");

  const [conversations, setConversations] = useState(() => {
    try {
      const saved = localStorage.getItem("my-os-messages");

      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error("Could not load messages:", error);
    }

    return [
      {
        id: "nova",
        name: "Nova",
        status: "LOCAL CONTACT",
        unread: 2,
        messages: [
          {
            id: 1,
            sender: "them",
            text: "Yo, Messages is finally online 👀",
            time: "10:32 PM",
          },
          {
            id: 2,
            sender: "them",
            text: "This conversation is saved locally in Aether OS.",
            time: "10:33 PM",
          },
        ],
      },
      {
        id: "echo",
        name: "Echo",
        status: "LOCAL CONTACT",
        unread: 0,
        messages: [
          {
            id: 3,
            sender: "them",
            text: "The new window system looks clean.",
            time: "9:48 PM",
          },
        ],
      },
      {
        id: "system",
        name: "Aether OS",
        status: "SYSTEM",
        unread: 0,
        messages: [
          {
            id: 4,
            sender: "them",
            text: "Welcome to Messages v1. Internet messaging comes next.",
            time: "9:20 PM",
          },
        ],
      },
    ];
  });

  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [startSearch, setStartSearch] = useState("");

  const [fps, setFps] = useState(0);
  const [battery, setBattery] = useState({
    supported: null,
    level: null,
    charging: false,
  });

  const [time, setTime] = useState(new Date());
  const [desktopSearch, setDesktopSearch] = useState("");

  const [weather, setWeather] = useState({
    temperature: null,
    condition: "Getting your weather...",
    icon: "☁",
  });

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("my-os-theme") || "nebula";
  });

  const [background, setBackground] = useState(() => {
    return localStorage.getItem("my-os-background") || "grid";
  });

  const [liveWallpaper, setLiveWallpaper] = useState(() => {
    return localStorage.getItem("my-os-live-wallpaper") || "";
  });

  const [wallpaperCode, setWallpaperCode] = useState("");
  const [wallpaperCodeMessage, setWallpaperCodeMessage] = useState("");
  const [unlockedWallpaperIds, setUnlockedWallpaperIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("my-os-unlocked-wallpapers") || "[]");
    } catch {
      return [];
    }
  });
  const [enterAnimationActive, setEnterAnimationActive] = useState(true);

  const [cursorStyle, setCursorStyle] = useState(() => {
    return localStorage.getItem("my-os-cursor") || "glow";
  });

  const [cursorTracking, setCursorTracking] = useState(() => {
    return localStorage.getItem("my-os-cursor-tracking") || "smooth";
  });

  const [searchEngine, setSearchEngine] = useState(() => {
    return localStorage.getItem("my-os-search-engine") || "google";
  });

  const [tabs, setTabs] = useState([
    {
      id: 1,
      title: "New Tab",
      address: "",
      pageUrl: "",
    },
  ]);

  const [activeTabId, setActiveTabId] = useState(1);

  const [proxyStatus, setProxyStatus] = useState("Starting...");
  const [scramjetStatus, setScramjetStatus] = useState("Starting...");
  const [startupDiagnosticError, setStartupDiagnosticError] = useState("");

  const frameRefs = useRef({});
  const cursorDotRef = useRef(null);
  const cursorGlowRef = useRef(null);
  const windowInteractionRef = useRef(null);

  const [windowInteractionActive, setWindowInteractionActive] = useState(false);
  const [resizeHoverEdge, setResizeHoverEdge] = useState("");

  const [browserRect, setBrowserRect] = useState({
    x: 90,
    y: 70,
    width: 1180,
    height: 720,
  });

  const [settingsRect, setSettingsRect] = useState({
    x: 180,
    y: 90,
    width: 980,
    height: 720,
  });

  const [messagesRect, setMessagesRect] = useState({
    x: 150,
    y: 85,
    width: 980,
    height: 680,
  });

  const activeTab =
    tabs.find((tab) => tab.id === activeTabId) || tabs[0];

  /* =========================
     LIVE CLOCK
  ========================= */

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  /* =========================
     CURSOR ANIMATION
  ========================= */

  useEffect(() => {
    if (cursorStyle === "system") {
      return;
    }

    const dot = cursorDotRef.current;
    const glow = cursorGlowRef.current;

    if (!dot || !glow) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    let glowX = mouseX;
    let glowY = mouseY;

    let animationFrame;

    function handlePointerMove(event) {
      mouseX = event.clientX;
      mouseY = event.clientY;

      dot.style.transform =
        `translate3d(${mouseX}px, ${mouseY}px, 0)`;

      dot.classList.add("visible");
      glow.classList.add("visible");
    }

    function handlePointerLeave() {
      dot.classList.remove("visible");
      glow.classList.remove("visible");
    }

    function animateGlow() {
      if (cursorTracking === "locked") {
        glowX = mouseX;
        glowY = mouseY;
      } else {
        glowX += (mouseX - glowX) * 0.16;
        glowY += (mouseY - glowY) * 0.16;
      }

      glow.style.transform =
        `translate3d(${glowX}px, ${glowY}px, 0)`;

      animationFrame =
        requestAnimationFrame(animateGlow);
    }

    window.addEventListener(
      "pointermove",
      handlePointerMove
    );

    document.addEventListener(
      "mouseleave",
      handlePointerLeave
    );

    animateGlow();

    return () => {
      window.removeEventListener(
        "pointermove",
        handlePointerMove
      );

      document.removeEventListener(
        "mouseleave",
        handlePointerLeave
      );

      cancelAnimationFrame(animationFrame);
    };
  }, [cursorStyle, cursorTracking]);

  /* =========================
     LIVE BATTERY STATUS
  ========================= */

  useEffect(() => {
    let batteryManager;
    let disposed = false;

    if (!("getBattery" in navigator)) {
      setBattery({
        supported: false,
        level: null,
        charging: false,
      });
      return;
    }

    function syncBattery() {
      if (!batteryManager || disposed) return;

      setBattery({
        supported: true,
        level: Math.round(batteryManager.level * 100),
        charging: batteryManager.charging,
      });
    }

    navigator.getBattery()
      .then((manager) => {
        if (disposed) return;

        batteryManager = manager;
        syncBattery();

        manager.addEventListener("levelchange", syncBattery);
        manager.addEventListener("chargingchange", syncBattery);
      })
      .catch(() => {
        if (disposed) return;

        setBattery({
          supported: false,
          level: null,
          charging: false,
        });
      });

    return () => {
      disposed = true;

      if (batteryManager) {
        batteryManager.removeEventListener("levelchange", syncBattery);
        batteryManager.removeEventListener("chargingchange", syncBattery);
      }
    };
  }, []);

  /* =========================
     LIVE FPS COUNTER
  ========================= */

  useEffect(() => {
    let animationFrame;
    let frameCount = 0;
    let lastSample = performance.now();

    function measureFps(now) {
      frameCount += 1;

      const elapsed = now - lastSample;

      if (elapsed >= 500) {
        const measuredFps = Math.round(
          (frameCount * 1000) / elapsed
        );

        setFps(measuredFps);
        frameCount = 0;
        lastSample = now;
      }

      animationFrame = requestAnimationFrame(measureFps);
    }

    animationFrame = requestAnimationFrame(measureFps);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  /* =========================
     LIVE WEATHER
  ========================= */

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setWeather({
        temperature: null,
        condition: "Location unavailable",
        icon: "☁",
      });

      return;
    }

    function getWeatherIcon(code, isDay) {
      if (code === 0) return isDay ? "☀" : "☾";
      if (code === 1 || code === 2) return "⛅";
      if (code === 3) return "☁";
      if (code === 45 || code === 48) return "≋";
      if (code >= 51 && code <= 67) return "☂";
      if (code >= 71 && code <= 77) return "❄";
      if (code >= 80 && code <= 82) return "☂";
      if (code >= 85 && code <= 86) return "❄";
      if (code >= 95) return "ϟ";

      return "☁";
    }

    function getWeatherCondition(code) {
      if (code === 0) return "Clear";
      if (code === 1) return "Mostly clear";
      if (code === 2) return "Partly cloudy";
      if (code === 3) return "Cloudy";
      if (code === 45 || code === 48) return "Foggy";
      if (code >= 51 && code <= 57) return "Drizzle";
      if (code >= 61 && code <= 67) return "Rain";
      if (code >= 71 && code <= 77) return "Snow";
      if (code >= 80 && code <= 82) return "Rain showers";
      if (code >= 85 && code <= 86) return "Snow showers";
      if (code >= 95) return "Thunderstorms";

      return "Current weather";
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const weatherUrl =
            "https://api.open-meteo.com/v1/forecast" +
            `?latitude=${coords.latitude}` +
            `&longitude=${coords.longitude}` +
            "&current=temperature_2m,weather_code,is_day" +
            "&temperature_unit=fahrenheit";

          const response = await fetch(weatherUrl);

          if (!response.ok) {
            throw new Error(
              "Weather request failed."
            );
          }

          const data = await response.json();
          const current = data.current;

          setWeather({
            temperature:
              Math.round(current.temperature_2m),

            condition:
              getWeatherCondition(
                current.weather_code
              ),

            icon:
              getWeatherIcon(
                current.weather_code,
                current.is_day === 1
              ),
          });
        } catch (error) {
          console.error(
            "Weather failed:",
            error
          );

          setWeather({
            temperature: null,
            condition: "Weather unavailable",
            icon: "☁",
          });
        }
      },

      (error) => {
        console.error(
          "Location failed:",
          error
        );

        setWeather({
          temperature: null,
          condition: "Allow location for weather",
          icon: "☁",
        });
      },

      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 600000,
      }
    );
  }, []);

  /* =========================
     AETHER ENTER ANIMATION
  ========================= */


  useEffect(() => {
    if (!enterAnimationActive) return;

    function handleAetherEnterKey(event) {
      if (event.key === "Enter") {
        event.preventDefault();
        setEnterAnimationActive(false);
      }
    }

    window.addEventListener("keydown", handleAetherEnterKey);

    return () => {
      window.removeEventListener("keydown", handleAetherEnterKey);
    };
  }, [enterAnimationActive]);

  /* =========================
     WALLPAPER CODE UNLOCKS
  ========================= */

  useEffect(() => {
    localStorage.setItem(
      "my-os-unlocked-wallpapers",
      JSON.stringify(unlockedWallpaperIds)
    );
  }, [unlockedWallpaperIds]);

  function unlockWallpaperCode() {
    const code = wallpaperCode.trim().toUpperCase();
    const unlocked = codeWallpapers[code];

    if (!unlocked) {
      setWallpaperCodeMessage("INVALID CODE");
      return;
    }

    setUnlockedWallpaperIds((current) =>
      current.includes(unlocked.id) ? current : [...current, unlocked.id]
    );
    setWallpaperCode("");
    setWallpaperCodeMessage(`${unlocked.name.toUpperCase()} UNLOCKED`);
  }

  /* =========================
     SAVE PERSONALIZATION
  ========================= */

  useEffect(() => {
    localStorage.setItem(
      "my-os-theme",
      theme
    );
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(
      "my-os-background",
      background
    );
  }, [background]);

  useEffect(() => {
    localStorage.setItem(
      "my-os-live-wallpaper",
      liveWallpaper
    );
  }, [liveWallpaper]);

  useEffect(() => {
    localStorage.setItem(
      "my-os-cursor",
      cursorStyle
    );
  }, [cursorStyle]);

  useEffect(() => {
    localStorage.setItem(
      "my-os-cursor-tracking",
      cursorTracking
    );
  }, [cursorTracking]);

  useEffect(() => {
    localStorage.setItem(
      "my-os-search-engine",
      searchEngine
    );
  }, [searchEngine]);

  useEffect(() => {
    localStorage.setItem(
      "my-os-messages",
      JSON.stringify(conversations)
    );
  }, [conversations]);

  /* =========================
     MESSAGES V2 ACCOUNT SESSION
  ========================= */

  useEffect(() => {
    if (!messagesToken) {
      setMessagesAccount(null);
      return;
    }

    let cancelled = false;

    async function restoreMessagesSession() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/me`,
          {
            headers: {
              Authorization: `Bearer ${messagesToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Session expired.");
        }

        const data = await response.json();

        if (!cancelled) {
          setMessagesAccount(data.user);
        }
      } catch (error) {
        if (cancelled) return;

        console.error(
          "Could not restore Messages account:",
          error
        );

        localStorage.removeItem(
          "my-os-auth-token"
        );

        setMessagesToken("");
        setMessagesAccount(null);
      }
    }

    restoreMessagesSession();

    return () => {
      cancelled = true;
    };
  }, [messagesToken]);

  useEffect(() => {
    if (!background.startsWith("admin-")) return;
    if (messagesToken && messagesAccount === null) return;
    if (messagesAccount?.role === "admin") return;

    setBackground("grid");
  }, [background, messagesToken, messagesAccount]);

  async function submitMessagesAuth(event) {
    event?.preventDefault();
    setMessagesAuthError("");

    const username = messagesAuthUsername.trim();
    const password = messagesAuthPassword;

    if (!username || !password) {
      setMessagesAuthError("Enter a username and password.");
      return;
    }

    if (
      messagesAuthMode === "signup" &&
      password !== messagesAuthConfirm
    ) {
      setMessagesAuthError("Passwords do not match.");
      return;
    }

    setMessagesAuthLoading(true);

    try {
      const endpoint =
        messagesAuthMode === "signup"
          ? "signup"
          : "login";

      const response = await fetch(
        `${API_BASE_URL}/api/auth/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Account request failed."
        );
      }

      localStorage.setItem(
        "my-os-auth-token",
        data.token
      );

      setMessagesToken(data.token);
      setMessagesAccount(data.user);
      setMessagesAuthPassword("");
      setMessagesAuthConfirm("");
    } catch (error) {
      setMessagesAuthError(
        error.message ||
          "Could not connect to Aether OS accounts."
      );
    } finally {
      setMessagesAuthLoading(false);
    }
  }

  function signOutMessages() {
    localStorage.removeItem("my-os-auth-token");
    setMessagesToken("");
    setMessagesAccount(null);
    setUserSearch("");
    setUserSearchResults([]);

    setConversations((current) =>
      current.filter(
        (conversation) => !conversation.online
      )
    );
  }

  async function searchMessagesUsers() {
    const query = userSearch.trim();

    if (query.length < 2 || !messagesToken) {
      setUserSearchResults([]);
      return;
    }

    setUserSearchLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/users/search?q=${encodeURIComponent(
          query
        )}`,
        {
          headers: {
            Authorization: `Bearer ${messagesToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Search failed."
        );
      }

      setUserSearchResults(
        data.users || []
      );
    } catch (error) {
      setMessagesAuthError(
        error.message ||
          "Could not search users."
      );
    } finally {
      setUserSearchLoading(false);
    }
  }

  function mergeOnlineConversation(
    remoteConversation
  ) {
    if (
      !remoteConversation?.id ||
      !remoteConversation?.otherUser
    ) {
      return;
    }

    const onlineConversation = {
      id: remoteConversation.id,
      name:
        remoteConversation.otherUser.displayName ||
        remoteConversation.otherUser.username,
      username:
        remoteConversation.otherUser.username,
      status:
        `@${remoteConversation.otherUser.username} · ONLINE ACCOUNT`,
      unread: 0,
      messages: [],
      online: true,
    };

    setConversations((current) => {
      const existing = current.find(
        (conversation) =>
          conversation.id ===
          onlineConversation.id
      );

      if (existing) {
        return current.map((conversation) =>
          conversation.id ===
          onlineConversation.id
            ? {
                ...conversation,
                ...onlineConversation,
                messages:
                  conversation.messages || [],
              }
            : conversation
        );
      }

      return [
        ...current,
        onlineConversation,
      ];
    });
  }

  async function loadOnlineConversations() {
    if (!messagesToken || !messagesAccount) {
      return;
    }

    setOnlineConversationsLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/conversations`,
        {
          headers: {
            Authorization: `Bearer ${messagesToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Could not load conversations."
        );
      }

      for (
        const conversation of
        data.conversations || []
      ) {
        mergeOnlineConversation(
          conversation
        );
      }
    } catch (error) {
      console.error(
        "Could not load online conversations:",
        error
      );
    } finally {
      setOnlineConversationsLoading(false);
    }
  }

  useEffect(() => {
    if (!messagesAccount || !messagesToken) {
      return;
    }

    loadOnlineConversations();
  }, [messagesAccount?.id, messagesToken]);

  async function loadOnlineMessages(
    conversationId
  ) {
    if (
      !messagesToken ||
      !messagesAccount ||
      !conversationId
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/conversations/${conversationId}/messages`,
        {
          headers: {
            Authorization: `Bearer ${messagesToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Could not load messages."
        );
      }

      const remoteMessages = (
        data.messages || []
      ).map((message) => ({
        id: message.id,
        sender:
          message.senderId ===
          messagesAccount.id
            ? "me"
            : "them",
        text: message.content,
        time: new Date(
          message.createdAt
        ).toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        }),
      }));

      setConversations((current) =>
        current.map((conversation) =>
          conversation.id ===
            conversationId &&
          conversation.online
            ? {
                ...conversation,
                messages: remoteMessages,
              }
            : conversation
        )
      );
    } catch (error) {
      console.error(
        "Could not load online messages:",
        error
      );
    }
  }

  useEffect(() => {
    if (
      !messagesToken ||
      !messagesAccount ||
      !activeConversationId
    ) {
      return;
    }

    const activeOnlineConversation =
      conversations.find(
        (conversation) =>
          conversation.id ===
            activeConversationId &&
          conversation.online
      );

    if (!activeOnlineConversation) {
      return;
    }

    loadOnlineMessages(
      activeConversationId
    );

    const messagePoll = setInterval(() => {
      loadOnlineMessages(
        activeConversationId
      );
    }, 1500);

    return () =>
      clearInterval(messagePoll);
  }, [
    activeConversationId,
    messagesToken,
    messagesAccount?.id,
  ]);

  async function startOnlineConversation(user) {
    if (!messagesToken || !user?.id) return;

    setUserSearchLoading(true);
    setMessagesAuthError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/conversations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${messagesToken}`,
          },
          body: JSON.stringify({
            userId: user.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Could not start conversation."
        );
      }

      mergeOnlineConversation(
        data.conversation
      );

      setActiveConversationId(
        data.conversation.id
      );

      setUserSearch("");
      setUserSearchResults([]);
    } catch (error) {
      console.error(
        "Could not start online conversation:",
        error
      );

      setMessagesAuthError(
        error.message ||
          "Could not start conversation."
      );
    } finally {
      setUserSearchLoading(false);
    }
  }

  /* =========================
     START PROXY
  ========================= */

  useEffect(() => {
    async function startProxy() {
      try {
        await setupBareMux();

        setProxyStatus("Ready");

        console.log(
          "BareMux connected!"
        );

        await setupScramjet();

        setScramjetStatus("Ready");

        console.log(
          "Scramjet connected!"
        );
      } catch (error) {
        console.error(
          "Startup failed:",
          error
        );

        setStartupDiagnosticError(
          `${error?.name || "Error"}: ${error?.message || String(error)}`
        );

        setScramjetStatus("Failed");
      }
    }

    startProxy();
  }, []);

  /* =========================
     BROWSER
  ========================= */

  function openBrowser() {
    setBrowserOpen(true);
    setBrowserMinimized(false);
  }

  function openNeonTV() {
    const scramjet = getScramjet();

    if (!scramjet) {
      console.error(
        "Scramjet is not ready."
      );
      return;
    }

    const url = "https://dulo.gd";

    setNeonTVUrl(
      scramjet.encodeUrl(url)
    );

    setNeonTVOpen(true);
  }

  function closeNeonTV() {
    setNeonTVOpen(false);
  }

  function updateActiveTab(changes) {
    setTabs((currentTabs) =>
      currentTabs.map((tab) =>
        tab.id === activeTabId
          ? {
              ...tab,
              ...changes,
            }
          : tab
      )
    );
  }

  function convertInputToUrl(input) {
    const cleanInput = input.trim();

    if (!cleanInput) {
      return null;
    }

    const hasProtocol =
      cleanInput.startsWith("http://") ||
      cleanInput.startsWith("https://");

    const looksLikeWebsite =
      cleanInput.includes(".") &&
      !cleanInput.includes(" ");

    if (hasProtocol) {
      return cleanInput;
    }

    if (looksLikeWebsite) {
      return "https://" + cleanInput;
    }

    const query =
      encodeURIComponent(cleanInput);

    const searchUrls = {
      google:
        `https://www.google.com/search?q=${query}`,

      bing:
        `https://www.bing.com/search?q=${query}`,

      duckduckgo:
        `https://duckduckgo.com/?q=${query}`,

      brave:
        `https://search.brave.com/search?q=${query}`,

      yahoo:
        `https://search.yahoo.com/search?p=${query}`,
    };

    return (
      searchUrls[searchEngine] ||
      searchUrls.google
    );
  }

  function navigate() {
    if (!activeTab) return;

    const input =
      activeTab.address.trim();

    if (!input) return;

    const url =
      convertInputToUrl(input);

    if (!url) return;

    const scramjet =
      getScramjet();

    if (!scramjet) {
      console.error(
        "Scramjet is not ready."
      );

      return;
    }

    const encodedUrl =
      scramjet.encodeUrl(url);

    let title = input;

    if (title.length > 20) {
      title =
        title.slice(0, 20) + "...";
    }

    updateActiveTab({
      pageUrl: encodedUrl,
      title,
    });
  }

  /* =========================
     DESKTOP SEARCH
  ========================= */

  function searchFromDesktop() {
    const input =
      desktopSearch.trim();

    if (!input) return;

    const scramjet =
      getScramjet();

    if (!scramjet) {
      console.error(
        "Scramjet is not ready."
      );

      return;
    }

    const url =
      convertInputToUrl(input);

    if (!url) return;

    const encodedUrl =
      scramjet.encodeUrl(url);

    let title = input;

    if (title.length > 20) {
      title =
        title.slice(0, 20) + "...";
    }

    setTabs((currentTabs) =>
      currentTabs.map((tab) =>
        tab.id === activeTabId
          ? {
              ...tab,
              address: input,
              pageUrl: encodedUrl,
              title,
            }
          : tab
      )
    );

    setBrowserOpen(true);
    setBrowserMinimized(false);
    setDesktopSearch("");
  }

  /* =========================
     BROWSER CONTROLS
  ========================= */

  function getActiveFrame() {
    return frameRefs.current[
      activeTabId
    ];
  }

  function goBack() {
    try {
      getActiveFrame()
        ?.contentWindow
        ?.history
        .back();
    } catch (error) {
      console.error(
        "Could not go back:",
        error
      );
    }
  }

  function goForward() {
    try {
      getActiveFrame()
        ?.contentWindow
        ?.history
        .forward();
    } catch (error) {
      console.error(
        "Could not go forward:",
        error
      );
    }
  }

  function reloadPage() {
    try {
      getActiveFrame()
        ?.contentWindow
        ?.location
        .reload();
    } catch (error) {
      console.error(
        "Could not reload:",
        error
      );
    }
  }

  /* =========================
     TABS
  ========================= */

  function createTab() {
    const newId = Date.now();

    const newTab = {
      id: newId,
      title: "New Tab",
      address: "",
      pageUrl: "",
    };

    setTabs((currentTabs) => [
      ...currentTabs,
      newTab,
    ]);

    setActiveTabId(newId);
  }

  function closeTab(tabId) {
    if (tabs.length === 1) {
      const newId = Date.now();

      setTabs([
        {
          id: newId,
          title: "New Tab",
          address: "",
          pageUrl: "",
        },
      ]);

      delete frameRefs.current[
        tabId
      ];

      setActiveTabId(newId);

      return;
    }

    const tabIndex =
      tabs.findIndex(
        (tab) => tab.id === tabId
      );

    const remainingTabs =
      tabs.filter(
        (tab) => tab.id !== tabId
      );

    setTabs(remainingTabs);

    delete frameRefs.current[
      tabId
    ];

    if (activeTabId === tabId) {
      const nextTab =
        remainingTabs[
          Math.min(
            tabIndex,
            remainingTabs.length - 1
          )
        ];

      setActiveTabId(
        nextTab.id
      );
    }
  }

  /* =========================
     WINDOW MOVE / RESIZE
  ========================= */

  function clampWindowRect(
    rect,
    minWidth,
    minHeight
  ) {
    const maxWidth = Math.max(
      minWidth,
      window.innerWidth
    );

    const maxHeight = Math.max(
      minHeight,
      window.innerHeight - 72
    );

    const width = Math.min(
      Math.max(rect.width, minWidth),
      maxWidth
    );

    const height = Math.min(
      Math.max(rect.height, minHeight),
      maxHeight
    );

    return {
      x: Math.min(
        Math.max(rect.x, 0),
        Math.max(
          0,
          window.innerWidth - width
        )
      ),
      y: Math.min(
        Math.max(rect.y, 0),
        Math.max(
          0,
          window.innerHeight - height
        )
      ),
      width,
      height,
    };
  }

  function beginWindowInteraction(
    event,
    type,
    edge,
    rect,
    setRect,
    minWidth,
    minHeight
  ) {
    if (event.button !== 0) return;

    event.preventDefault();

    windowInteractionRef.current = {
      type,
      edge,
      startX: event.clientX,
      startY: event.clientY,
      startRect: { ...rect },
      setRect,
      minWidth,
      minHeight,
    };

    setWindowInteractionActive(true);
  }

  useEffect(() => {
    function handleWindowPointerMove(event) {
      const interaction =
        windowInteractionRef.current;

      if (!interaction) return;

      const dx =
        event.clientX -
        interaction.startX;

      const dy =
        event.clientY -
        interaction.startY;

      const start =
        interaction.startRect;

      if (interaction.type === "move") {
        interaction.setRect(
          clampWindowRect(
            {
              ...start,
              x: start.x + dx,
              y: start.y + dy,
            },
            interaction.minWidth,
            interaction.minHeight
          )
        );

        return;
      }

      let next = { ...start };
      const edge = interaction.edge;

      if (edge.includes("e")) {
        next.width =
          start.width + dx;
      }

      if (edge.includes("s")) {
        next.height =
          start.height + dy;
      }

      if (edge.includes("w")) {
        next.x = start.x + dx;
        next.width =
          start.width - dx;
      }

      if (edge.includes("n")) {
        next.y = start.y + dy;
        next.height =
          start.height - dy;
      }

      if (
        next.width <
        interaction.minWidth
      ) {
        if (edge.includes("w")) {
          next.x =
            start.x +
            start.width -
            interaction.minWidth;
        }

        next.width =
          interaction.minWidth;
      }

      if (
        next.height <
        interaction.minHeight
      ) {
        if (edge.includes("n")) {
          next.y =
            start.y +
            start.height -
            interaction.minHeight;
        }

        next.height =
          interaction.minHeight;
      }

      interaction.setRect(
        clampWindowRect(
          next,
          interaction.minWidth,
          interaction.minHeight
        )
      );
    }

    function endWindowInteraction() {
      if (
        !windowInteractionRef.current
      ) {
        return;
      }

      windowInteractionRef.current =
        null;

      setWindowInteractionActive(false);
      setResizeHoverEdge("");
    }

    window.addEventListener(
      "pointermove",
      handleWindowPointerMove
    );

    window.addEventListener(
      "pointerup",
      endWindowInteraction
    );

    window.addEventListener(
      "pointercancel",
      endWindowInteraction
    );

    return () => {
      window.removeEventListener(
        "pointermove",
        handleWindowPointerMove
      );

      window.removeEventListener(
        "pointerup",
        endWindowInteraction
      );

      window.removeEventListener(
        "pointercancel",
        endWindowInteraction
      );
    };
  }, []);

  function renderResizeHandles(
    rect,
    setRect,
    minWidth,
    minHeight,
    disabled = false
  ) {
    if (disabled) return null;

    return [
      "n",
      "e",
      "s",
      "w",
      "ne",
      "nw",
      "se",
      "sw",
    ].map((edge) => (
      <div
        key={edge}
        className={`window-resize-handle resize-${edge} ${
          resizeHoverEdge === edge
            ? "resize-hovered"
            : ""
        }`}
        onPointerEnter={() =>
          setResizeHoverEdge(edge)
        }
        onPointerLeave={() =>
          setResizeHoverEdge("")
        }
        onPointerDown={(event) => {
          setResizeHoverEdge(edge);

          beginWindowInteraction(
            event,
            "resize",
            edge,
            rect,
            setRect,
            minWidth,
            minHeight
          );
        }}
      />
    ));
  }

  /* =========================
     BROWSER WINDOW
  ========================= */

  function minimizeBrowser() {
    setBrowserMinimized(true);
  }

  function toggleMaximize() {
    setBrowserMaximized(
      (current) => !current
    );
  }

  function closeBrowser() {
    setBrowserOpen(false);
    setBrowserMinimized(false);
    setBrowserMaximized(false);
  }

  /* =========================
     SETTINGS
  ========================= */

  function openSettings() {
    setSettingsOpen(true);
    setSettingsMinimized(false);
  }

  function minimizeSettings() {
    setSettingsMinimized(true);
  }

  function closeSettings() {
    setSettingsOpen(false);
    setSettingsMinimized(false);
  }

  /* =========================
     MESSAGES
  ========================= */

  function openMessages() {
    setMessagesOpen(true);
    setMessagesMinimized(false);

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id ===
        activeConversationId
          ? {
              ...conversation,
              unread: 0,
            }
          : conversation
      )
    );
  }

  function minimizeMessages() {
    setMessagesMinimized(true);
  }

  function closeMessages() {
    setMessagesOpen(false);
    setMessagesMinimized(false);
  }

  function selectConversation(
    conversationId
  ) {
    setActiveConversationId(
      conversationId
    );

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id ===
        conversationId
          ? {
              ...conversation,
              unread: 0,
            }
          : conversation
      )
    );
  }

  async function sendMessage() {
    const text = messageDraft.trim();

    if (!text) return;

    const currentConversation =
      conversations.find(
        (conversation) =>
          conversation.id ===
          activeConversationId
      );

    if (!currentConversation) return;

    /*
      Online conversations go through the Aether OS API
      and are stored in Supabase.
    */
    if (currentConversation.online) {
      if (!messagesToken) return;

      setMessageDraft("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/conversations/${activeConversationId}/messages`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${messagesToken}`,
            },
            body: JSON.stringify({
              content: text,
            }),
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Could not send message."
          );
        }

        await loadOnlineMessages(
          activeConversationId
        );
      } catch (error) {
        console.error(
          "Could not send online message:",
          error
        );

        setMessageDraft(text);
      }

      return;
    }

    /*
      Existing local conversations keep their
      original local-only behavior.
    */
    const sentAt =
      new Date().toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id ===
        activeConversationId
          ? {
              ...conversation,
              messages: [
                ...conversation.messages,
                {
                  id: Date.now(),
                  sender: "me",
                  text,
                  time: sentAt,
                },
              ],
            }
          : conversation
      )
    );

    setMessageDraft("");
  }

  function createConversation() {
    const id = `contact-${Date.now()}`;
    const number = conversations.length + 1;

    setConversations((current) => [
      ...current,
      {
        id,
        name: `Contact ${number}`,
        status: "NEW LOCAL CONTACT",
        unread: 0,
        messages: [],
      },
    ]);

    setActiveConversationId(id);
  }

  const activeConversation =
    conversations.find(
      (conversation) =>
        conversation.id === activeConversationId
    ) || conversations[0];

  const totalUnread = conversations.reduce(
    (total, conversation) =>
      total + (conversation.unread || 0),
    0
  );

  /* =========================
     START MENU
  ========================= */

  function launchFromStart(app) {
    setStartMenuOpen(false);
    setStartSearch("");

    if (app === "browser") openBrowser();
    if (app === "neontv") openNeonTV();
    if (app === "messages") openMessages();
    if (app === "settings") openSettings();
  }

  useEffect(() => {
    function handleStartMenuKey(event) {
      if (event.key === "Escape") {
        setStartMenuOpen(false);
      }
    }

    window.addEventListener(
      "keydown",
      handleStartMenuKey
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleStartMenuKey
      );
  }, []);

  /* =========================
     DATE / TIME
  ========================= */

  const clockText =
    time.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

  const dateText =
    time.toLocaleDateString([], {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

  const unlockedCodeWallpapers = Object.values(codeWallpapers).filter(
    (wallpaper) => unlockedWallpaperIds.includes(wallpaper.id)
  );

  const availableLiveWallpapers = [
    ...liveWallpapers,
    ...unlockedCodeWallpapers,
  ];

  const activeLiveWallpaper =
    availableLiveWallpapers.find(
      (wallpaper) => wallpaper.id === liveWallpaper
    ) || null;

  return (
    <div
      className={`desktop theme-${theme} background-${background} cursor-mode-${cursorStyle} ${
        activeLiveWallpaper
          ? "has-live-wallpaper"
          : ""
      } ${
        resizeHoverEdge
          ? `window-resize-active resize-cursor-${resizeHoverEdge}`
          : ""
      }`}
    >
      {enterAnimationActive && (
        <div className="aether-enter-screen">
          <div className="aether-enter-core">
            <div className="aether-enter-ring aether-enter-ring-one"></div>
            <div className="aether-enter-ring aether-enter-ring-two"></div>
            <div className="aether-enter-mark">A</div>
          </div>
          <div className="aether-enter-title">AETHER OS</div>
          <div className="aether-enter-status">SYSTEM READY · PRESS ENTER</div>
          <div className="aether-enter-loader"><span></span></div>
          <button
            type="button"
            className="aether-enter-button"
            onClick={() => setEnterAnimationActive(false)}
          >
            ENTER
          </button>
        </div>
      )}

      {scramjetStatus !== "Ready" && (
        <div
          aria-live="polite"
          style={{
            position: "fixed",
            top: "12px",
            left: "12px",
            zIndex: 2147483647,
            width: "min(460px, calc(100vw - 24px))",
            padding: "12px 14px",
            border: "2px solid #7eeeff",
            borderRadius: "10px",
            background: "#050914",
            color: "#ffffff",
            fontFamily: "monospace",
            fontSize: "13px",
            lineHeight: 1.5,
            boxShadow: "0 0 24px rgba(126, 238, 255, 0.45)",
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: "6px" }}>
            AETHER SJ DIAGNOSTIC
          </div>
          <div>BAREMUX: {proxyStatus.toUpperCase()}</div>
          <div>SCRAMJET: {scramjetStatus.toUpperCase()}</div>
          <div>
            STAGE: {proxyStatus === "Ready" ? "SCRAMJET" : "BAREMUX"}
          </div>
          {startupDiagnosticError && (
            <div
              style={{
                marginTop: "6px",
                color: "#ffd0d0",
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
              }}
            >
              ERROR: {startupDiagnosticError}
            </div>
          )}
        </div>
      )}

      {!activeLiveWallpaper && background === "grid" && (
        <div className="cyber-grid-remake" aria-hidden="true">
          <div className="cyber-grid-sky-glow"></div>
          <div className="cyber-grid-floor">
            <div className="cyber-grid-plane">
              {cyberGridLines.map((line) => (
                <span
                  key={`grid-h-${line}`}
                  className="cyber-grid-line cyber-grid-line-horizontal"
                  style={{ "--grid-index": line }}
                ></span>
              ))}

              {cyberGridColumns.map((column) => (
                <span
                  key={`grid-v-${column}`}
                  className="cyber-grid-line cyber-grid-line-vertical"
                  style={{ "--grid-index": column }}
                ></span>
              ))}
            </div>
          </div>
          <div className="cyber-grid-horizon"></div>
          <div className="cyber-grid-scan"></div>
        </div>
      )}

      {!activeLiveWallpaper && background === "matrix" && (
        <div className="matrix-rain-remake" aria-hidden="true">
          <div className="matrix-rain-glow"></div>

          {matrixColumns.map((column) => (
            <span
              key={column.id}
              className="matrix-rain-column"
              style={{
                left: column.left,
                animationDelay: column.delay,
                animationDuration: column.duration,
                opacity: column.opacity,
              }}
            >
              {column.text}
            </span>
          ))}

          <div className="matrix-rain-scan"></div>
        </div>
      )}

      {activeLiveWallpaper && (
        <div
          className="live-wallpaper-layer"
          aria-hidden="true"
        >
          <video
            key={activeLiveWallpaper.src}
            className="live-wallpaper-video"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onError={(event) => {
              console.error(
                "Aether wallpaper video failed to load:",
                activeLiveWallpaper.src,
                event.currentTarget.error
              );
            }}
          >
            <source src={activeLiveWallpaper.src} type="video/mp4" />
          </video>

          <div className="live-wallpaper-shade"></div>
        </div>
      )}

      <div
        ref={cursorGlowRef}
        className="cursor-glow"
      ></div>

      <div
        ref={cursorDotRef}
        className="cursor-dot"
      ></div>

      <div
        className="system-telemetry"
        aria-label="System telemetry"
      >
        <div
          className={`fps-counter ${
            fps >= 55
              ? "fps-good"
              : fps >= 30
                ? "fps-mid"
                : "fps-low"
          }`}
          title="Live interface frames per second"
          aria-label={`Current FPS: ${fps}`}
        >
          <span className="fps-light"></span>
          <span className="fps-value">
            {fps}
          </span>
          <span className="fps-label">
            FPS
          </span>
        </div>

        <div
          className={`battery-counter ${
            battery.charging
              ? "charging"
              : ""
          }`}
          title={
            battery.supported === false
              ? "Battery information is not available in this browser"
              : battery.charging
                ? "Battery is charging"
                : "Battery level"
          }
          aria-label={
            battery.supported === true
              ? `Battery ${battery.level} percent${
                  battery.charging
                    ? ", charging"
                    : ""
                }`
              : "Battery information unavailable"
          }
        >
          <span
            className="battery-icon"
            aria-hidden="true"
          >
            <span
              className="battery-fill"
              style={{
                width:
                  battery.supported === true
                    ? `${Math.max(
                        4,
                        battery.level
                      )}%`
                    : "0%",
              }}
            ></span>
          </span>

          <span className="battery-value">
            {battery.supported === null
              ? "--%"
              : battery.supported
                ? `${battery.level}%`
                : "N/A"}
          </span>

          {battery.charging && (
            <span
              className="battery-charge"
              aria-hidden="true"
            >
              ϟ
            </span>
          )}
        </div>
      </div>

      {/* =====================
          DASHBOARD
      ====================== */}

      <main className="desktop-dashboard">
        <div className="clock">
          {clockText}
        </div>

        <div className="date">
          {dateText}
        </div>

        <div className="desktop-search">
          <span className="search-icon">
            ⌕
          </span>

          <input
            type="text"
            value={desktopSearch}
            placeholder="Search the web or enter a URL..."
            onChange={(event) =>
              setDesktopSearch(
                event.target.value
              )
            }
            onKeyDown={(event) => {
              if (
                event.key === "Enter"
              ) {
                searchFromDesktop();
              }
            }}
          />

          <button
            onClick={searchFromDesktop}
          >
            GO
          </button>
        </div>

        <div className="desktop-info-row">
          <div className="weather-widget">
            <div className="weather-icon">
              {weather.icon}
            </div>

            <div className="weather-copy">
              <span className="weather-location">
                LOCAL WEATHER
              </span>

              <strong>
                {weather.temperature !== null
                  ? `${weather.temperature}°F · ${weather.condition}`
                  : weather.condition}
              </strong>
            </div>
          </div>

          <div
            className={
              scramjetStatus === "Ready"
                ? "sj-indicator active"
                : "sj-indicator"
            }
            title="Scramjet status"
          >
            <span className="sj-light"></span>
            <span>SJ</span>
          </div>
        </div>
      </main>

      {/* =====================
          BROWSER
      ====================== */}

      {browserOpen && (
        <div
          className="window browser-window custom-sized-window"
          style={{
            ...(browserMaximized
              ? {
                  width: "100vw",
                  height: "100vh",
                  top: "0",
                  left: "0",
                  borderRadius: "0",
                }
              : {
                  width: `${browserRect.width}px`,
                  height: `${browserRect.height}px`,
                  left: `${browserRect.x}px`,
                  top: `${browserRect.y}px`,
                  transform: "none",
                }),

            display:
              browserMinimized
                ? "none"
                : undefined,
          }}
        >
          {renderResizeHandles(
            browserRect,
            setBrowserRect,
            560,
            360,
            browserMaximized
          )}

          <div
            className={`window-top ${
              browserMaximized
                ? ""
                : "window-drag-handle"
            }`}
            onPointerDown={(event) => {
              if (
                browserMaximized ||
                event.target.closest("button")
              ) {
                return;
              }

              beginWindowInteraction(
                event,
                "move",
                "",
                browserRect,
                setBrowserRect,
                560,
                360
              );
            }}
            onDoubleClick={() =>
              toggleMaximize()
            }
          >
            <span className="window-title">
              <span className="mini-app-icon browser-icon">
                <span></span>
              </span>

              Browser
            </span>

            <div>
              <button
                onClick={minimizeBrowser}
              >
                —
              </button>

              <button
                onClick={toggleMaximize}
              >
                {browserMaximized
                  ? "❐"
                  : "□"}
              </button>

              <button
                onClick={closeBrowser}
              >
                ✕
              </button>
            </div>
          </div>

          <div className="tab-strip">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={
                  tab.id === activeTabId
                    ? "browser-tab active"
                    : "browser-tab"
                }
                onClick={() =>
                  setActiveTabId(tab.id)
                }
              >
                <span>{tab.title}</span>

                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    closeTab(tab.id);
                  }}
                >
                  ×
                </button>
              </div>
            ))}

            <button
              className="new-tab-button"
              onClick={createTab}
            >
              +
            </button>
          </div>

          <div className="browser-bar">
            <button onClick={goBack}>
              ←
            </button>

            <button onClick={goForward}>
              →
            </button>

            <button onClick={reloadPage}>
              ↻
            </button>

            <input
              type="text"
              value={
                activeTab?.address || ""
              }
              placeholder="Search or enter a URL"
              onChange={(event) =>
                updateActiveTab({
                  address:
                    event.target.value,
                })
              }
              onKeyDown={(event) => {
                if (
                  event.key === "Enter"
                ) {
                  navigate();
                }
              }}
            />

            <button onClick={navigate}>
              Go
            </button>
          </div>

          <div className="browser-page">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                style={{
                  width: "100%",
                  height: "100%",
                  display:
                    tab.id === activeTabId
                      ? "block"
                      : "none",
                }}
              >
                {tab.pageUrl ? (
                  <iframe
                    ref={(element) => {
                      if (element) {
                        frameRefs.current[
                          tab.id
                        ] = element;
                      }
                    }}
                    src={tab.pageUrl}
                    title={`Browser Tab ${tab.id}`}
                  />
                ) : (
                  <div className="new-tab-page">
                    <div className="new-tab-logo">
                      ◉
                    </div>

                    <h2>
                      AETHER OS BROWSER
                    </h2>

                    <p>
                      Explore the web through Aether OS
                    </p>

                    <div className="new-tab-search">
                      <span>⌕</span>

                      <input
                        type="text"
                        value={
                          activeTab?.address ||
                          ""
                        }
                        placeholder="Search the web..."
                        onChange={(event) =>
                          updateActiveTab({
                            address:
                              event.target.value,
                          })
                        }
                        onKeyDown={(event) => {
                          if (
                            event.key ===
                            "Enter"
                          ) {
                            navigate();
                          }
                        }}
                        autoFocus
                      />

                      <button
                        onClick={navigate}
                      >
                        GO
                      </button>
                    </div>

                    <div className="new-tab-status">
                      <div
                        className={
                          scramjetStatus ===
                          "Ready"
                            ? "sj-indicator active"
                            : "sj-indicator"
                        }
                        title="Scramjet status"
                      >
                        <span className="sj-light"></span>
                        <span>SJ</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================
          AETHER TV
      ====================== */}

      {neonTVOpen && (
        <section
          className="neontv-app"
          aria-label="Aether TV"
        >
          <iframe
            className="neontv-frame"
            src={neonTVUrl}
            title="Aether TV"
          />

          <button
            className="neontv-exit"
            onClick={closeNeonTV}
            title="Exit Aether TV"
            aria-label="Exit Aether TV"
          >
            ✕
          </button>
        </section>
      )}

      {/* =====================
          MESSAGES
      ====================== */}

      {messagesOpen && (
        <div
          className="window messages-window custom-sized-window"
          style={{
            width: `${messagesRect.width}px`,
            height: `${messagesRect.height}px`,
            left: `${messagesRect.x}px`,
            top: `${messagesRect.y}px`,
            transform: "none",
            display:
              messagesMinimized
                ? "none"
                : undefined,
          }}
        >
          {renderResizeHandles(
            messagesRect,
            setMessagesRect,
            620,
            430
          )}

          <div
            className="window-top window-drag-handle"
            onPointerDown={(event) => {
              if (
                event.target.closest(
                  "button"
                )
              ) {
                return;
              }

              beginWindowInteraction(
                event,
                "move",
                "",
                messagesRect,
                setMessagesRect,
                620,
                430
              );
            }}
          >
            <span className="window-title">
              <span className="mini-app-icon messages-icon">
                <span></span>
              </span>

              Messages
            </span>

            <div>
              <button
                onClick={minimizeMessages}
              >
                —
              </button>

              <button
                onClick={closeMessages}
              >
                ✕
              </button>
            </div>
          </div>

          {!messagesAccount ? (
            <div className="messages-auth-shell">
              <div className="messages-auth-panel">
                <div className="messages-auth-mark">
                  ◈
                </div>

                <span className="messages-auth-kicker">
                  AETHER OS NETWORK
                </span>

                <h2>
                  {messagesAuthMode ===
                  "signup"
                    ? "Create your account"
                    : "Welcome back"}
                </h2>

                <p>
                  Use a Aether OS username to
                  sign in to Messages. No
                  email required.
                </p>

                <div className="messages-auth-tabs">
                  <button
                    className={
                      messagesAuthMode ===
                      "login"
                        ? "active"
                        : ""
                    }
                    onClick={() => {
                      setMessagesAuthMode(
                        "login"
                      );
                      setMessagesAuthError(
                        ""
                      );
                    }}
                  >
                    Sign In
                  </button>

                  <button
                    className={
                      messagesAuthMode ===
                      "signup"
                        ? "active"
                        : ""
                    }
                    onClick={() => {
                      setMessagesAuthMode(
                        "signup"
                      );
                      setMessagesAuthError(
                        ""
                      );
                    }}
                  >
                    Create Account
                  </button>
                </div>

                <form
                  className="messages-auth-form"
                  onSubmit={
                    submitMessagesAuth
                  }
                >
                  <label>
                    <span>USERNAME</span>

                    <input
                      value={
                        messagesAuthUsername
                      }
                      onChange={(event) =>
                        setMessagesAuthUsername(
                          event.target.value
                        )
                      }
                      placeholder="your_username"
                      autoComplete="username"
                      maxLength={24}
                    />
                  </label>

                  <label>
                    <span>PASSWORD</span>

                    <input
                      type="password"
                      value={
                        messagesAuthPassword
                      }
                      onChange={(event) =>
                        setMessagesAuthPassword(
                          event.target.value
                        )
                      }
                      placeholder="8+ characters"
                      autoComplete={
                        messagesAuthMode ===
                        "signup"
                          ? "new-password"
                          : "current-password"
                      }
                    />
                  </label>

                  {messagesAuthMode ===
                    "signup" && (
                    <label>
                      <span>
                        CONFIRM PASSWORD
                      </span>

                      <input
                        type="password"
                        value={
                          messagesAuthConfirm
                        }
                        onChange={(event) =>
                          setMessagesAuthConfirm(
                            event.target.value
                          )
                        }
                        placeholder="Type it again"
                        autoComplete="new-password"
                      />
                    </label>
                  )}

                  {messagesAuthError && (
                    <div className="messages-auth-error">
                      {messagesAuthError}
                    </div>
                  )}

                  <button
                    type="button"
                    className="messages-auth-submit"
                    disabled={
                      messagesAuthLoading
                    }
                    onClick={
                      submitMessagesAuth
                    }
                  >
                    {messagesAuthLoading
                      ? "CONNECTING..."
                      : messagesAuthMode ===
                          "signup"
                        ? "CREATE ACCOUNT"
                        : "SIGN IN"}
                  </button>
                </form>

                <small className="messages-auth-note">
                  Your password is sent only
                  to your local Aether OS server
                  for verification.
                </small>
              </div>
            </div>
          ) : (
            <div className="messages-layout">
              <aside className="messages-sidebar">
                <div className="messages-sidebar-head">
                  <div>
                    <span>
                      AETHER OS ACCOUNT
                    </span>

                    <strong>
                      @{messagesAccount?.username}
                    </strong>
                  </div>

                  <button
                    className="messages-signout-button"
                    onClick={
                      signOutMessages
                    }
                    title="Sign out"
                  >
                    OUT
                  </button>
                </div>

                <div className="messages-user-search">
                  <div className="messages-user-search-row">
                    <input
                      value={userSearch}
                      placeholder="Find a username..."
                      onChange={(event) =>
                        setUserSearch(
                          event.target.value
                        )
                      }
                      onKeyDown={(event) => {
                        if (
                          event.key ===
                          "Enter"
                        ) {
                          searchMessagesUsers();
                        }
                      }}
                    />

                    <button
                      onClick={
                        searchMessagesUsers
                      }
                      disabled={
                        userSearchLoading
                      }
                    >
                      {userSearchLoading
                        ? "..."
                        : "⌕"}
                    </button>
                  </div>

                  {userSearchResults.length >
                    0 && (
                    <div className="messages-user-results">
                      {userSearchResults.map(
                        (user) => (
                          <button
                            key={user.id}
                            onClick={() =>
                              startOnlineConversation(
                                user
                              )
                            }
                          >
                            <span className="conversation-avatar">
                              {(
                                user.displayName ||
                                user.username
                              )
                                .slice(0, 1)
                                .toUpperCase()}
                            </span>

                            <span>
                              <strong>
                                {user.displayName ||
                                  user.username}
                              </strong>

                              <small>
                                @{user.username}
                              </small>
                            </span>
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>

                <div className="conversation-list">
                  {onlineConversationsLoading && (
                    <div className="messages-auth-note">
                      Loading online
                      conversations...
                    </div>
                  )}

                  {conversations.map(
                    (conversation) => {
                      const lastMessage =
                        conversation.messages[
                          conversation
                            .messages.length -
                            1
                        ];

                      return (
                        <button
                          key={
                            conversation.id
                          }
                          className={`conversation-item ${
                            conversation.id ===
                            activeConversationId
                              ? "active"
                              : ""
                          }`}
                          onClick={() =>
                            selectConversation(
                              conversation.id
                            )
                          }
                        >
                          <span className="conversation-avatar">
                            {conversation.name
                              .slice(0, 1)
                              .toUpperCase()}
                          </span>

                          <span className="conversation-copy">
                            <span className="conversation-name-row">
                              <strong>
                                {
                                  conversation.name
                                }
                              </strong>

                              {lastMessage && (
                                <small>
                                  {
                                    lastMessage.time
                                  }
                                </small>
                              )}
                            </span>

                            <span className="conversation-preview">
                              {lastMessage
                                ? lastMessage.text
                                : "Start a conversation"}
                            </span>
                          </span>

                          {conversation.unread >
                            0 && (
                            <span className="conversation-unread">
                              {
                                conversation.unread
                              }
                            </span>
                          )}
                        </button>
                      );
                    }
                  )}
                </div>
              </aside>

              <section className="messages-chat">
                <header className="messages-chat-head">
                  <span className="conversation-avatar large">
                    {activeConversation?.name
                      ?.slice(0, 1)
                      .toUpperCase()}
                  </span>

                  <div>
                    <strong>
                      {
                        activeConversation?.name
                      }
                    </strong>

                    <small>
                      {
                        activeConversation?.status
                      }
                    </small>
                  </div>
                </header>

                <div className="message-thread">
                  {activeConversation?.messages
                    .length ? (
                    activeConversation.messages.map(
                      (message) => (
                        <div
                          key={message.id}
                          className={`message-row ${
                            message.sender ===
                            "me"
                              ? "mine"
                              : "theirs"
                          }`}
                        >
                          <div className="message-bubble">
                            <span>
                              {message.text}
                            </span>

                            <small>
                              {message.time}
                            </small>
                          </div>
                        </div>
                      )
                    )
                  ) : (
                    <div className="empty-conversation">
                      <span>◇</span>
                      <strong>
                        New conversation
                      </strong>
                      <small>
                        {activeConversation?.online
                          ? "Send the first message."
                          : "Send the first local message."}
                      </small>
                    </div>
                  )}
                </div>

                <div className="message-composer">
                  <input
                    type="text"
                    value={messageDraft}
                    maxLength={4000}
                    placeholder={`Message ${
                      activeConversation?.name ||
                      ""
                    }`}
                    onChange={(event) =>
                      setMessageDraft(
                        event.target.value
                      )
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter"
                      ) {
                        sendMessage();
                      }
                    }}
                  />

                  <button
                    onClick={sendMessage}
                    disabled={
                      !messageDraft.trim()
                    }
                    aria-label="Send message"
                    title="Send message"
                  >
                    ➤
                  </button>
                </div>
              </section>
            </div>
          )}
        </div>
      )}

      {/* =====================
          SETTINGS
      ====================== */}

      {settingsOpen && (
        <div
          className="window settings-window custom-sized-window"
          style={{
            width: `${settingsRect.width}px`,
            height: `${settingsRect.height}px`,
            left: `${settingsRect.x}px`,
            top: `${settingsRect.y}px`,
            transform: "none",
            display:
              settingsMinimized
                ? "none"
                : undefined,
          }}
        >
          {renderResizeHandles(
            settingsRect,
            setSettingsRect,
            520,
            420
          )}

          <div
            className="window-top window-drag-handle"
            onPointerDown={(event) => {
              if (
                event.target.closest(
                  "button"
                )
              ) {
                return;
              }

              beginWindowInteraction(
                event,
                "move",
                "",
                settingsRect,
                setSettingsRect,
                520,
                420
              );
            }}
          >
            <span className="window-title">
              <span className="mini-app-icon settings-icon">
                <span></span>
              </span>

              Settings
            </span>

            <div>
              <button
                onClick={
                  minimizeSettings
                }
              >
                —
              </button>

              <button
                onClick={
                  closeSettings
                }
              >
                ✕
              </button>
            </div>
          </div>

          <div className="settings-content">
            <div className="settings-heading">
              <span>
                PERSONALIZATION
              </span>

              <h2>
                Customize Aether OS
              </h2>

              <p>
                Choose your theme,
                background, cursor,
                and search engine.
              </p>
            </div>

            {/* THEME */}

            <div className="theme-grid">
              {themes.map(
                (themeOption) => (
                  <button
                    key={
                      themeOption.id
                    }
                    className={
                      theme ===
                      themeOption.id
                        ? `theme-card ${themeOption.id} selected`
                        : `theme-card ${themeOption.id}`
                    }
                    onClick={() =>
                      setTheme(
                        themeOption.id
                      )
                    }
                  >
                    <div className="theme-preview">
                      <span>
                        {
                          themeOption.icon
                        }
                      </span>

                      <div className="preview-window">
                        <div></div>
                        <div></div>
                        <div></div>
                      </div>
                    </div>

                    <div className="theme-info">
                      <strong>
                        {
                          themeOption.name
                        }
                      </strong>

                      <span>
                        {
                          themeOption.description
                        }
                      </span>
                    </div>

                    {theme ===
                      themeOption.id && (
                      <div className="theme-check">
                        ✓
                      </div>
                    )}
                  </button>
                )
              )}
            </div>

            {/* BACKGROUND */}

            <section className="settings-section">
              <div className="settings-section-title">
                <span>02</span>

                <div>
                  <strong>
                    Background
                  </strong>

                  <small>
                    Choose your
                    desktop environment
                  </small>
                </div>
              </div>

              <div className="option-grid">
                {backgrounds.map(
                  (
                    backgroundOption
                  ) => (
                    <button
                      key={
                        backgroundOption.id
                      }
                      className={
                        background ===
                        backgroundOption.id
                          ? "option-card selected"
                          : "option-card"
                      }
                      onClick={() => {
                        setBackground(
                          backgroundOption.id
                        );
                        setLiveWallpaper("");
                      }}
                    >
                      <div
                        className={`option-preview background-preview-${backgroundOption.id}`}
                      >
                        <span>
                          {
                            backgroundOption.icon
                          }
                        </span>
                      </div>

                      <div className="option-copy">
                        <strong>
                          {
                            backgroundOption.name
                          }
                        </strong>

                        <small>
                          {
                            backgroundOption.description
                          }
                        </small>
                      </div>

                      {background ===
                        backgroundOption.id && (
                        <span className="option-check">
                          ✓
                        </span>
                      )}
                    </button>
                  )
                )}
              </div>
            </section>

            {/* ADMIN WALLPAPERS */}

            {messagesAccount?.role === "admin" && (
              <section className="settings-section admin-wallpaper-section">
                <div className="settings-section-title">
                  <span>AX</span>

                  <div>
                    <strong>Admin Wallpapers</strong>
                    <small>Exclusive environments for Aether OS administrators</small>
                  </div>
                </div>

                <div className="admin-wallpaper-banner">
                  <span>ADMIN ACCESS</span>
                  <strong>{messagesAccount.displayName || messagesAccount.username}</strong>
                </div>

                <div className="option-grid admin-wallpaper-grid">
                  {adminBackgrounds.map((backgroundOption) => (
                    <button
                      key={backgroundOption.id}
                      className={
                        background === backgroundOption.id
                          ? "option-card admin-wallpaper-card selected"
                          : "option-card admin-wallpaper-card"
                      }
                      onClick={() => {
                        setBackground(backgroundOption.id);
                        setLiveWallpaper("");
                      }}
                    >
                      <div
                        className={`option-preview background-preview-${backgroundOption.id}`}
                      >
                        <span>{backgroundOption.icon}</span>
                        <b>ADMIN</b>
                      </div>

                      <div className="option-copy">
                        <strong>{backgroundOption.name}</strong>
                        <small>{backgroundOption.description}</small>
                      </div>

                      {background === backgroundOption.id && (
                        <span className="option-check">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* LIVE WALLPAPERS */}

            <section className="settings-section">
              <div className="settings-section-title">
                <span>03</span>

                <div>
                  <strong>Live Wallpapers</strong>

                  <small>
                    Animated video backgrounds
                  </small>
                </div>
              </div>

              <div className="option-grid live-wallpaper-grid">
                <div className="wallpaper-code-panel">
                  <div className="wallpaper-code-copy">
                    <strong>WALLPAPER CODE</strong>
                    <small>Enter an Aether wallpaper unlock code.</small>
                  </div>
                  <div className="wallpaper-code-entry">
                    <input
                      type="text"
                      value={wallpaperCode}
                      placeholder="ENTER CODE"
                      autoComplete="off"
                      spellCheck="false"
                      onChange={(event) => {
                        setWallpaperCode(event.target.value);
                        setWallpaperCodeMessage("");
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") unlockWallpaperCode();
                      }}
                    />
                    <button type="button" onClick={unlockWallpaperCode}>
                      UNLOCK
                    </button>
                  </div>
                  {wallpaperCodeMessage && (
                    <span className={`wallpaper-code-message ${
                      wallpaperCodeMessage === "INVALID CODE" ? "error" : "success"
                    }`}>
                      {wallpaperCodeMessage}
                    </span>
                  )}
                </div>

                {availableLiveWallpapers.map((wallpaperOption) => (
                  <button
                    key={wallpaperOption.id}
                    className={
                      liveWallpaper === wallpaperOption.id
                        ? "option-card live-wallpaper-card selected"
                        : "option-card live-wallpaper-card"
                    }
                    onClick={() => {
                      setLiveWallpaper("");
                      setBackground("");

                      requestAnimationFrame(() => {
                        setLiveWallpaper(wallpaperOption.id);
                      });
                    }}
                  >
                    <div className="option-preview live-wallpaper-preview">
                      <b>LIVE</b>
                    </div>

                    <div className="option-copy">
                      <strong>{wallpaperOption.name}</strong>
                      <small>{wallpaperOption.description}</small>
                    </div>

                    {liveWallpaper === wallpaperOption.id && (
                      <span className="option-check">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </section>

            {/* CURSOR */}

            <section className="settings-section">
              <div className="settings-section-title">
                <span>04</span>

                <div>
                  <strong>
                    Cursor
                  </strong>

                  <small>
                    Choose how your
                    pointer looks
                  </small>
                </div>
              </div>

              <div className="option-grid">
                {cursors.map(
                  (cursorOption) => (
                    <button
                      key={
                        cursorOption.id
                      }
                      className={
                        cursorStyle ===
                        cursorOption.id
                          ? "option-card selected"
                          : "option-card"
                      }
                      onClick={() =>
                        setCursorStyle(
                          cursorOption.id
                        )
                      }
                    >
                      <div className="option-preview">
                        <span>
                          {
                            cursorOption.icon
                          }
                        </span>
                      </div>

                      <div className="option-copy">
                        <strong>
                          {
                            cursorOption.name
                          }
                        </strong>

                        <small>
                          {
                            cursorOption.description
                          }
                        </small>
                      </div>

                      {cursorStyle ===
                        cursorOption.id && (
                        <span className="option-check">
                          ✓
                        </span>
                      )}
                    </button>
                  )
                )}
              </div>
            </section>

            {/* CURSOR TRACKING */}

            <section className="settings-section">
              <div className="settings-section-title">
                <span>05</span>

                <div>
                  <strong>
                    Cursor Tracking
                  </strong>

                  <small>
                    Choose whether the cursor trails or stays locked to the pointer
                  </small>
                </div>
              </div>

              <div className="option-grid">
                <button
                  className={
                    cursorTracking === "smooth"
                      ? "option-card selected"
                      : "option-card"
                  }
                  onClick={() => setCursorTracking("smooth")}
                >
                  <div className="option-preview">
                    <span>≈</span>
                  </div>

                  <div className="option-copy">
                    <strong>Smooth</strong>
                    <small>Glow follows behind the pointer</small>
                  </div>

                  {cursorTracking === "smooth" && (
                    <span className="option-check">✓</span>
                  )}
                </button>

                <button
                  className={
                    cursorTracking === "locked"
                      ? "option-card selected"
                      : "option-card"
                  }
                  onClick={() => setCursorTracking("locked")}
                >
                  <div className="option-preview">
                    <span>⊙</span>
                  </div>

                  <div className="option-copy">
                    <strong>Locked</strong>
                    <small>Dot and cursor stay directly together</small>
                  </div>

                  {cursorTracking === "locked" && (
                    <span className="option-check">✓</span>
                  )}
                </button>
              </div>
            </section>

            {/* SEARCH ENGINE */}

            <section className="settings-section">
              <div className="settings-section-title">
                <span>06</span>

                <div>
                  <strong>
                    Search Engine
                  </strong>

                  <small>
                    Desktop and
                    browser searches
                  </small>
                </div>
              </div>

              <div className="search-engine-grid">
                {searchEngines.map(
                  (
                    engineOption
                  ) => (
                    <button
                      key={
                        engineOption.id
                      }
                      className={
                        searchEngine ===
                        engineOption.id
                          ? "search-engine-card selected"
                          : "search-engine-card"
                      }
                      onClick={() =>
                        setSearchEngine(
                          engineOption.id
                        )
                      }
                    >
                      <span className="search-engine-logo">
                        {
                          engineOption.icon
                        }
                      </span>

                      <span>
                        {
                          engineOption.name
                        }
                      </span>

                      {searchEngine ===
                        engineOption.id && (
                        <span className="search-engine-check">
                          ✓
                        </span>
                      )}
                    </button>
                  )
                )}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* =====================
          START MENU
      ====================== */}      {startMenuOpen && (
        <>
          <button
            className="start-menu-backdrop"
            aria-label="Close Start menu"
            onClick={() => setStartMenuOpen(false)}
          ></button>

          <section className="start-menu" aria-label="Start menu">
            <div className="start-menu-header">
              <div>
                <span className="start-menu-kicker">AETHER OS</span>
                <h2>Applications</h2>
              </div>
              <span className="start-menu-status">● ONLINE</span>
            </div>

            <div className="start-menu-search">
              <span>⌕</span>
              <input
                value={startSearch}
                placeholder="Search apps..."
                autoFocus
                onChange={(event) => setStartSearch(event.target.value)}
              />
            </div>

            <div className="start-menu-grid">
              {[
                { id: "browser", name: "Browser", icon: "◎", ready: true },
                { id: "neontv", name: "Aether TV", icon: "▶", ready: true },
                { id: "messages", name: "Messages", icon: "◆", ready: true },
                { id: "settings", name: "Settings", icon: "✦", ready: true },
                { id: "files", name: "Files", icon: "▰", ready: false },
                { id: "notes", name: "Notes", icon: "▤", ready: false },
                { id: "terminal", name: "Terminal", icon: ">_", ready: false },
                { id: "calculator", name: "Calculator", icon: "±", ready: false },
              ]
                .filter((app) =>
                  app.name.toLowerCase().includes(startSearch.toLowerCase())
                )
                .map((app) => (
                  <button
                    key={app.id}
                    className={`start-app ${app.ready ? "" : "coming-soon"}`}
                    onClick={() => app.ready && launchFromStart(app.id)}
                    title={app.ready ? `Open ${app.name}` : `${app.name} coming soon`}
                  >
                    {app.id === "browser" ? (
                      <span className="start-app-icon custom-app-icon browser-icon" aria-hidden="true">
                        <span></span>
                      </span>
                    ) : app.id === "neontv" ? (
                      <span className="start-app-icon neon-tv-icon" aria-hidden="true">
                        <span className="neon-tv-screen">
                          <span className="neon-tv-play"></span>
                        </span>
                      </span>
                    ) : app.id === "messages" ? (
                      <span className="start-app-icon custom-app-icon messages-icon" aria-hidden="true">
                        <span></span>
                      </span>
                    ) : app.id === "settings" ? (
                      <span className="start-app-icon custom-app-icon settings-icon" aria-hidden="true">
                        <span></span>
                      </span>
                    ) : (
                      <span className="start-app-icon">{app.icon}</span>
                    )}

                    <strong>{app.name}</strong>

                    {!app.ready && <small>COMING SOON</small>}
                  </button>
                ))}
            </div>

            <div className="start-menu-footer">
              <div className="start-user">
                <span className="start-avatar">J</span>

                <div>
                  <strong>AETHER OS USER</strong>
                  <small>LOCAL SESSION</small>
                </div>
              </div>

              <button
                className="start-power"
                title="Power controls coming soon"
                onClick={() => setStartMenuOpen(false)}
              >
                ⏻
              </button>
            </div>
          </section>
        </>
      )}

      {windowInteractionActive && (
        <div
          className="window-interaction-shield"
          aria-hidden="true"
        ></div>
      )}

      {/* =====================
          TASKBAR
      ====================== */}

      <div className="taskbar">
        <button
          className={`start-button ${startMenuOpen ? "active" : ""}`}
          onClick={() => setStartMenuOpen((open) => !open)}
          title="Start"
          aria-label="Open Start menu"
        >
          <span className="myos-start-icon" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </span>

          <span className="taskbar-label">Start</span>
        </button>

        <button
          onClick={openBrowser}
          title="Browser"
        >
          <span className="taskbar-icon custom-app-icon browser-icon">
            <span></span>
          </span>

          <span className="taskbar-label">
            Browser
          </span>

          {browserOpen && (
            <span className="running-dot"></span>
          )}
        </button>

        <button
          onClick={openNeonTV}
          title="Aether TV"
        >
          <span
            className="taskbar-icon neon-tv-icon"
            aria-hidden="true"
          >
            <span className="neon-tv-screen">
              <span className="neon-tv-play"></span>
            </span>
          </span>

          <span className="taskbar-label">
            Aether TV
          </span>

          {neonTVOpen && (
            <span className="running-dot"></span>
          )}
        </button>

        <button
          title="Messages"
          onClick={openMessages}
          className="messages-taskbar-button"
        >
          <span className="taskbar-icon custom-app-icon messages-icon">
            <span></span>
          </span>

          <span className="taskbar-label">
            Messages
          </span>

          {messagesOpen && (
            <span className="running-dot"></span>
          )}

          {totalUnread > 0 && (
            <span className="taskbar-unread-badge">
              {totalUnread > 9 ? "9+" : totalUnread}
            </span>
          )}
        </button>

        <button
          title="Settings"
          onClick={openSettings}
        >
          <span className="taskbar-icon custom-app-icon settings-icon">
            <span></span>
          </span>

          <span className="taskbar-label">
            Settings
          </span>

          {settingsOpen && (
            <span className="running-dot"></span>
          )}
        </button>
      </div>
    </div>
  );
}

export default App;