
import { useEffect, useState, type ChangeEvent } from "react";
import "./timetable.css";

type ClassItem = {
  subject: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
  faculty: string;
};

const API = "http://localhost:5000/api/timetable";

const dayNames = [
  "Sunday", "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "Saturday",
];

function getToken() {
  return localStorage.getItem("token");
}

function base64ToBytes(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);

  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

export default function Timetable() {
  const [file, setFile] = useState<File | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void loadTimetable();
    // Load the student's saved timetable whenever this page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function request(
    path: string,
    options: RequestInit = {}
  ) {
    const token = getToken();
    if (!token) throw new Error("Please log in again.");

    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Request failed.");
    }

    return data;
  }

  async function loadTimetable() {
    try {
      const data = await request("");
      setClasses(data.classes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load timetable.");
    }
  }

  async function uploadTimetable() {
    if (!file) {
      setError("Choose a timetable file first.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const form = new FormData();
      form.append("document", file);

      const data = await request("/upload", {
        method: "POST",
        body: form,
      });

      setClasses(data.classes || []);
      setMessage(
  `Successfully processed and saved ${data.totalClasses ?? data.classes?.length ?? 0} classes.`
);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setLoading(false);
    }
  }
 function addClass() {
  setClasses((previous) => [
    ...previous,
    {
      subject: "",
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "10:00",
      room: "",
      faculty: "",
    },
  ]);

  setError("");
  setMessage("New class added. Fill in the details and save.");
}
  function updateClass(
    index: number,
    field: keyof ClassItem,
    value: string
  ) {
    setClasses((previous) =>
      previous.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: field === "dayOfWeek" ? Number(value) : value,
            }
          : item
      )
    );
  }

  async function saveTimetable() {
    const invalidClass = classes.some((item) => {
  return (
    !item.subject.trim() ||
    !item.startTime ||
    !item.endTime ||
    item.startTime >= item.endTime
  );
});

if (invalidClass) {
  setError(
    "Please enter each subject and valid start/end times. End time must be after start time."
  );
  return;
}
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const data = await request("", {
        method: "PUT",
        body: JSON.stringify({ classes }),
      });

      setClasses(data.classes || []);
      setMessage("Timetable saved. Class reminders are scheduled.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save timetable.");
    } finally {
      setLoading(false);
    }
  }

  async function enableNotifications() {
    setError("");
    setMessage("");

    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error("Push notifications are not supported in this browser.");
      }

      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        throw new Error("Allow notifications in browser settings to continue.");
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const keyData = await request("/push/public-key");
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64ToBytes(keyData.publicKey),
        });
      }

      await request("/push/subscribe", {
        method: "POST",
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });

      setMessage("Class push notifications enabled on this browser.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not enable notifications.");
    }
  }

  async function testNotification() {
    try {
      const data = await request("/push/test", { method: "POST" });
      setMessage(
        `Test push request sent. Push service accepted: ${data.deliveredToPushService}.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test notification failed.");
    }
  }

  return (
    <main className="academic-planner">
      <header className="planner-header">
        <button
          type="button"
          className="planner-back"
          onClick={() => (window.location.href = "/dashboard")}
        >
          ← Back to Dashboard
        </button>
        <p className="planner-eyebrow">WEEKLY CLASS SCHEDULE</p>
        <h1>Timetable & Reminders</h1>
        <p className="planner-description">
          Upload your college timetable, verify each class, and get reminders
          15 minutes before it starts.
        </p>
      </header>

      <section className="planner-card">
        <h2>1. Upload timetable file</h2>
        <p>Supported formats: PDF, PPTX, DOCX, TXT, PNG, JPG, or JPEG  (up to 10 MB).</p>
        <input
          type="file"
          accept=".pdf,.pptx,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setFile(event.target.files?.[0] || null)
          }
        />
        {file && <p>{file.name}</p>}
        <button
          className="planner-upload-button"
          disabled={loading || !file}
          onClick={uploadTimetable}
        >
          {loading ? "Processing..." : "Extract Classes"}
        </button>
      </section>


<section className="planner-card timetable-review">
  <div className="timetable-section-heading">
    <div>
      <span className="timetable-eyebrow">STEP 02</span>
      <h2>Review your weekly classes</h2>
      <p>Check your subjects, timings, rooms, and faculty before saving.</p>
    </div>
    <span className="timetable-count">
      {classes.length} {classes.length === 1 ? "class" : "classes"}
    </span>
  </div>

  <div className="timetable-toolbar">
    <button
      type="button"
      className="timetable-add-button"
      onClick={addClass}
      disabled={loading}
    >
      <span>＋</span> Add Class Manually
    </button>

    <button
      type="button"
      className="timetable-load-button"
      onClick={loadTimetable}
      disabled={loading}
    >
      {loading ? "Loading..." : "↻ Load Saved Timetable"}
    </button>
  </div>

  {classes.length === 0 ? (
    <div className="timetable-empty">
      <span className="timetable-empty-icon">▦</span>
      <h3>No classes added yet</h3>
      <p>Add a class manually or load your previously saved timetable.</p>
    </div>
  ) : (
    <div className="timetable-class-list">
      {classes.map((item, index) => (
        <article
          className="timetable-class-card"
          key={`${index}-${item.subject}`}
        >
          <div className="timetable-card-top">
            <span className="timetable-class-number">
              CLASS {String(index + 1).padStart(2, "0")}
            </span>
            <button
              type="button"
              className="timetable-remove-button"
              onClick={() =>
                setClasses((previous) =>
                  previous.filter((_, i) => i !== index)
                )
              }
              aria-label={`Remove ${item.subject || "class"}`}
            >
              Remove class
            </button>
          </div>

          <div className="timetable-fields-grid">
            <label className="timetable-field timetable-subject-field">
              <span>Subject</span>
              <input
                value={item.subject}
                placeholder="e.g. Data Structures"
                onChange={(e) =>
                  updateClass(index, "subject", e.target.value)
                }
              />
            </label>

            <label className="timetable-field">
              <span>Day</span>
              <select
                value={item.dayOfWeek}
                onChange={(e) =>
                  updateClass(index, "dayOfWeek", e.target.value)
                }
              >
                {dayNames.map((day, number) => (
                  <option value={number} key={day}>
                    {day}
                  </option>
                ))}
              </select>
            </label>

            <label className="timetable-field">
              <span>Start time</span>
              <input
                type="time"
                value={item.startTime}
                onChange={(e) =>
                  updateClass(index, "startTime", e.target.value)
                }
              />
            </label>

            <label className="timetable-field">
              <span>End time</span>
              <input
                type="time"
                value={item.endTime}
                onChange={(e) =>
                  updateClass(index, "endTime", e.target.value)
                }
              />
            </label>

            <label className="timetable-field">
              <span>Room</span>
              <input
                value={item.room || ""}
                placeholder="Room / lab"
                onChange={(e) =>
                  updateClass(index, "room", e.target.value)
                }
              />
            </label>

            <label className="timetable-field">
              <span>Faculty</span>
              <input
                value={item.faculty || ""}
                placeholder="Faculty name"
                onChange={(e) =>
                  updateClass(index, "faculty", e.target.value)
                }
              />
            </label>
          </div>
        </article>
      ))}
    </div>
  )}

  <div className="timetable-save-row">
    <span className="timetable-save-hint">
      Review every class before saving.
    </span>
    <button
      type="button"
      className="timetable-save-button"
      disabled={loading || classes.length === 0}
      onClick={saveTimetable}
    >
      ✓ Save Verified Timetable
    </button>
  </div>
</section>

<section className="planner-card timetable-reminders">
  <div className="timetable-section-heading">
    <div>
      <span className="timetable-eyebrow">STEP 03</span>
      <h2>Enable 15-minute reminders</h2>
      <p>Receive a browser notification before each scheduled class.</p>
    </div>
    <span className="timetable-reminder-icon">♧</span>
  </div>

  <div className="timetable-reminder-note">
    <strong>Stay on schedule</strong>
    <p>
      Allow browser notifications and keep the backend server running
      for scheduled reminders.
    </p>
  </div>

  <div className="timetable-reminder-actions">
    <button type="button" onClick={enableNotifications}>
      Enable Push Notifications
    </button>
    <button
      type="button"
      className="timetable-test-button"
      onClick={testNotification}
    >
      Send Test Notification
    </button>
  </div>
</section>

      {message && <p className="planner-message planner-success">{message}</p>}
      {error && <p className="planner-message planner-error" role="alert">{error}</p>}
    </main>
  );
}
