import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import "./AIAssistant.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type StudentProfile = {
  name?: string;
  college?: string;
  branch?: string;
  year?: number;
  semester?: number;
  careerGoal?: string;
  studyBuddy?: string;
  availableHours?: number;
  preferredStudyTime?: string;
};

type Message = {
  role: "user" | "assistant";
  text: string;
};

const suggestedQuestions = [
  {
    icon: "📚",
    title: "Explain a concept",
    description: "Understand difficult topics with simple explanations.",
    prompt: "Explain binary search in simple words with an example.",
    color: "lavender",
  },
  {
    icon: "🗓️",
    title: "Make a study plan",
    description: "Build a realistic study schedule for college.",
    prompt:
      "Help me create a realistic daily study plan for engineering college.",
    color: "peach",
  },
  {
    icon: "💻",
    title: "Coding help",
    description: "Learn programming and improve problem-solving.",
    prompt:
      "Help me understand how to improve my problem-solving skills in C++.",
    color: "blue",
  },
  {
    icon: "🚀",
    title: "Career guidance",
    description: "Explore skills and your software development roadmap.",
    prompt:
      "Create a beginner-friendly roadmap to become a software developer.",
    color: "pink",
  },
];

const welcomeMessage: Message = {
  role: "assistant",
  text:
    "Hi! 💜 I'm your AI Study Assistant. Ask me about studies, time management, coding, or career planning.",
};

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [studentProfile, setStudentProfile] =
    useState<StudentProfile | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const studentName =
    studentProfile?.name ||
    (() => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        return user.name || "Student";
      } catch {
        return "Student";
      }
    })();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) return;

    const fetchProfile = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/auth/me",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) return;

        const data = await response.json();

        if (data.user) {
          setStudentProfile(data.user);
          localStorage.setItem("user", JSON.stringify(data.user));
        }
      } catch (error) {
        console.error("Could not load student profile:", error);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading]);

  const handleSend = async (
    event?: FormEvent<HTMLFormElement>,
    messageOverride?: string
  ) => {
    event?.preventDefault();

    const userMessage = (messageOverride ?? input).trim();

    if (!userMessage || loading) return;

    if (!localStorage.getItem("token")) {
      setError("Please log in to use the AI Study Assistant.");
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(
      () => controller.abort(),
      30000
    );

    setMessages((previous) => [
      ...previous,
      { role: "user", text: userMessage },
    ]);

    setInput("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/ai/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ message: userMessage }),
          signal: controller.signal,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "AI request failed.");
      }

      if (typeof data.reply !== "string" || !data.reply.trim()) {
        throw new Error("The AI returned an empty response.");
      }

      setMessages((previous) => [
        ...previous,
        { role: "assistant", text: data.reply },
      ]);
    } catch (err) {
      setError(
        err instanceof Error && err.name === "AbortError"
          ? "The assistant is taking too long. Please try again."
          : err instanceof Error
            ? err.message
            : "Could not connect to the AI assistant."
      );
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const handleSuggestedQuestion = (prompt: string) => {
    void handleSend(undefined, prompt);
  };

  const startNewChat = () => {
    if (loading) return;

    setMessages([welcomeMessage]);
    setInput("");
    setError("");
    inputRef.current?.focus();
  };

  const navigateTo = (path: string) => {
    window.location.href = path;
  };

  return (
    <motion.main
      className="ai-workspace"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <aside className="ai-sidebar">
        <button
          type="button"
          className="ai-brand"
          onClick={() => navigateTo("/dashboard")}
          aria-label="Go to Dashboard"
        >
          <span className="ai-brand-icon">✦</span>
          <span className="ai-brand-text">
            <strong>AI Student</strong>
            <small>MANAGER</small>
          </span>
        </button>

        <button
          type="button"
          className="ai-new-chat"
          onClick={startNewChat}
          disabled={loading}
        >
          <span>＋</span> New conversation
        </button>

        <p className="ai-nav-label">WORKSPACE</p>

        <nav className="ai-sidebar-nav" aria-label="Main navigation">
          <button
            type="button"
            onClick={() => navigateTo("/dashboard")}
          >
            <span>⌂</span> Dashboard
          </button>

          <button
            type="button"
            onClick={() => navigateTo("/academic-planner")}
          >
            <span>▦</span> Academic Planner
          </button>

          <button
            type="button"
            onClick={() => navigateTo("/focus-mode")}
          >
            <span>◷</span> Focus Mode
          </button>

          <button
            type="button"
            className="active"
            aria-current="page"
          >
            <span>✧</span> AI Assistant
            <span className="ai-active-dot" />
          </button>

          <button
            type="button"
            onClick={() => navigateTo("/settings")}
          >
            <span>⚙</span> Settings
          </button>
        </nav>

        <div className="ai-sidebar-spacer" />

        <div className="ai-sidebar-tip">
          <span className="ai-tip-icon">✦</span>
          <strong>Little progress adds up.</strong>
          <p>One question, one concept, one step at a time.</p>
        </div>

        <button
          type="button"
          className="ai-sidebar-back"
          onClick={() => navigateTo("/dashboard")}
        >
          ← Back to Dashboard
        </button>
      </aside>

      <section className="ai-main-panel">
        <header className="ai-topbar">
          <div className="ai-topbar-title">
            <span className="ai-topbar-avatar">✦</span>
            <div>
              <h1>AI Study Assistant</h1>
              <p>
                <span className="ai-online-dot" />
                Your personal learning companion
              </p>
            </div>
          </div>

          <button
            type="button"
            className="ai-clear-button"
            onClick={startNewChat}
            disabled={loading}
            title="Start a new conversation"
          >
            ↻ <span>New chat</span>
          </button>
        </header>

        <div className="ai-conversation">
          {messages.length === 1 && (
            <motion.section
              className="ai-welcome"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="ai-welcome-icon">✦</div>

              <p className="ai-welcome-eyebrow">
                YOUR PERSONAL AI COMPANION
              </p>

              <h2>
                What are we learning
                <span> today, {studentName.split(" ")[0]}?</span>
              </h2>

              <p className="ai-welcome-description">
                Ask questions, untangle difficult concepts, plan your
                study time, and take the next step towards your goals.
              </p>

              <div className="ai-suggestions-heading">
                <span>✧</span>
                <h3>Choose a starting point</h3>
              </div>

              <div className="ai-suggestions-grid">
                {suggestedQuestions.map((item, index) => (
                  <motion.button
                    key={item.title}
                    type="button"
                    className={`ai-suggestion-card ${item.color}`}
                    onClick={() => handleSuggestedQuestion(item.prompt)}
                    disabled={loading}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06 }}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.985 }}
                  >
                    <span className="ai-suggestion-icon">
                      {item.icon}
                    </span>

                    <span className="ai-suggestion-title">
                      {item.title}
                    </span>

                    <span className="ai-suggestion-description">
                      {item.description}
                    </span>

                    <span className="ai-suggestion-arrow">↗</span>
                  </motion.button>
                ))}
              </div>
            </motion.section>
          )}

          <section
            className={`ai-messages ${
              messages.length === 1 ? "welcome-messages" : ""
            }`}
            aria-live="polite"
            aria-label="Conversation"
          >
            {messages.length > 1 &&
              messages.slice(1).map((message, index) => (
                <motion.article
                  key={`${index}-${message.role}`}
                  className={`ai-message-row ${message.role}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="ai-message-avatar">
                    {message.role === "assistant" ? "✦" : "S"}
                  </div>

                  <div className="ai-message-content">
                    <span className="ai-message-author">
                      {message.role === "assistant"
                        ? "AI Study Assistant"
                        : "You"}
                    </span>

<div className="ai-message-bubble">
  {message.role === "assistant" ? (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {message.text}
    </ReactMarkdown>
  ) : (
    message.text
  )}
</div>                  </div>
                </motion.article>
              ))}

            {loading && (
              <div className="ai-message-row assistant">
                <div className="ai-message-avatar">✦</div>
                <div className="ai-message-content">
                  <span className="ai-message-author">
                    AI Study Assistant
                  </span>
                  <div className="ai-message-bubble ai-typing">
                    <span />
                    <span />
                    <span />
                    <small>Thinking through your question...</small>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </section>
        </div>

        {error && (
          <div className="ai-error" role="alert">
            <span>ⓘ</span>
            <p>{error}</p>
            <button type="button" onClick={() => setError("")}>
              ✕
            </button>
          </div>
        )}

        <footer className="ai-composer-area">
          <form
            className="ai-composer"
            onSubmit={(event) => void handleSend(event)}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder="Ask anything about your studies..."
              aria-label="Message for AI assistant"
              maxLength={4000}
              rows={2}
              disabled={loading}
            />

            <button
              type="submit"
              className="ai-send-button"
              disabled={loading || !input.trim()}
              aria-label="Send message"
            >
              {loading ? "…" : "↑"}
            </button>
          </form>

          <p className="ai-composer-hint">
            <span>↵</span> Enter to send
            <span className="ai-hint-divider">·</span>
            Shift + Enter for a new line
          </p>
        </footer>
      </section>
    </motion.main>
  );
}