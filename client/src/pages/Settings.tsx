
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import "./Settings.css";

type Preferences = {
  theme: string;
  language: string;
  fontSize: string;
  reducedMotion: boolean;
  notifications: {
    tasks: boolean;
    exams: boolean;
    study: boolean;
    focus: boolean;
  };
};

const defaults: Preferences = {
  theme: "light",
  language: "English",
  fontSize: "medium",
  reducedMotion: false,
  notifications: {
    tasks: true,
    exams: true,
    study: true,
    focus: false,
  },
};

const avatars = [
  { id: "panda", label: "Panda", emoji: "🐼" },
  { id: "kitten", label: "Kitten", emoji: "🐱" },
  { id: "bear-cub", label: "Bear Cub", emoji: "🐻" },
  { id: "puppy", label: "Puppy", emoji: "🐶" },
];

export default function Settings() {
  const [section, setSection] = useState("general");
  const [buddy, setBuddy] = useState(
    localStorage.getItem("studyBuddy") || "panda"
  );
const [personalAvatar] = useState(
  () => localStorage.getItem("personalAvatar") || ""
);

const [personalAvatarName] = useState(
  () => localStorage.getItem("personalAvatarName") || ""
);
  const [hours, setHours] = useState("6");
  const [studyTime, setStudyTime] = useState("evening");
  const [preferences, setPreferences] = useState<Preferences>(() => {
    try {
      const saved = localStorage.getItem("appPreferences");
      if (!saved) return defaults;

      const parsed = JSON.parse(saved);
      return {
        ...defaults,
        ...parsed,
        notifications: {
          ...defaults.notifications,
          ...parsed.notifications,
        },
      };
    } catch {
      return defaults;
    }
  });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [notificationsMessage, setNotificationsMessage] = useState("");
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>(() => {
      if (typeof window === "undefined" || !("Notification" in window)) {
        return "denied";
      }

      return Notification.permission;
    });
  const [enablingNotifications, setEnablingNotifications] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("pushNotificationsEnabled") === "true";
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("http://localhost:5000/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Could not load profile");
        return response.json();
      })
      .then((data) => {
        const user = data.user || data;
        if (user.availableHours != null) {
          setHours(String(user.availableHours));
        }
        if (user.preferredStudyTime) {
          setStudyTime(user.preferredStudyTime);
        }
        if (user.studyBuddy) setBuddy(user.studyBuddy);
      })
      .catch((error) => console.error("Profile loading error:", error));
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = preferences.theme;
    document.documentElement.dataset.fontSize = preferences.fontSize;
    document.documentElement.dataset.reducedMotion =
      String(preferences.reducedMotion);

    localStorage.setItem("appPreferences", JSON.stringify(preferences));
  }, [preferences]);
  const updatePreference = (key: keyof Preferences, value: unknown) => {
    setPreferences((previous) => ({ ...previous, [key]: value }));
  };

  const updateNotification = (
    key: keyof Preferences["notifications"],
    value: boolean
  ) => {
    setPreferences((previous) => ({
      ...previous,
      notifications: { ...previous.notifications, [key]: value },
    }));
  };
  const enableNotifications = async () => {
    setEnablingNotifications(true);
    setNotificationsMessage("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Please log in before enabling notifications.");
      }

      if (!("Notification" in window)) {
        throw new Error("Your browser does not support notifications.");
      }

      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error("Push notifications are not supported in this browser.");
      }

      if (!window.isSecureContext && window.location.hostname !== "localhost") {
        throw new Error("Notifications require HTTPS or localhost.");
      }

      let permission = Notification.permission;

      if (permission === "default") {
        permission = await Notification.requestPermission();
      }

      setNotificationPermission(permission);

      if (permission !== "granted") {
        throw new Error(
          "Notifications were not allowed. Open your browser site settings and allow notifications, then try again."
        );
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const keyResponse = await fetch("http://localhost:5000/api/timetable/push/public-key", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const keyData = await keyResponse.json();

      if (!keyResponse.ok || !keyData.publicKey) {
        throw new Error(keyData.message || "Could not load the push public key.");
      }

      const base64ToUint8Array = (base64: string) => {
        const normalized = base64.replace(/-/g, "+").replace(/_/g, "/");
        const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
        const binary = atob(normalized + padding);
        return Uint8Array.from(binary, (character) => character.charCodeAt(0));
      };

      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64ToUint8Array(keyData.publicKey),
        });
      }

      const response = await fetch("http://localhost:5000/api/timetable/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subscription }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not save your push subscription.");
      }

      localStorage.setItem("pushNotificationsEnabled", "true");
      setNotificationsEnabled(true);
      setNotificationPermission("granted");
      setNotificationsMessage("Notifications Enabled ?");
    } catch (error) {
      localStorage.setItem("pushNotificationsEnabled", "false");
      setNotificationsEnabled(false);
      setNotificationsMessage(
        error instanceof Error ? error.message : "Could not enable notifications."
      );
      setNotificationPermission(typeof Notification !== "undefined" ? Notification.permission : "denied");
    } finally {
      setEnablingNotifications(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage("");

    try {
      if (!hours || Number(hours) < 1 || Number(hours) > 18) {
        throw new Error("Choose daily study hours between 1 and 18.");
      }

      localStorage.setItem("studyBuddy", buddy);
      localStorage.setItem("appPreferences", JSON.stringify(preferences));

      const token = localStorage.getItem("token");

      if (token) {
        const response = await fetch(
          "http://localhost:5000/api/auth/profile",
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              studyBuddy: buddy,
              availableHours: Number(hours),
              preferredStudyTime: studyTime,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Could not save study preferences.");
        }

        const user = data.user || data;
        if (user.name) localStorage.setItem("user", JSON.stringify(user));
      }

      setMessage("Your preferences have been saved! 💜");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  };

  const menu = [
    { id: "general", icon: "⚙️", label: "General" },
    { id: "appearance", icon: "🎨", label: "Appearance" },
    { id: "buddy", icon: "🐼", label: "Study Buddy" },
    { id: "study", icon: "📚", label: "Study Preferences" },
    { id: "notifications", icon: "🔔", label: "Notifications" },
    { id: "privacy", icon: "🔒", label: "Privacy & Account" },
  ];

  return (
    <main className="settings-page">
      <motion.div
        className="settings-layout"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <header className="settings-topbar">
          <button
            className="settings-back"
            onClick={() => (window.location.href = "/dashboard")}
          >
            ← Dashboard
          </button>
          <span className="settings-brand">✦ AI Student Manager</span>
        </header>

        <div className="settings-heading">
          <p className="settings-eyebrow">YOUR SPACE, YOUR RULES</p>
          <h1>Settings <span>⚙️</span></h1>
          <p>Personalize your study experience, one little detail at a time.</p>
        </div>

        <div className="settings-columns">
          <aside className="settings-menu">
           
<div className="settings-user">
  <div className="settings-avatar">
    {personalAvatar ? (
      <img
        src={personalAvatar}
        alt="Your personal avatar"
        className="settings-personal-avatar"
      />
    ) : (
      avatars.find((avatar) => avatar.id === buddy)?.emoji || "🐼"
    )}
  </div>

  <div className="settings-user-info">
    <strong>
      {personalAvatarName || "Your study space"}
    </strong>
    <small>Your personal space ✨</small>
    <button
      type="button"
      className="settings-avatar-edit"
      onClick={() => {
        window.location.href = "/create-avatar";
      }}
    >
      Change avatar →
    </button>
  </div>
</div>


            {menu.map((item) => (
              <button
                key={item.id}
                className={`settings-menu-item ${
                  section === item.id ? "active" : ""
                }`}
                onClick={() => {
                  setSection(item.id);
                  setMessage("");
                }}
              >
                <span>{item.icon}</span>
                {item.label}
                <span className="settings-menu-arrow">›</span>
              </button>
            ))}
          </aside>

          <section className="settings-panel">
            {section === "general" && (
              <>
                <h2>General preferences 🌷</h2>
                <p className="settings-muted">
                  Choose how you want to use your student manager.
                </p>

                <label htmlFor="language">Preferred language</label>
                <select
                  id="language"
                  value={preferences.language}
                  onChange={(e) =>
                    updatePreference("language", e.target.value)
                  }
                >
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Hinglish</option>
                </select>
                <p className="settings-hint">
                  Your choice is saved. Translating every page requires
                  language support across the app.
                </p>

                <label htmlFor="fontSize">Text size</label>
                <select
                  id="fontSize"
                  value={preferences.fontSize}
                  onChange={(e) =>
                    updatePreference("fontSize", e.target.value)
                  }
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>

                <Toggle
                  title="Reduce animations"
                  description="Use fewer moving effects across supported components."
                  checked={preferences.reducedMotion}
                  onChange={(value) =>
                    updatePreference("reducedMotion", value)
                  }
                />
              </>
            )}

            {section === "appearance" && (
              <>
                <h2>Appearance ✨</h2>
                <p className="settings-muted">
                  Make your workspace comfortable for your eyes.
                </p>

                <div className="theme-options">
                  {[
                    { id: "light", label: "Light", emoji: "☀️" },
                    { id: "dark", label: "Dark", emoji: "🌙" },
                    { id: "system", label: "System", emoji: "💻" },
                  ].map((theme) => (
                    <button
                      key={theme.id}
                      className={`theme-option ${
                        preferences.theme === theme.id ? "selected" : ""
                      }`}
                      onClick={() => updatePreference("theme", theme.id)}
                    >
                      <span>{theme.emoji}</span>
                      <strong>{theme.label}</strong>
                      {preferences.theme === theme.id && <small>✓ Selected</small>}
                    </button>
                  ))}
                </div>

                <p className="settings-hint">
                  Theme preference is saved. Dark and system themes may need
                  matching styles in other pages to change their full appearance.
                </p>
              </>
            )}

            {section === "buddy" && (
              <>
                <h2>Choose your Study Buddy 🐾</h2>
                <p className="settings-muted">
                  Pick the little companion you want by your side.
                </p>

                <div className="buddy-options">
  {avatars.map((avatar) => (
    <button
      key={avatar.id}
      type="button"
      className={`buddy-option ${
        buddy === avatar.id ? "selected" : ""
      }`}
      onClick={() => setBuddy(avatar.id)}
    >
      <img
        src={`/avatars/${avatar.id}.png`}
        alt={avatar.label}
        className="buddy-image"
      />

      <strong>{avatar.label}</strong>

      {buddy === avatar.id && <small>✓ Selected</small>}
    </button>
  ))}
</div>
              </>
            )}

            {section === "study" && (
              <>
                <h2>Study preferences 📚</h2>
                <p className="settings-muted">
                  Help your planner fit your daily routine.
                </p>

                <label htmlFor="hours">Daily study target (hours)</label>
                <input
                  id="hours"
                  type="number"
                  min="1"
                  max="18"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                />

                <label htmlFor="studyTime">Preferred study time</label>
                <select
                  id="studyTime"
                  value={studyTime}
                  onChange={(e) => setStudyTime(e.target.value)}
                >
                  <option value="morning">Morning 🌅</option>
                  <option value="afternoon">Afternoon ☀️</option>
                  <option value="evening">Evening 🌆</option>
                  <option value="night">Night 🌙</option>
                </select>
              </>
            )}

            {section === "notifications" && (
              <>
                <h2>Notifications ??</h2>
                <p className="settings-muted">
                  Select the reminders you want to enable.
                </p>

                <div className="browser-notifications-card">
                  <div className="browser-notifications-header">
                    <div>
                      <p className="browser-notifications-label">Browser Notifications</p>
                      <h3>Stay on top of class reminders</h3>
                    </div>
                    <span
                      className={`browser-notifications-status ${
                        notificationPermission === "granted"
                          ? "allowed"
                          : notificationPermission === "denied"
                            ? "blocked"
                            : "pending"
                      }`}
                    >
                      {notificationPermission === "granted" || notificationsEnabled
                        ? "Allowed"
                        : notificationPermission === "denied"
                          ? "Blocked"
                          : "Not requested"}
                    </span>
                  </div>

                  <p className="browser-notifications-copy">
                    Enable browser notifications to receive automatic class reminders and important study updates.
                  </p>

                  <button
                    type="button"
                    className="browser-notifications-button"
                    onClick={enableNotifications}
                    disabled={
                      enablingNotifications ||
                      notificationPermission === "granted" ||
                      notificationsEnabled
                    }
                  >
                    {enablingNotifications
                      ? "Enabling..."
                      : notificationPermission === "granted" || notificationsEnabled
                        ? "Notifications Enabled ?"
                        : "Allow Notifications"}
                  </button>

                  {notificationsMessage && (
                    <p
                      className={`browser-notifications-message ${notificationPermission === "denied" ? "error" : ""}`}
                      role="status"
                    >
                      {notificationsMessage}
                    </p>
                  )}
                </div>

                <Toggle
                  title="Task reminders"
                  description="Reminders for tasks and approaching deadlines."
                  checked={preferences.notifications.tasks}
                  onChange={(value) => updateNotification("tasks", value)}
                />
                <Toggle
                  title="Exam reminders"
                  description="Keep upcoming exams on your radar."
                  checked={preferences.notifications.exams}
                  onChange={(value) => updateNotification("exams", value)}
                />
                <Toggle
                  title="Daily study reminders"
                  description="A gentle nudge to follow your study routine."
                  checked={preferences.notifications.study}
                  onChange={(value) => updateNotification("study", value)}
                />
                <Toggle
                  title="Focus session updates"
                  description="Keep focus-session notifications enabled in your preferences."
                  checked={preferences.notifications.focus}
                  onChange={(value) => updateNotification("focus", value)}
                />
                <p className="settings-hint">
                  These switches save your preferences; browser notifications need the permission flow above to be enabled in this browser.
                </p>
              </>
            )}
            {section === "privacy" && (
              <>
                <h2>Privacy & Account 🔐</h2>
                <p className="settings-muted">
                  Manage your current session and stored preferences.
                </p>

                <div className="settings-info">
                  <strong>Personal preferences</strong>
                  <p>Theme, language, text size and reminder choices are saved in this browser.</p>
                </div>

                <button
                  className="settings-secondary"
                  onClick={() => {
                    localStorage.removeItem("appPreferences");
                    setPreferences(defaults);
                    setMessage("Preferences reset to defaults.");
                  }}
                >
                  Reset preferences
                </button>

                <button
                  className="settings-danger"
                  onClick={() => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    window.location.href = "/";
                  }}
                >
                  Log out of this account
                </button>
              </>
            )}

            <div className="settings-footer">
              <button
                className="settings-save"
                onClick={saveSettings}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              {message && (
                <p className="settings-message" role="status">{message}</p>
              )}
            </div>
          </section>
        </div>
      </motion.div>
    </main>
  );
}

function Toggle({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="settings-toggle-row">
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        className={`settings-switch ${checked ? "on" : ""}`}
        onClick={() => onChange(!checked)}
      >
        <span />
      </button>
    </div>
  );
}
