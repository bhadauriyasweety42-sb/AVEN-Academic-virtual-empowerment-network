
import { useEffect, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";

import "./App.css";
import StudyBuddy from "./pages/StudyBuddy.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Profile from "./pages/Profile.tsx";
import FocusMode from "./pages/FocusMode";
import Settings from "./pages/Settings";
import CreateAvatar from "./pages/CreateAvatar";
import Avatar3DViewer from "./components/Avatar3DViewer";
import AIAssistant from "./components/AIAssistant";
import AcademicPlanner from "./pages/AcademicPlanner";
import Timetable from "./pages/Timetable";

function App() {
  // Login / Signup states
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const path = window.location.pathname;
  useEffect(() => {
  const applyPreferences = () => {
    try {
      const saved = localStorage.getItem("appPreferences");
      const preferences = saved ? JSON.parse(saved) : {};

      const selectedTheme = preferences.theme || "light";
      const actualTheme =
        selectedTheme === "system"
          ? window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
          : selectedTheme;

      document.documentElement.dataset.theme = actualTheme;
      document.documentElement.dataset.fontSize =
        preferences.fontSize || "medium";
      document.documentElement.dataset.reducedMotion = String(
        Boolean(preferences.reducedMotion)
      );
    } catch (error) {
      console.error("Could not load app preferences:", error);
    }
  };

  applyPreferences();

  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === "appPreferences") {
      applyPreferences();
    }
  };

  window.addEventListener("storage", handleStorageChange);

  return () => {
    window.removeEventListener("storage", handleStorageChange);
  };
}, []);

  // Route to Study Buddy
  if (path === "/study-buddy") {
    return <StudyBuddy />;
  }

  // Route to Dashboard
  if (path === "/dashboard") {
    return <Dashboard />;
  }

  // Route to Student Profile
  if (path === "/profile") {
    return <Profile />;
  }
 
  
  // Route to Focus Mode
  if (path === "/focus-mode") {
    return <FocusMode />;
  }
//Route to Settings
  if (path === "/settings") {
  return <Settings />;
}
if (path === "/create-avatar") return <CreateAvatar />;

  if (path === "/avatar-3d-test") {
  return <Avatar3DViewer />;
}
if (path === "/ai-assistant") {
  return <AIAssistant />;
}
if (path === "/academic-planner") {
  return <AcademicPlanner />;
}

if (path === "/timetable") {
  return <Timetable />;
}

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const endpoint = isSignup
        ? "http://localhost:5000/api/auth/signup"
        : "http://localhost:5000/api/auth/login";

      const body = isSignup
        ? {
            name,
            email,
            password,
          }
        : {
            email,
            password,
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      // Signup successful → automatically login
      if (isSignup) {
        const loginResponse = await fetch(
          "http://localhost:5000/api/auth/login",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email,
              password,
            }),
          }
        );

        const loginData = await loginResponse.json();

        if (!loginResponse.ok) {
          throw new Error(
            loginData.message || "Account created but login failed"
          );
        }

        localStorage.setItem("token", loginData.token);
        localStorage.setItem(
          "user",
          JSON.stringify(loginData.user)
        );
      } else {
        // Login successful
        localStorage.setItem("token", data.token);
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );
      }

      // Go to Study Buddy after authentication
      window.location.href = "/study-buddy";
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      {/* Soft background decorations */}
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="ambient ambient-three" />

      {/* Floating study objects */}
      <motion.div
        className="floating-object book"
        animate={{
          y: [0, -12, 0],
          rotate: [-4, 2, -4],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        📚
      </motion.div>

      <motion.div
        className="floating-object pencil"
        animate={{
          y: [0, 10, 0],
          rotate: [12, 5, 12],
        }}
        transition={{
          duration: 4.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        ✏️
      </motion.div>

      <motion.div
        className="floating-object sparkle"
        animate={{
          y: [0, -8, 0],
          rotate: [0, 15, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        ✦
      </motion.div>

      <motion.div
        className="floating-object calendar"
        animate={{
          y: [0, 9, 0],
          rotate: [-3, 3, -3],
        }}
        transition={{
          duration: 5.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        🗓️
      </motion.div>

      <motion.div
        className="floating-object coffee"
        animate={{
          y: [0, -10, 0],
          rotate: [3, -3, 3],
        }}
        transition={{
          duration: 4.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        ☕
      </motion.div>

      <motion.div
        className="floating-object laptop"
        animate={{
          y: [0, 8, 0],
          rotate: [-2, 2, -2],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        💻
      </motion.div>

      {/* Login card */}
      <motion.section
        className="auth-card"
        initial={{
          opacity: 0,
          y: 35,
          scale: 0.97,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        transition={{
          duration: 0.7,
          ease: "easeOut",
        }}
      >
        {/* Brand */}
        <motion.div
          className="brand"
          initial={{
            opacity: 0,
            y: -15,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.15,
            duration: 0.5,
          }}
        >
          <div className="brand-mark">✦</div>

          <div>
            <h1>AI Student Manager</h1>
            <p>Your personal student companion</p>
          </div>
        </motion.div>

        {/* Heading */}
        <AnimatePresence mode="wait">
          <motion.div
            key={isSignup ? "signup-heading" : "login-heading"}
            className="auth-heading"
            initial={{
              opacity: 0,
              x: 15,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            exit={{
              opacity: 0,
              x: -15,
            }}
            transition={{
              duration: 0.25,
            }}
          >
            <h2>
              {isSignup
                ? "Create your account"
                : "Welcome back!"}
            </h2>

            <p>
              {isSignup
                ? "Start building a smarter student life."
                : "Let’s get your study journey back on track."}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Form */}
        <motion.form
          className="auth-form"
          onSubmit={handleSubmit}
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.08,
                delayChildren: 0.25,
              },
            },
          }}
        >
          {/* Full Name */}
          {isSignup && (
            <motion.div
              className="input-group"
              variants={{
                hidden: {
                  opacity: 0,
                  y: 12,
                },
                visible: {
                  opacity: 1,
                  y: 0,
                },
              }}
            >
              <label>Full name</label>

              <div className="input-wrapper">
                <span className="input-icon">♡</span>

                <input
                  type="text"
                  placeholder="Enter your name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  required
                />
              </div>
            </motion.div>
          )}

          {/* Email */}
          <motion.div
            className="input-group"
            variants={{
              hidden: {
                opacity: 0,
                y: 12,
              },
              visible: {
                opacity: 1,
                y: 0,
              },
            }}
          >
            <label>Email address</label>

            <div className="input-wrapper">
              <span className="input-icon">@</span>

              <input
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                required
              />
            </div>
          </motion.div>

          {/* Password */}
          <motion.div
            className="input-group"
            variants={{
              hidden: {
                opacity: 0,
                y: 12,
              },
              visible: {
                opacity: 1,
                y: 0,
              },
            }}
          >
            <div className="label-row">
              <label>Password</label>

              {!isSignup && (
                <button
                  type="button"
                  className="forgot-button"
                >
                  Forgot password?
                </button>
              )}
            </div>

            <div className="input-wrapper">
              <span className="input-icon">●</span>

              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete={
                  isSignup
                    ? "new-password"
                    : "current-password"
                }
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                aria-label="Toggle password visibility"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </motion.div>

          {/* Terms */}
          {isSignup && (
            <motion.div
              className="terms"
              variants={{
                hidden: {
                  opacity: 0,
                },
                visible: {
                  opacity: 1,
                },
              }}
            >
              <span className="terms-check">✓</span>

              <span>
                I agree to the <b>Terms</b> and{" "}
                <b>Privacy Policy</b>
              </span>
            </motion.div>
          )}

          {/* Error */}
          {error && (
            <p
              style={{
                color: "#b84b6b",
                fontSize: "0.9rem",
                margin: "4px 0 0",
                textAlign: "center",
              }}
            >
              {error}
            </p>
          )}

          {/* Submit button */}
          <motion.button
            type="submit"
            className="primary-button"
            disabled={loading}
            variants={{
              hidden: {
                opacity: 0,
                y: 10,
              },
              visible: {
                opacity: 1,
                y: 0,
              },
            }}
            whileHover={
              !loading
                ? {
                    scale: 1.015,
                    y: -2,
                  }
                : {}
            }
            whileTap={
              !loading
                ? {
                    scale: 0.98,
                  }
                : {}
            }
          >
            <span>
              {loading
                ? "Please wait..."
                : isSignup
                ? "Create Account"
                : "Sign In"}
            </span>

            <span className="button-arrow">
              →
            </span>
          </motion.button>
        </motion.form>

        {/* Switch Login / Signup */}
        <motion.div
          className="auth-switch"
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          transition={{
            delay: 0.7,
          }}
        >
          <span>
            {isSignup
              ? "Already have an account?"
              : "New to AI Student Manager?"}
          </span>

          <button
            type="button"
            onClick={() => {
              setIsSignup(!isSignup);
              setShowPassword(false);
              setError("");
            }}
          >
            {isSignup
              ? "Sign in"
              : "Create account"}
          </button>
        </motion.div>

        {/* Footer */}
        <div className="auth-footer">
          <span>Made for students</span>
          <span>•</span>
          <span>Built for better study days</span>
        </div>
      </motion.section>
    </main>
  );
}

export default App;