import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./AddActivityModal.css";

type ActivityType =
  | "class"
  | "exam"
  | "assignment"
  | "study"
  | "project"
  | "other"
  | null;

type AddActivityModalProps = {
  onClose: () => void;
  onSave: (activity: {
  type: string;
  title: string;
  subject: string;
  date: string;
  time: string;
  description: string;
  priority: string;
}) => Promise<void> | void;
};

const activityTypes = [
  {
    id: "class" as const,
    icon: "🎓",
    title: "Class",
  },
  {
    id: "exam" as const,
    icon: "📝",
    title: "Exam",
  },
  {
    id: "assignment" as const,
    icon: "📄",
    title: "Assignment",
  },
  {
    id: "study" as const,
    icon: "📚",
    title: "Study Session",
  },
  {
    id: "project" as const,
    icon: "💻",
    title: "Project",
  },
  {
    id: "other" as const,
    icon: "⋯",
    title: "Other",
  },
];

function AddActivityModal({
  onClose,
  onSave,
}: AddActivityModalProps) {
  const [selectedType, setSelectedType] =
    useState<ActivityType>(null);

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [description, setDescription] =
    useState("");
  const [priority, setPriority] =
    useState("medium");

  const [error, setError] = useState("");

  const handleSelectType = (
    type: ActivityType
  ) => {
    setSelectedType(type);
    setError("");
  };

  
const handleSave = async () => {
  if (!selectedType) {
    setError("Please select an activity type.");
    return;
  }

  if (!title.trim()) {
    setError("Please enter a title.");
    return;
  }

  if (!date) {
    setError("Please select a date.");
    return;
  }

  const activity = {
    type: selectedType,
    title: title.trim(),
    subject: subject.trim(),
    date,
    time,
    description: description.trim(),
    priority,
  };

  try {
    setError("");
    await onSave(activity);
    onClose();
  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : "Failed to save activity. Please try again."
    );
  }
};

  return (
    <AnimatePresence>
      <motion.div
        className="activity-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="activity-modal"
          initial={{
            opacity: 0,
            scale: 0.95,
            y: 20,
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
          }}
          exit={{
            opacity: 0,
            scale: 0.95,
            y: 20,
          }}
          transition={{
            duration: 0.25,
          }}
          onClick={(event) =>
            event.stopPropagation()
          }
        >
          {/* HEADER */}

          <div className="activity-modal-header">
            <div>
              <span className="activity-modal-label">
                PLAN YOUR DAY
              </span>

              <h2>
                Add New Activity
              </h2>

              <p>
                What would you like to
                add to your schedule?
              </p>
            </div>

            <button
              type="button"
              className="activity-close"
              onClick={onClose}
            >
              ×
            </button>
          </div>

          {/* ACTIVITY TYPES */}

          <div className="activity-type-grid">
            {activityTypes.map(
              (activity) => (
                <button
                  type="button"
                  key={activity.id}
                  className={`activity-type-card ${
                    selectedType ===
                    activity.id
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    handleSelectType(
                      activity.id
                    )
                  }
                >
                  <span className="activity-type-icon">
                    {activity.icon}
                  </span>

                  <span className="activity-type-title">
                    {activity.title}
                  </span>
                </button>
              )
            )}
          </div>

          {/* FORM */}

          <AnimatePresence mode="wait">
            {selectedType && (
              <motion.div
                className="activity-form"
                key={selectedType}
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.25,
                }}
              >
                <div className="form-section-title">
                  Activity Details
                </div>

                {/* TITLE */}

                <div className="form-group">
                  <label>
                    Title
                  </label>

                  <input
                    type="text"
                    placeholder={
                      selectedType ===
                      "exam"
                        ? "e.g. DBMS Internal"
                        : selectedType ===
                          "assignment"
                        ? "e.g. DAA Assignment"
                        : selectedType ===
                          "study"
                        ? "e.g. DSA Practice"
                        : selectedType ===
                          "project"
                        ? "e.g. AI Student Manager"
                        : "Enter activity title"
                    }
                    value={title}
                    onChange={(event) =>
                      setTitle(
                        event.target.value
                      )
                    }
                  />
                </div>

                {/* SUBJECT */}

                <div className="form-row">
                  <div className="form-group">
                    <label>
                      Subject / Domain
                    </label>

                    <input
                      type="text"
                      placeholder="e.g. DSA"
                      value={subject}
                      onChange={(event) =>
                        setSubject(
                          event.target.value
                        )
                      }
                    />
                  </div>

                  {/* PRIORITY */}

                  <div className="form-group">
                    <label>
                      Priority
                    </label>

                    <select
                      value={priority}
                      onChange={(event) =>
                        setPriority(
                          event.target.value
                        )
                      }
                    >
                      <option value="low">
                        Low
                      </option>

                      <option value="medium">
                        Medium
                      </option>

                      <option value="high">
                        High
                      </option>
                    </select>
                  </div>
                </div>

                {/* DATE + TIME */}

                <div className="form-row">
                  <div className="form-group">
                    <label>
                      Date
                    </label>

                    <input
                      type="date"
                      value={date}
                      onChange={(event) =>
                        setDate(
                          event.target.value
                        )
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Time
                    </label>

                    <input
                      type="time"
                      value={time}
                      onChange={(event) =>
                        setTime(
                          event.target.value
                        )
                      }
                    />
                  </div>
                </div>

                {/* DESCRIPTION */}

                <div className="form-group">
                  <label>
                    Description
                  </label>

                  <textarea
                    placeholder="Add any additional details..."
                    value={description}
                    onChange={(event) =>
                      setDescription(
                        event.target.value
                      )
                    }
                    rows={3}
                  />
                </div>

                {/* ERROR */}

                {error && (
                  <p className="activity-error">
                    {error}
                  </p>
                )}

                {/* BUTTONS */}

                <div className="activity-form-actions">
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={onClose}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="save-activity-button"
                    onClick={handleSave}
                  >
                    Save Activity
                    <span>→</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default AddActivityModal;