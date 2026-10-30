import { useState } from "react";
import { motion } from "framer-motion";
import "./Login.css";

function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const endpoint = isSignup
        ? "http://localhost:5000/api/auth/signup"
        : "http://localhost:5000/api/auth/login";

      const body = isSignup
        ? { name, email, password }
        : { email, password };

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

      
      // If signing up, automatically login after account creation
      let loginData = data;

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

        loginData = await loginResponse.json();

        if (!loginResponse.ok) {
          throw new Error(loginData.message || "Login failed");
        }
      }

      // Save authentication and logged-in student details
      localStorage.setItem("token", loginData.token);
      localStorage.setItem("user", JSON.stringify(loginData.user));

      // Go to Study Buddy after authentication
      window.location.href = "/study-buddy";


      // Go to Study Buddy after authentication
      window.location.href = "/study-buddy";
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-glow glow-one" />
      <div className="login-glow glow-two" />

      <motion.div
        className="floating-item book"
        animate={{ y: [0, -10, 0], rotate: [-4, 2, -4] }}
        transition={{ duration: 5, repeat: Infinity }}
      >
        📚
      </motion.div>

      <motion.div
        className="floating-item pencil"
        animate={{ y: [0, 10, 0], rotate: [10, 3, 10] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        ✏️
      </motion.div>

      <motion.div
        className="floating-item coffee"
        animate={{ y: [0, -8, 0], rotate: [3, -3, 3] }}
        transition={{ duration: 4.5, repeat: Infinity }}
      >
        ☕
      </motion.div>

      <motion.div
        className="floating-item sparkle"
        animate={{ y: [0, -8, 0], rotate: [0, 15, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        ✦
      </motion.div>

      <motion.section
        className="login-card"
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="login-brand">
          <div className="login-brand-icon">✦</div>

          <div>
            <h1>AI Student Manager</h1>
            <p>Your personal student companion</p>
          </div>
        </div>

        <div className="login-heading">
          <span>WELCOME BACK</span>

          <h2>
            {isSignup ? "Create your account" : "Let's get started"}
          </h2>

          <p>
            {isSignup
              ? "Build a smarter and more organized student life."
              : "Your study journey, planning and progress — all in one place."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {isSignup && (
            <div className="login-field">
              <label>Full name</label>

              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="login-field">
            <label>Email address</label>

            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="login-field">
            <label>Password</label>

            <div className="password-box">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && <p className="login-error">{error}</p>}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : isSignup
              ? "Create Account"
              : "Sign In"}

            <span>→</span>
          </button>
        </form>

        <div className="login-switch">
          <span>
            {isSignup
              ? "Already have an account?"
              : "New to AI Student Manager?"}
          </span>

          <button
            type="button"
            onClick={() => {
              setIsSignup(!isSignup);
              setError("");
            }}
          >
            {isSignup ? "Sign in" : "Create account"}
          </button>
        </div>

        <div className="login-footer">
          Made for students · Built for better study days
        </div>
      </motion.section>
    </main>
  );
}

export default Login;