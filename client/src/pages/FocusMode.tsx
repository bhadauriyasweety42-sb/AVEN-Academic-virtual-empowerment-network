
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import "./FocusMode.css";

type FocusAudioContext = AudioContext & { __focusReady?: boolean };

function getAudioContext(): FocusAudioContext | null {
  try {
    const AudioContextClass = window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    const context = new AudioContextClass() as FocusAudioContext;
    context.__focusReady = true;
    return context;
  } catch (error) {
    console.warn("Could not initialize focus alarm audio:", error);
    return null;
  }
}

function playCompletionAlarm(audioContext: AudioContext) {
  if (audioContext.state === "suspended") {
    void audioContext.resume();
  }

  const now = audioContext.currentTime;

  // Three sharp, louder alarm beeps
  const beepTimes = [0, 0.45, 0.9];

  beepTimes.forEach((offset, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(
      index === 1 ? 1250 : 1000,
      now + offset
    );

    gain.gain.setValueAtTime(0.0001, now + offset);
    gain.gain.exponentialRampToValueAtTime(
      0.35,
      now + offset + 0.025
    );
    gain.gain.setValueAtTime(
      0.35,
      now + offset + 0.18
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + offset + 0.3
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start(now + offset);
    oscillator.stop(now + offset + 0.32);
  });
}

function FocusMode() {
  const [duration, setDuration] = useState(() => {
    const savedDuration = Number(localStorage.getItem("focusDuration"));
    return [15, 25, 45, 60].includes(savedDuration) ? savedDuration : 25;
  });
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const deadline = Number(localStorage.getItem("focusDeadline"));
    if (Number.isFinite(deadline) && deadline > 0) {
      return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    }
    const pausedRemaining = Number(localStorage.getItem("focusRemainingSeconds"));
    return Number.isFinite(pausedRemaining) && pausedRemaining > 0
      ? pausedRemaining
      : duration * 60;
  });
  const [isRunning, setIsRunning] = useState(() => {
    const deadline = Number(localStorage.getItem("focusDeadline"));
    return deadline > Date.now() && Boolean(localStorage.getItem("focusStartedAt"));
  });
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [startedAt, setStartedAt] = useState<string | null>(() =>
    localStorage.getItem("focusStartedAt")
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
const [soundEnabled, setSoundEnabled] = useState(
  () => localStorage.getItem("focusSoundEnabled") !== "false"
);
  const savingSessionRef = useRef(false);
  const completionHandledRef = useRef(false);
  const audioContextRef = useRef<FocusAudioContext | null>(null);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  const progress =
    duration > 0
      ? ((duration * 60 - secondsLeft) / (duration * 60)) * 100
      : 0;

  // Load this student's saved focus history.
  useEffect(() => {
    const loadFocusHistory = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please log in to save your focus sessions.");
        return;
      }

      try {
        const response = await fetch("http://localhost:5000/api/focus", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Could not load focus history.");
        }

        const data = await response.json();

        if (Array.isArray(data)) {
          setSessionsCompleted(data.length);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not load focus history."
        );
      }
    };

    loadFocusHistory();
  }, []);

  // Timer countdown.
  useEffect(() => {
    if (!isRunning) return;

    const timer = window.setInterval(() => {
      // Derive remaining time from timestamps so background tabs do not drift.
      const deadline = Number(localStorage.getItem("focusDeadline"));
      if (!Number.isFinite(deadline) || deadline <= 0) return;
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) {
        localStorage.removeItem("focusDeadline");
        setIsRunning(false);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isRunning]);

  // Stop the timer and alert the student exactly once when the timer reaches zero.
  useEffect(() => {
    if (secondsLeft !== 0 || !startedAt || completionHandledRef.current) return;
    completionHandledRef.current = true;
    setIsRunning(false);
    localStorage.removeItem("focusDeadline");
if (soundEnabled) {
  playCompletionAlarm(audioContextRef.current);
}
    setMessage("Your focus timer has finished. Your session is being saved.");
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification("Focus session complete! 🎉", {
          body: `You completed your ${duration}-minute focus session. Take a short break.`,
          icon: "/favicon.svg",
          tag: "focus-session-complete",
        });
      } catch (error) {
        console.warn("Could not show focus notification:", error);
      }
    }
  }, [secondsLeft, startedAt, duration,soundEnabled]);

const testAlarm = () => {
  if (!soundEnabled) {
    setMessage("Completion sound is turned off. Enable it to test the alarm.");
    return;
  }

  if (
    !audioContextRef.current ||
    audioContextRef.current.state === "closed"
  ) {
    audioContextRef.current = getAudioContext();
  }

  playCompletionAlarm(audioContextRef.current);
};

  // Save a completed session exactly once.
  useEffect(() => {
    if (secondsLeft !== 0 || !startedAt || savingSessionRef.current) {
      return;
    }

    savingSessionRef.current = true;

    const saveSession = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please log in again to save this session.");
        return;
      }

      setSaving(true);
      setError("");
      setMessage("");

      try {
        const response = await fetch("http://localhost:5000/api/focus", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            durationMinutes: duration,
            taskTitle: "General Focus",
            startedAt,
            completedAt: new Date().toISOString(),
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Could not save focus session.");
        }

        setSessionsCompleted((count) => count + 1);
        localStorage.removeItem("focusStartedAt");
        localStorage.removeItem("focusRemainingSeconds");
        setMessage("Focus session saved successfully! Your progress is recorded.");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not save focus session."
        );
        // Keep the completed session available for a retry.
        savingSessionRef.current = false;
      } finally {
        setSaving(false);
      }
    };

    saveSession();
  }, [secondsLeft, startedAt, duration]);

  const toggleTimer = () => {
    // Create/resume audio from a user gesture so the completion alarm is not
    // blocked by browser autoplay policies after the timer finishes.
    if (!audioContextRef.current || audioContextRef.current.state === "closed") {
      audioContextRef.current = getAudioContext();
    }
    if (audioContextRef.current?.state === "suspended") {
      void audioContextRef.current.resume();
    }
    if (isRunning) {
      setIsRunning(false);
      localStorage.setItem("focusRemainingSeconds", String(secondsLeft));
      localStorage.removeItem("focusDeadline");
      return;
    }

    if (secondsLeft === 0) return;

    if (!startedAt) {
      const start = new Date().toISOString();
      setStartedAt(start);
      completionHandledRef.current = false;
      setMessage("");
      setError("");
      localStorage.setItem("focusStartedAt", start);
      localStorage.setItem("focusDuration", String(duration));
      localStorage.removeItem("focusRemainingSeconds");
      localStorage.setItem("focusDeadline", String(Date.now() + secondsLeft * 1000));
    } else {
      // Resuming uses the remaining duration, not the original full duration.
      localStorage.removeItem("focusRemainingSeconds");
      localStorage.setItem("focusDeadline", String(Date.now() + secondsLeft * 1000));
    }

    setIsRunning(true);
  };

  const changeDuration = (value: number) => {
    setIsRunning(false);
    setDuration(value);
    localStorage.setItem("focusDuration", String(value));
    setSecondsLeft(value * 60);
    setStartedAt(null);
    completionHandledRef.current = false;
    localStorage.removeItem("focusDeadline");
    localStorage.removeItem("focusStartedAt");
    localStorage.removeItem("focusRemainingSeconds");
    savingSessionRef.current = false;
    setMessage("");
    setError("");
  };

  const resetTimer = () => {
    setIsRunning(false);
    setSecondsLeft(duration * 60);
    setStartedAt(null);
    completionHandledRef.current = false;
    localStorage.removeItem("focusDeadline");
    localStorage.removeItem("focusStartedAt");
    localStorage.removeItem("focusRemainingSeconds");
    savingSessionRef.current = false;
    setMessage("");
    setError("");
  };

  const retrySave = () => {
    if (secondsLeft === 0 && startedAt) {
      savingSessionRef.current = false;
      setError("");
      setSaving(false);
      // Changing the value retriggers the save effect.
      setStartedAt(new Date(new Date(startedAt).getTime() - 1).toISOString());
    }
  };

  return (
    <main className="focus-page">
      <header className="focus-header">
        <p className="focus-eyebrow">YOUR PERSONAL STUDY SPACE</p>
        <h1>Focus Mode ✨</h1>
        <p>One task at a time. Small steps, real progress.</p>
      </header>

      <motion.section
        className="focus-card"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="focus-label">FOCUS SESSION</p>

        <div
          className="focus-progress"
          style={{
            background: `conic-gradient(#9b83dc ${progress}%, #eee7f8 ${progress}% 100%)`,
          }}
        >
          <div className="focus-timer-inner">
            <span className="focus-time">
              {String(minutes).padStart(2, "0")}:
              {String(seconds).padStart(2, "0")}
            </span>

            <span className="focus-timer-caption">
              {saving
                ? "Saving your session..."
                : isRunning
                  ? "Stay focused"
                  : secondsLeft === 0
                    ? "Session complete!"
                    : "Ready when you are"}
            </span>
          </div>
        </div>

        <div className="focus-durations">
          {[15, 25, 45, 60].map((value) => (
            <button
              key={value}
              type="button"
              className={
                duration === value
                  ? "duration-btn selected"
                  : "duration-btn"
              }
              onClick={() => changeDuration(value)}
              disabled={isRunning || saving}
            >
              {value} min
            </button>
          ))}
        </div>

        <div className="focus-actions">
          <button
            type="button"
            className="focus-primary-btn"
            onClick={toggleTimer}
            disabled={secondsLeft === 0 || saving}
          >
            {isRunning ? "Pause" : "Start focusing"}
          </button>

          <button
            type="button"
            className="focus-reset-btn"
            onClick={resetTimer}
            disabled={saving}
          >
            Reset
          </button>
          <button
  type="button"
  className="focus-reset-btn"
  onClick={() => {
    const newValue = !soundEnabled;

    setSoundEnabled(newValue);
    localStorage.setItem("focusSoundEnabled", String(newValue));
    setMessage(
      newValue
        ? "Completion sound enabled 🔔"
        : "Completion sound disabled 🔇"
    );
  }}
  disabled={saving}
>
  {soundEnabled ? "Sound On 🔔" : "Sound Off 🔇"}
</button>

<button
  type="button"
  className="focus-reset-btn"
  onClick={testAlarm}
  disabled={saving || !soundEnabled}
>
  Test alarm
</button>
        </div>
      </motion.section>

      <section className="focus-stats">
        <div className="focus-stat-card">
          <span>Completed sessions</span>
          <strong>{sessionsCompleted}</strong>
        </div>

        <div className="focus-stat-card">
          <span>Selected duration</span>
          <strong>{duration} min</strong>
        </div>
      </section>

      {message && (
        <section className="focus-break" role="status">
          <h3>Beautiful work! 🌷</h3>
          <p>{message}</p>
          <p>Take a short break, stretch, and drink some water if you need it.</p>
          <button type="button" onClick={() => changeDuration(duration)}>
            Start another session
          </button>
        </section>
      )}

      {error && (
        <section className="focus-break" role="alert">
          <h3>Something needs attention</h3>
          <p>{error}</p>

          {secondsLeft === 0 && startedAt && (
            <button type="button" onClick={retrySave} disabled={saving}>
              Retry saving session
            </button>
          )}
        </section>
      )}

      {secondsLeft === 0 && !message && !error && saving && (
        <section className="focus-break">
          <h3>Session complete! 🌷</h3>
          <p>Saving your focus session to your account...</p>
        </section>
      )}
    </main>
  );
}

export default FocusMode;
