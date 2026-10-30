import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import "./Dashboard.css";
import AddActivityModal from "../components/AddActivityModal";

type Task = {
  _id: string;
  title: string;
  subject?: string;
  type?: string;
  deadline: string;
  duration?: number;
  priority?: string;
  status?: string;
};

type Activity = {
  _id: string;
  type: string;
  title: string;
  subject?: string;
  date: string;
  deadline?: string | null;
  time?: string;
  description?: string;
  priority?: string;
  status?: string;
};


type FocusSession = {
  _id: string;
  durationMinutes: number;
  taskTitle: string;
  startedAt: string;
  completedAt: string;
};


const buddyImages: Record<string, string> = {
  kitten: "/mascots/kitten-waving.png",
  panda: "/mascots/panda-waving.png",
  bear: "/mascots/bear-cub-waving.png",
  puppy: "/mascots/puppy-waving.png",
};

const buddyNames: Record<string, string> = {
  kitten: "Kitten",
  panda: "Panda",
  bear: "Bear Cub",
  puppy: "Puppy",
};
function Dashboard() {
  const savedUser = localStorage.getItem("user");

const user = savedUser
  ? JSON.parse(savedUser)
  : null;
const [selectedBuddy, setSelectedBuddy] = useState(() => {
  const saved = localStorage.getItem("studyBuddy") || "panda";
  return saved === "bear-cub" ? "bear" : saved;
});

useEffect(() => {
  const syncBuddy = () => {
    const saved = localStorage.getItem("studyBuddy") || "panda";
    setSelectedBuddy(saved === "bear-cub" ? "bear" : saved);
  };

  window.addEventListener("studyBuddyChanged", syncBuddy);

  return () => {
    window.removeEventListener("studyBuddyChanged", syncBuddy);
  };
}, []);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [showAddActivity, setShowAddActivity] = useState(false); 
const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
const [loadingFocusSessions, setLoadingFocusSessions] = useState(true);
const [focusChartView, setFocusChartView] = useState<
  "daily" | "weekly" | "monthly" | "yearly"
>("weekly");
const [activityChartView, setActivityChartView] = useState<
  "daily" | "weekly" | "monthly" | "yearly"
>("weekly");



  const dashboardRef = useRef<HTMLElement | null>(null);
  const tasksRef = useRef<HTMLDivElement | null>(null);
  const scheduleRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setLoadingTasks(false);
          return;
        }

        const response = await fetch("http://localhost:5000/api/tasks", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch tasks");
        }

        const data: Task[] = await response.json();
        setTasks(data);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        setLoadingTasks(false);
      }
    };

    const fetchActivities = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setLoadingActivities(false);
          return;
        }

        const response = await fetch("http://localhost:5000/api/activities", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch activities");
        }

        const data: Activity[] = await response.json();
        setActivities(data);
      } catch (error) {
        console.error("Error fetching activities:", error);
      } finally {
        setLoadingActivities(false);
      }
    };

    
const fetchFocusSessions = async () => {
  try {
    const token = localStorage.getItem("token");

    if (!token) return;

    const response = await fetch("http://localhost:5000/api/focus", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch focus history");
    }

    const data: FocusSession[] = await response.json();
    setFocusSessions(data);
  } catch (error) {
    console.error("Error fetching focus history:", error);
  } finally {
    setLoadingFocusSessions(false);
  }
};

    fetchTasks();
    fetchActivities();
    fetchFocusSessions(); 
  }, []);

  const handleNavigation = (section: string) => {
    setActiveSection(section);

    if (section === "dashboard") {
      dashboardRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }

    if (section === "tasks" || section === "academics") {
      tasksRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }

    if (section === "schedule") {
  window.location.href = "/timetable";
  return;
}

    if (section === "progress") {
      progressRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }

    
if (section === "focus") {
  window.location.href = "/focus-mode";
  return;
}


  if (section === "settings") {
  window.location.href = "/settings";
  return;
}
}
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const toggleTask = async (task: Task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/tasks/${task._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      const data = await response.json();
      setTasks((previousTasks) =>
        previousTasks.map((item) => (item._id === task._id ? data.task : item))
      );
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

 
const toggleActivity = async (activity: Activity) => {
  const newStatus =
    activity.status === "completed" ? "pending" : "completed";

  try {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please log in again.");
      return;
    }

    const response = await fetch(
      `http://localhost:5000/api/activities/${activity._id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to update activity.");
    }

    setActivities((previousActivities) =>
      previousActivities.map((item) =>
        item._id === activity._id ? data.activity : item
      )
    );
  } catch (error) {
    console.error("Error updating activity:", error);
    alert(
      error instanceof Error
        ? error.message
        : "Failed to update activity."
    );
  }
};


  const buddyImage = buddyImages[selectedBuddy] || buddyImages.panda;
  const buddyName = buddyNames[selectedBuddy] || buddyNames.panda;

  const formatTaskTime = (deadline: string) => {
    const date = new Date(deadline);

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();

    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const todaysTasks = tasks.filter((task) => isToday(task.deadline));
  
const todaysActivities = activities
  .filter((activity) => isToday(activity.date))
  .sort((a, b) => (a.time || "").localeCompare(b.time || ""));

const upcomingExams = activities.filter((activity) => {
  if (activity.type.toLowerCase() !== "exam") return false;
  if (activity.status === "completed") return false;

  const examDate = new Date(activity.deadline || activity.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  examDate.setHours(0, 0, 0, 0);

  return !Number.isNaN(examDate.getTime()) && examDate >= today;
});



  const completedTasksCount = tasks.filter((task) => task.status === "completed").length;
  const completedActivitiesCount = activities.filter(
    (activity) => activity.status === "completed"
  ).length;
  const totalCompleted = completedTasksCount + completedActivitiesCount;
  const totalItems = tasks.length + activities.length;
  const taskCompletion = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;

  const getDateKey = (value: string) => {
    const datePart = value.slice(0, 10);
    const parts = datePart.split("-").map(Number);

    if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) {
      return "";
    }

    const [year, month, day] = parts;
    if (!year || !month || !day) return "";

    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const getMonday = (date: Date) => {
    const monday = new Date(date);
    monday.setHours(0, 0, 0, 0);

    const day = monday.getDay();
    monday.setDate(monday.getDate() - (day === 0 ? 6 : day - 1));

    return monday;
  };

  const weekStart = getMonday(new Date());

  const today = new Date();

const dailyFocusData = Array.from({ length: 24 }, (_, hour) => {
  const minutes = focusSessions
    .filter((session) => {
      const date = new Date(session.completedAt);
      return (
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate() &&
        date.getHours() === hour
      );
    })
    .reduce((total, session) => total + session.durationMinutes, 0);

  return {
    day: `${String(hour).padStart(2, "0")}:00`,
    minutes,
  };
});

const weeklyFocusData = Array.from({ length: 7 }, (_, index) => {
  const date = new Date(weekStart);
  date.setDate(weekStart.getDate() + index);

  const dateKey = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const minutes = focusSessions
    .filter((session) => getDateKey(session.completedAt) === dateKey)
    .reduce((total, session) => total + session.durationMinutes, 0);

  return {
    day: dayNames[date.getDay()],
    minutes,
  };
});

const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
const daysInMonth = new Date(
  today.getFullYear(),
  today.getMonth() + 1,
  0
).getDate();

const monthlyFocusData = Array.from({ length: daysInMonth }, (_, index) => {
  const date = new Date(monthStart);
  date.setDate(index + 1);

  const dateKey = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

  const minutes = focusSessions
    .filter((session) => getDateKey(session.completedAt) === dateKey)
    .reduce((total, session) => total + session.durationMinutes, 0);

  return {
    day: String(index + 1),
    minutes,
  };
});

  const totalFocusMinutes = focusSessions.reduce(
    (total, session) => total + session.durationMinutes,
    0
  );

 const activityChartData = (() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const countForDate = (date: Date) => {
    const dateKey = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");

    const taskCount = tasks.filter(
      (task) => getDateKey(task.deadline) === dateKey
    ).length;

    const activityCount = activities.filter(
      (activity) => getDateKey(activity.date) === dateKey
    ).length;

    return taskCount + activityCount;
  };

  if (activityChartView === "daily") {
    return [{ label: "Today", count: countForDate(today) }];
  }

  if (activityChartView === "weekly") {
    const monday = getMonday(today);

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);

      return {
        label: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
          date.getDay()
        ],
        count: countForDate(date),
      };
    });
  }

  if (activityChartView === "monthly") {
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const weeks = Math.ceil(daysInMonth / 7);

    return Array.from({ length: weeks }, (_, index) => {
      const startDay = index * 7 + 1;
      const endDay = Math.min(startDay + 6, daysInMonth);
      let count = 0;

      for (let day = startDay; day <= endDay; day++) {
        count += countForDate(new Date(year, month, day));
      }

      return {
        label: `Week ${index + 1}`,
        count,
      };
    });
  }

  return Array.from({ length: 12 }, (_, month) => {
    const year = today.getFullYear();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let count = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      count += countForDate(new Date(year, month, day));
    }

    return {
      label: new Date(year, month, 1).toLocaleString("en", {
        month: "short",
      }),
      count,
    };
  });
})();

  const yearlyFocusData = Array.from({ length: 12 }, (_, index) => {
  const year = new Date().getFullYear();

  const minutes = focusSessions
    .filter((session) => {
      const date = new Date(session.completedAt);
      return date.getFullYear() === year && date.getMonth() === index;
    })
    .reduce((total, session) => total + session.durationMinutes, 0);

  return {
    day: new Date(year, index, 1).toLocaleString("en", {
      month: "short",
    }),
    minutes,
  };
});


const currentFocusData =
  focusChartView === "daily"
    ? dailyFocusData
    : focusChartView === "monthly"
      ? monthlyFocusData
      : focusChartView === "yearly"
        ? yearlyFocusData
        : weeklyFocusData;

const focusChartTitle =
  focusChartView === "daily"
    ? "Daily Focus Time ⏱️"
    : focusChartView === "monthly"
      ? "Monthly Focus Time ⏱️"
      : focusChartView === "yearly"
        ? "Yearly Focus Time ⏱️"
        : "Weekly Focus Time ⏱️";

  const taskCompletionData = [
    { name: "Completed", value: totalCompleted },
    { name: "Pending", value: Math.max(totalItems - totalCompleted, 0) },
  ];

  const chartColors = ["#9B83D5", "#E9DFF7"];

  return (
    <main className="dashboard-page" ref={dashboardRef}>
      <aside className="dashboard-sidebar">
        <div className="dashboard-logo">
          <span>✦</span>
          <div>
            <strong>AI Student</strong>
            <small>Manager</small>
          </div>
        </div>

        <nav className="dashboard-nav">
          <button
            type="button"
            className={`nav-item ${activeSection === "dashboard" ? "active" : ""}`}
            onClick={() => handleNavigation("dashboard")}
          >
            <span>⌂</span>
            Dashboard
          </button>

          <button
            type="button"
            className={`nav-item ${activeSection === "tasks" ? "active" : ""}`}
            onClick={() => handleNavigation("tasks")}
          >
            <span>✓</span>
            My Tasks
          </button>

          <button
            type="button"
            className={`nav-item ${activeSection === "schedule" ? "active" : ""}`}
            onClick={() => handleNavigation("schedule")}
          >
            <span>◷</span>
            My Schedule
          </button>

          <button
            type="button"
            className={`nav-item ${activeSection === "academics" ? "active" : ""}`}
            onClick={() => handleNavigation("academics")}
          >
            <span>▣</span>
            Academics
          </button>

          <button
            type="button"
            className={`nav-item ${activeSection === "progress" ? "active" : ""}`}
            onClick={() => handleNavigation("progress")}
          >
            <span>◔</span>
            Progress
          </button>

          <button
            type="button"
            className={`nav-item ${activeSection === "focus" ? "active" : ""}`}
            onClick={() => handleNavigation("focus")}
          >
            <span>◉</span>
            Focus Mode
          </button>
          
<button
  type="button"
  className="nav-item"
  onClick={() => {
    window.location.href = "/ai-assistant";
  }}
>
  <span>✦</span>
  AI Assistant
</button>

        </nav>

        
<div className="sidebar-bottom">
  {/* Edit Profile */}
  <button
    type="button"
    className="nav-item"
    onClick={() => {
      window.location.href = "/profile";
    }}
  >
    {localStorage.getItem("personalAvatar") ? (
  <img
    src={localStorage.getItem("personalAvatar")!}
    alt="Profile"
    className="nav-profile-avatar"
  />
) : (
  <span>✎</span>
)}
Edit Profile
  </button>

  {/* Settings */}
  <button
    type="button"
    className={`nav-item ${
      activeSection === "settings" ? "active" : ""
    }`}
    onClick={() => handleNavigation("settings")}
  >
    <span>⚙</span>
    Settings
  </button>

  {/* Log out */}
  <button
    type="button"
    className="nav-item logout-item"
    onClick={handleLogout}
  >
    <span>↪</span>
    Log out
  </button>
</div>

      </aside>

      <section className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-date">
  {new Date()
    .toLocaleDateString("en-IN", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })
    .toUpperCase()}
</p>
            <h1>
              Good morning! <span>🌸</span>
            </h1>
            <p className="dashboard-subtitle">Let's make today a productive one.</p>
          </div>

          <div className="header-actions">
            <button
              type="button"
              className="notification-button"
              onClick={() => alert("No new notifications right now. ♡")}
            >
              ♡
            </button>
            <button
  type="button"
  className="timetable-reminders-button"
  onClick={() => {
  window.location.href = "/timetable";
}}
>
  Timetable & Reminders
</button>

           <div className="profile-mini">
 <div className="profile-avatar">
  {localStorage.getItem("personalAvatar") ? (
    <img
      src={localStorage.getItem("personalAvatar")!}
      alt="Profile"
    />
  ) : (
    user?.name?.charAt(0)?.toUpperCase() || "S"
  )}
</div>

  <div>
    <strong>{user?.name || "Complete your profile"}</strong>
    <small>{user?.branch || "Branch not added yet"}</small>
  </div>
</div>
          </div>
        </header>

        <motion.section
          className="buddy-hero"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="buddy-hero-content">
            <p className="eyebrow">YOUR STUDY BUDDY</p>
            <h2>
              Hi! I'm {buddyName} 👋
            </h2>
            <p>I'm here to help you stay organized, focused and on track today.</p>

            <button
              type="button"
              className="hero-action"
              onClick={() => handleNavigation("schedule")}
            >
              View today's plan
              <span>→</span>
            </button>
          </div>

          <motion.div
            className="dashboard-buddy"
            animate={{ y: [0, -7, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <img src={buddyImage} alt={`${buddyName} Study Buddy`} />
          </motion.div>
        </motion.section>

        <section className="dashboard-stats">
          <div className="stat-card">
            <span className="stat-icon">✓</span>
            <div>
              <small>Today's Tasks</small>
              <strong>{todaysTasks.length}</strong>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">◷</span>
            <div>
              
<small>Study Hours / Day</small>
<strong>
  {Number(user?.availableHours) > 0
    ? `${user.availableHours} hrs`
    : "Not set"}
</strong>

            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">▣</span>
            <div>
              
<small>Upcoming Exams</small>
<strong>{upcomingExams.length}</strong>

            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">◔</span>
            <div>
              <small>Weekly Progress</small>
              <strong>{taskCompletion}%</strong>
            </div>
          </div>
        </section>

        <section className="dashboard-grid">
          <div className="dashboard-card tasks-card" ref={tasksRef}>
            <div className="card-heading">
              <div>
                <span className="card-label">TODAY</span>
                <h3>Academic Tasks</h3>
              </div>

              <button type="button" onClick={() => setShowAddActivity(true)}>
                + Add
              </button>
            </div>

            <div className="task-list">
              {loadingTasks ? (
                <div className="task-item">
                  <div>
                    <strong>Loading tasks...</strong>
                  </div>
                </div>
              ) : todaysTasks.length === 0 ? (
                <div className="task-item">
                  <div>
                    <strong>No tasks for today</strong>
                    <small>Add your first academic task.</small>
                  </div>
                </div>
              ) : (
                todaysTasks.slice(0, 5).map((task) => (
                  <div
                    className={`task-item ${task.status === "completed" ? "completed" : ""}`}
                    key={task._id}
                  >
                    <button
                      type="button"
                      className={`task-check ${task.status === "completed" ? "checked" : ""}`}
                      onClick={() => toggleTask(task)}
                    >
                      {task.status === "completed" ? "✓" : ""}
                    </button>

                    <div>
                      <strong>{task.title}</strong>
                      <small>
                        {task.subject || task.type || "Study"}
                        {" · "}
                        {task.duration || 30} min
                        {" · "}
                        {formatTaskTime(task.deadline)}
                      </small>
                    </div>
                  </div>
                ))
              )}

              <div className="saved-activities">
                <h4>My Added Activities</h4>

                {loadingActivities ? (
                  <p>Loading activities...</p>
                ) : activities.length === 0 ? (
                  <p>No saved activities yet.</p>
                ) : (
                  activities.map((activity) => (
                    <div className="task-item" key={activity._id}>
                      <button
                        type="button"
                        className={`task-check ${activity.status === "completed" ? "checked" : ""}`}
                        onClick={() => toggleActivity(activity)}
                      >
                        {activity.status === "completed" ? "✓" : ""}
                      </button>

                      <div>
                        <strong>{activity.title}</strong>
                        <small>
                          {activity.type} · {activity.subject || "General"} · {activity.date}
                          {activity.time ? ` · ${activity.time}` : ""}
                        </small>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="dashboard-card schedule-card" ref={scheduleRef}>
            <div className="card-heading">
              <div>
                <span className="card-label">PLANNER</span>
                <h3>Today's Schedule</h3>
              </div>

              <button type="button" onClick={() => handleNavigation("schedule")}>
                View all
              </button>
            </div>

            
<div className="schedule-list">
  {loadingActivities ? (
    <div className="schedule-item">
      <span className="time">...</span>
      <div className="schedule-line" />
      <div>
        <strong>Loading schedule...</strong>
        <small>Fetching your saved activities</small>
      </div>
    </div>
  ) : todaysActivities.length === 0 ? (
    <div className="schedule-item">
      <span className="time">—</span>
      <div className="schedule-line" />
      <div>
        <strong>No schedule added</strong>
        <small>Add an activity to see it here.</small>
      </div>
    </div>
  ) : (
    todaysActivities.map((activity) => (
      <div className="schedule-item" key={activity._id}>
        <span className="time">
          {activity.time || "—"}
        </span>
        <div className="schedule-line" />
        <div>
          <strong>{activity.title}</strong>
          <small>
            {activity.subject || activity.type}
          </small>
        </div>
      </div>
    ))
  )}
</div>
          </div>

          <div className="dashboard-card progress-card" ref={progressRef}>
            <div className="card-heading">
              <div>
                <span className="card-label">YOUR ACTIVITY</span>
                <h3>Task Progress</h3>
              </div>

              <span className="progress-percent">{taskCompletion}%</span>
            </div>

            <div
              className="progress-bar"
              role="progressbar"
              aria-valuenow={taskCompletion}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="progress-fill" style={{ width: `${taskCompletion}%` }} />
            </div>

            <p>
              {totalItems === 0
                ? "Add your first task to start tracking your progress!"
                : `${totalCompleted} of ${totalItems} items completed. ${
                    taskCompletion === 100
                      ? "Amazing work! All items completed!"
                      : "Keep going, you're making progress!"
                  }`}
            </p>
          </div>

          <div className="dashboard-card upcoming-card">
            <div className="card-heading">
              <div>
                <span className="card-label">COMING UP</span>
                <h3>Exams &amp; Deadlines</h3>
              </div>
            </div>

            <div className="upcoming-deadlines-list">
              {loadingActivities ? (
                <div className="deadline-item">
                  <p>Loading deadlines...</p>
                </div>
              ) : (
                activities
                  .filter((activity) => {
                    const type = activity.type.toLowerCase();
                    return (
                      (type === "exam" || type === "assignment" || type === "project") &&
                      (type !== "project" || !!activity.deadline) &&
                      activity.status !== "completed"
                    );
                  })
                  .filter((activity) => {
                    const dueDate = new Date(activity.deadline || activity.date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    dueDate.setHours(0, 0, 0, 0);
                    return dueDate >= today;
                  })
                  .sort(
                    (a, b) =>
                      new Date(a.deadline || a.date).getTime() -
                      new Date(b.deadline || b.date).getTime()
                  )
                  .slice(0, 5)
                  .map((activity) => {
                    const dueDate = new Date(activity.deadline || activity.date);
                    const day = dueDate.getDate().toString().padStart(2, "0");
                    const month = dueDate
                      .toLocaleString("en-IN", { month: "short" })
                      .toUpperCase();

                    return (
                      <div className="deadline-item" key={activity._id}>
                        <div className="deadline-date">
                          <strong>{day}</strong>
                          <small>{month}</small>
                        </div>

                        <div>
                          <strong>{activity.title}</strong>
                          <small>
                            {activity.type} · {activity.subject || "General"}
                          </small>
                        </div>
                      </div>
                    );
                  })
              )}

              {!loadingActivities &&
                activities.filter((activity) => {
                  const type = activity.type.toLowerCase();

                  if (type !== "exam" && type !== "assignment" && type !== "project") {
                    return false;
                  }

                  const dueDate = new Date(activity.deadline || activity.date);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  dueDate.setHours(0, 0, 0, 0);

                  return (
                    dueDate >= today &&
                    activity.status !== "completed" &&
                    (type !== "project" || !!activity.deadline)
                  );
                }).length === 0 && (
                  <div className="deadline-item">
                    <div>
                      <strong>No upcoming deadlines</strong>
                      <small>Add an exam or assignment to see it here.</small>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </section>

        <section className="progress-charts-section">
          <div className="charts-section-heading">
            <h2>Your Progress 📊</h2>
            <p>A little progress every day adds up.</p>
          </div>

          <div className="progress-charts-grid">
            <div className="chart-card">
              <h3>Task Completion</h3>
              <p className="chart-subtitle">
                Completed vs pending tasks and activities
              </p>

              <div className="chart-container pie-chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={taskCompletionData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={88}
                      paddingAngle={4}
                    >
                      {taskCompletionData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={chartColors[index % chartColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-summary">
                <span>Overall completion</span>
                <strong>{taskCompletion}%</strong>
              </div>
            </div>

            <div className="chart-card">
              <h3>{focusChartTitle}</h3>
              <div className="focus-chart-tabs">
  <button
    className={focusChartView === "daily" ? "active" : ""}
    onClick={() => setFocusChartView("daily")}
  >
    Daily
  </button>

  <button
    className={focusChartView === "weekly" ? "active" : ""}
    onClick={() => setFocusChartView("weekly")}
  >
    Weekly
  </button>

  <button
    className={focusChartView === "monthly" ? "active" : ""}
    onClick={() => setFocusChartView("monthly")}
  >
    Monthly
  </button>
  <button
  className={focusChartView === "yearly" ? "active" : ""}
  onClick={() => setFocusChartView("yearly")}
>
  Yearly
</button>
</div>
              <p className="chart-subtitle">
                Actual minutes spent in completed focus sessions
              </p>

              <div className="chart-container weekly-chart-container">
                {loadingFocusSessions ? (
                  <p>Loading focus history...</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={currentFocusData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#EEE7F5"
                      />

                      <XAxis dataKey="day" />
                      <YAxis
                        allowDecimals={false}
                        label={{
                          value: "Minutes",
                          angle: -90,
                          position: "insideLeft",
                        }}
                      />

                      <Tooltip formatter={(value) => [`${value} min`, "Focus time"]} />

                      <Bar
                        dataKey="minutes"
                        name="Focus time"
                        fill="#8E77C5"
                        radius={[7, 7, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="chart-summary">
                <span>Total recorded focus time</span>
                <strong>
                  {Math.floor(totalFocusMinutes / 60)}h {totalFocusMinutes % 60}m
                </strong>
              </div>
            </div>

        
<div className="chart-card">
  <h3>Weekly Activity</h3>

  <div
    className="activity-period-toggle"
    role="group"
    aria-label="Activity chart period"
  >
    {(["daily", "weekly", "monthly", "yearly"] as const).map((period) => (
      <button
        key={period}
        type="button"
        className={`activity-period-button ${
          activityChartView === period ? "active" : ""
        }`}
        onClick={() => setActivityChartView(period)}
        aria-pressed={activityChartView === period}
      >
        {period.charAt(0).toUpperCase() + period.slice(1)}
      </button>
    ))}
  </div>

  <p className="chart-subtitle">
    Tasks and activities scheduled{" "}
    {activityChartView === "daily"
      ? "today"
      : activityChartView === "weekly"
        ? "this week"
        : activityChartView === "monthly"
          ? "this month"
          : "this year"}
  </p>

  <div className="chart-container weekly-chart-container">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={activityChartData}>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="#EEE7F5"
        />
        <XAxis dataKey="label" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar
          dataKey="count"
          name="Scheduled items"
          fill="#9B83D5"
          radius={[7, 7, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  </div>
</div>
</div>
        </section>

        {showAddActivity && (
          <AddActivityModal
            onClose={() => setShowAddActivity(false)}
            onSave={async (activity) => {
              const token = localStorage.getItem("token");

             
if (!token) {
  throw new Error("Please sign in again.");
}


              const typeKey = activity.type.trim().toLowerCase();
              const typeMap: Record<string, string> = {
                class: "class",
                exam: "exam",
                assignment: "assignment",
                "study session": "study",
                study: "study",
                project: "project",
                other: "other",
              };

              const response = await fetch("http://localhost:5000/api/activities", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  ...activity,
                  type: typeMap[typeKey] ?? "other",
                  priority: activity.priority.toLowerCase(),
                }),
              });

              const data = await response.json();

              if (!response.ok) {
                throw new Error(data.message || "Failed to save activity.");
              }

              setActivities((previous) => [data.activity, ...previous]);
            }}
          />
        )}
      </section>
    </main>
  );
}

export default Dashboard;
