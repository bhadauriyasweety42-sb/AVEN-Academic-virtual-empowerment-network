
import { useEffect, useState, type FormEvent } from "react";
import "./Profile.css";

type StudentProfile = {
  name: string;
  email: string;
  college: string;
  branch: string;
  year: number;
  semester: number;
  careerGoal: string;
  availableHours: number;
  preferredStudyTime: string;
};

const emptyProfile: StudentProfile = {
  name: "",
  email: "",
  college: "",
  branch: "",
  year: 1,
  semester: 1,
  careerGoal: "",
  availableHours: 0,
  preferredStudyTime: "",
};

function Profile() {
  const [profile, setProfile] = useState<StudentProfile>(emptyProfile);
  const [loading, setLoading] = useState(() =>
    Boolean(localStorage.getItem("token"))
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(() =>
    localStorage.getItem("token")
      ? ""
      : "Please sign in first to view your profile."
  );

  const [avatar] = useState(
  () => localStorage.getItem("personalAvatar")
);

  // Load the actual logged-in student's profile from MongoDB
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    fetch("http://localhost:5000/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Could not load your profile.");
        }

        const savedUser = data.user;

        setProfile({
          name: savedUser.name ?? "",
          email: savedUser.email ?? "",
          college: savedUser.college ?? "",
          branch: savedUser.branch ?? "",
          year: savedUser.year ?? 1,
          semester: savedUser.semester ?? 1,
          careerGoal: savedUser.careerGoal ?? "",
          availableHours: savedUser.availableHours ?? 0,
          preferredStudyTime: savedUser.preferredStudyTime ?? "",
        });

        // Keep local user details in sync with the database
        localStorage.setItem("user", JSON.stringify(savedUser));
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error ? err.message : "Could not load your profile."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleChange = (
    field: keyof StudentProfile,
    value: string | number
  ) => {
    setProfile((previous) => ({
      ...previous,
      [field]: value,
    }));

    setMessage("");
    setError("");
  };

  // Save profile details to MongoDB
  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const response = await fetch(
        "http://localhost:5000/api/auth/profile",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: profile.name.trim(),
            college: profile.college.trim(),
            branch: profile.branch.trim(),
            year: profile.year,
            semester: profile.semester,
            careerGoal: profile.careerGoal.trim(),
            availableHours: profile.availableHours,
            preferredStudyTime: profile.preferredStudyTime,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not save your profile.");
      }

      // Use the profile returned by the backend
      const savedUser = data.user;

      setProfile((previous) => ({
        ...previous,
        name: savedUser.name ?? previous.name,
        email: savedUser.email ?? previous.email,
        college: savedUser.college ?? previous.college,
        branch: savedUser.branch ?? previous.branch,
        year: savedUser.year ?? previous.year,
        semester: savedUser.semester ?? previous.semester,
        careerGoal: savedUser.careerGoal ?? previous.careerGoal,
        availableHours:
          savedUser.availableHours ?? previous.availableHours,
        preferredStudyTime:
          savedUser.preferredStudyTime ?? previous.preferredStudyTime,
      }));

      localStorage.setItem("user", JSON.stringify(savedUser));
      setMessage("Profile saved successfully! Redirecting...");

window.setTimeout(() => {
  window.location.href = "/dashboard";
}, 1000);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Could not save your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="profile-loading">
        <p>Loading your profile...</p>
      </main>
    );
  }

  return (
    <main className="profile-page">
      <div className="profile-container">
        <button
          type="button"
          className="profile-back-button"
          onClick={() => {
            window.location.href = "/dashboard";
          }}
        >
          <span aria-hidden="true">←</span> Back to Dashboard
        </button>

 <header className="profile-header">
  <span className="profile-eyebrow">YOUR STUDENT SPACE</span>

  <div className="profile-heading-row">
    <div className="profile-heading-text">
      <h1>My Student Profile</h1>

      <p>
        Keep your academic details updated to personalize your study
        planning and dashboard.
      </p>
    </div>

    {avatar && (
      <div className="profile-page-avatar">
        <img src={avatar} alt="My profile avatar" />
      </div>
    )}
  </div>
</header>

        <section className="profile-card">
          <div className="profile-section-heading">
            <h2>Academic Information</h2>
            <p>
              Enter your real details once. You can update them whenever
              something changes.
            </p>
          </div>

          <form className="profile-form" onSubmit={handleSave}>
            <div className="profile-field">
              <label htmlFor="profile-name">Full Name</label>
              <input
                id="profile-name"
                type="text"
                autoComplete="name"
                placeholder="Enter your full name"
                value={profile.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>

            <div className="profile-field">
              <label htmlFor="profile-email">Email Address</label>
              <input
                id="profile-email"
                type="email"
                autoComplete="email"
                value={profile.email}
                readOnly
              />
            </div>

            <div className="profile-field profile-field-full">
              <label htmlFor="profile-college">College / University</label>
              <input
                id="profile-college"
                type="text"
                placeholder="Enter your college or university"
                value={profile.college}
                onChange={(e) => handleChange("college", e.target.value)}
              />
            </div>

            <div className="profile-field">
              <label htmlFor="profile-branch">Branch / Program</label>
              <input
                id="profile-branch"
                type="text"
                placeholder="e.g. Computer Science and Technology"
                value={profile.branch}
                onChange={(e) => handleChange("branch", e.target.value)}
              />
            </div>

            <div className="profile-field">
              <label htmlFor="profile-year">Current Year</label>
              <select
                id="profile-year"
                value={profile.year}
                onChange={(e) =>
                  handleChange("year", Number(e.target.value))
                }
              >
                {[1, 2, 3, 4, 5, 6].map((year) => (
                  <option key={year} value={year}>
                    Year {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="profile-field">
              <label htmlFor="profile-semester">Current Semester</label>
              <select
                id="profile-semester"
                value={profile.semester}
                onChange={(e) =>
                  handleChange("semester", Number(e.target.value))
                }
              >
                {Array.from({ length: 12 }, (_, index) => index + 1).map(
                  (semester) => (
                    <option key={semester} value={semester}>
                      Semester {semester}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="profile-field">
              <label htmlFor="profile-career">Career Goal</label>
              <input
                id="profile-career"
                type="text"
                placeholder="Your career goal (optional)"
                value={profile.careerGoal}
                onChange={(e) => handleChange("careerGoal", e.target.value)}
              />
            </div>

            <div className="profile-field">
              <label htmlFor="profile-hours">
                Available Study Hours Per Day
              </label>
              <input
                id="profile-hours"
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={profile.availableHours}
                onChange={(e) =>
                  handleChange("availableHours", Number(e.target.value))
                }
              />
            </div>

            <div className="profile-field profile-field-full">
              <label htmlFor="profile-study-time">
                Preferred Study Time
              </label>
              <select
                id="profile-study-time"
                value={profile.preferredStudyTime}
                onChange={(e) =>
                  handleChange("preferredStudyTime", e.target.value)
                }
              >
                <option value="">Not selected</option>
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Evening">Evening</option>
                <option value="Night">Night</option>
              </select>
            </div>

            {error && (
              <p
                className="profile-message profile-message-error"
                role="alert"
              >
                {error}
              </p>
            )}

            {message && (
              <p
                className="profile-message profile-message-success"
                role="status"
              >
                {message}
              </p>
            )}

            <div className="profile-form-actions">
              <button
                type="submit"
                className="profile-save-button"
                disabled={saving}
              >
                {saving ? "Saving your profile..." : "Save Profile"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

export default Profile;
