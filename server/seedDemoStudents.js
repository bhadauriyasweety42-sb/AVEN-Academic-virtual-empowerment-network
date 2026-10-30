
/**
 * AURA DEMO DATA SEEDER
 * Run inside server folder: node seedDemoStudents.js
 * Only resets accounts marked as AURA demo accounts.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("./models/User");
const Task = require("./models/Task");
const Activity = require("./models/Activity");
const FocusSession = require("./models/FocusSession");
const TimetableClass = require("./models/TimetableClass");

const MARKER = "AURA_DEMO_SEED_V1";

const START = new Date("2025-10-30T00:00:00.000Z");
const END = new Date("2026-10-29T23:59:59.999Z");


const STUDENTS = [
  {
    name: "Sweety Bhadauriya",
    email: "sweetybhadauriya@gmail.com",
    password: "Sweety@123",
    branch: "Computer Science",
    year: 2,
    semester: 4,
    careerGoal: "Software Engineer",
    availableHours: 4,
    preferredStudyTime: "Evening",
    profile: "consistent"
  },
  {
    name: "Unnati Gupta",
    email: "unnatigupta@gmail.com",
    password: "Unnati@123",
    branch: "Computer Science",
    year: 2,
    semester: 4,
    careerGoal: "AI/ML Engineer",
    availableHours: 3,
    preferredStudyTime: "Morning",
    profile: "improving"
  }
];

const SUBJECTS = [
  "Data Structures",
  "Database Management Systems",
  "Operating Systems",
  "Computer Networks",
  "Mathematics",
  "Python Programming"
];

const TOPICS = {
  "Data Structures": ["Arrays", "Linked Lists", "Stacks and Queues", "Trees", "Graphs"],
  "Database Management Systems": ["ER Model", "SQL Queries", "Normalization", "Transactions"],
  "Operating Systems": ["Process Management", "CPU Scheduling", "Memory Management", "Deadlocks"],
  "Computer Networks": ["OSI Model", "TCP/IP", "Routing", "Network Security"],
  Mathematics: ["Matrices", "Probability", "Differential Equations", "Statistics"],
  "Python Programming": ["Functions", "OOP", "File Handling", "Libraries"]
};

const pad = n => String(n).padStart(2, "0");

const dateKey = d =>
  `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

const addDays = (d, n) =>
  new Date(d.getTime() + n * 86400000);

const pick = (arr, random) =>
  arr[Math.floor(random() * arr.length)];

function seededRandom(seed) {
  let x = seed >>> 0;
  return () => {
    x = (x * 1664525 + 1013904223) >>> 0;
    return x / 4294967296;
  };
}

function completionRate(student, date) {
  if (student.profile === "consistent") {
    return 0.84 + (date.getUTCMonth() % 3) * 0.025;
  }

  const months =
    (date.getUTCFullYear() - 2025) * 12 +
    date.getUTCMonth() - 9;

  return Math.min(0.82, 0.48 + Math.max(0, months) * 0.03);
}

function createTimetable(userId) {
  const slots = [
    ["Data Structures", "09:00", "10:00"],
    ["Database Management Systems", "10:15", "11:15"],
    ["Operating Systems", "11:30", "12:30"],
    ["Computer Networks", "13:30", "14:30"],
    ["Mathematics", "14:45", "15:45"],
    ["Python Programming", "09:30", "10:30"]
  ];

  const rows = [];

  for (let day = 1; day <= 6; day++) {
    const count = day === 6 ? 2 : 3;

    for (let i = 0; i < count; i++) {
      const s = slots[(day + i) % slots.length];

      rows.push({
        userId,
        subject: s[0],
        dayOfWeek: day,
        startTime: s[1],
        endTime: s[2],
        room: `C-${101 + ((day + i) % 8)}`,
        faculty: `Faculty ${1 + ((day + i) % 5)}`,
        active: true,
        sentReminderKeys: []
      });
    }
  }

  return rows;
}

async function resetDemoAccount(email) {
  const old = await User.findOne({ email });

  if (!old) return;

  if (old.college !== MARKER) {
    throw new Error(
      `Safety stop: ${email} exists but is not a marked demo account. No data deleted.`
    );
  }

  const userId = old._id;

  await Promise.all([
    Task.deleteMany({ userId }),
    Activity.deleteMany({ userId }),
    FocusSession.deleteMany({ userId }),
    TimetableClass.deleteMany({ userId }),
    User.deleteOne({ _id: userId })
  ]);
}

async function seedStudent(student, seed) {
  await resetDemoAccount(student.email);

  const user = await User.create({
    name: student.name,
    email: student.email,
    password: await bcrypt.hash(student.password, 10),
    college: MARKER,
    branch: student.branch,
    year: student.year,
    semester: student.semester,
    careerGoal: student.careerGoal,
    availableHours: student.availableHours,
    preferredStudyTime: student.preferredStudyTime
  });

  const random = seededRandom(seed);

  const tasks = [];
  const activities = [];
  const focusSessions = [];

  let dayCount = 0;

  for (
    let d = new Date(START);
    d <= END;
    d = addDays(d, 1)
  ) {
    const dow = d.getUTCDay();
    const date = dateKey(d);
    const weekday = dow >= 1 && dow <= 5;
    const rate = completionRate(student, d);

    // REGULAR CLASSES
    if (weekday) {
      const dailySubjects = [
        SUBJECTS[(dayCount + seed) % 6],
        SUBJECTS[(dayCount + 2 + seed) % 6]
      ];

      for (const subject of dailySubjects) {
        const hour = 9 + Math.floor(random() * 4);
        const minute = random() > 0.5 ? "30" : "00";
        const start = `${pad(hour)}:${minute}`;

        activities.push({
          userId: user._id,
          type: "class",
          title: `${subject} Lecture`,
          subject,
          date,
          startTime: start,
          endTime: `${pad(hour + 1)}:${minute}`,
          time: start,
          location: `Room ${101 + (dayCount % 12)}`,
          description: `Regular classroom session covering ${subject}.`,
          topic: pick(TOPICS[subject], random),
          duration: 50 + Math.floor(random() * 21),
          priority: "medium",
          status: "completed"
        });
      }

      // SELF STUDY
      if (random() < (student.profile === "consistent" ? 0.78 : 0.62)) {
        const subject = pick(SUBJECTS, random);

        activities.push({
          userId: user._id,
          type: "study",
          title: `${subject} Self Study`,
          subject,
          date,
          time: "18:00",
          startTime: "18:00",
          endTime: "19:00",
          description: "Self-directed revision and practice.",
          topic: pick(TOPICS[subject], random),
          duration: 45 + Math.floor(random() * 46),
          priority: "medium",
          status: "completed"
        });
      }
    }

    // WEEKEND REVISION
    else if (dow === 6 && random() < 0.45) {
      const subject = pick(SUBJECTS, random);

      activities.push({
        userId: user._id,
        type: "study",
        title: `Weekend Revision - ${subject}`,
        subject,
        date,
        time: "10:00",
        startTime: "10:00",
        endTime: "11:00",
        description: "Weekly revision and problem-solving practice.",
        topic: pick(TOPICS[subject], random),
        duration: 60,
        priority: "low",
        status: "completed"
      });
    }

    // TASKS
    if (weekday && random() < 0.72) {
      const subject = pick(SUBJECTS, random);
      const type = pick(
        ["assignment", "study", "project", "other"],
        random
      );

      const due = addDays(d, 2 + Math.floor(random() * 8));

      tasks.push({
        userId: user._id,
        title: pick([
          `Complete ${subject} practice set`,
          `Revise ${subject} lecture notes`,
          `Prepare ${subject} assignment`,
          `Solve ${subject} problem sheet`,
          `Work on ${subject} mini project`,
          `Prepare for ${subject} quiz`
        ], random),
        subject,
        description: `Academic task for ${subject}.`,
        type,
        deadline: due,
        duration: 30 + Math.floor(random() * 91),
        priority: pick(["low", "medium", "high"], random),
        status: random() < rate ? "completed" : "pending",
        createdAt: d,
        updatedAt: d
      });
    }

    // MONTHLY EXAMS AND ASSIGNMENTS
    if (d.getUTCDate() === 8 || d.getUTCDate() === 22) {
      const subject = pick(SUBJECTS, random);
      const exam = d.getUTCDate() === 22 && d.getUTCMonth() % 2 === 0;

      activities.push({
        userId: user._id,
        type: exam ? "exam" : "assignment",
        title: exam
          ? `${subject} Monthly Test`
          : `${subject} Assignment Submission`,
        subject,
        date,
        deadline: addDays(d, 1),
        time: "11:00",
        startTime: "11:00",
        endTime: "12:00",
        location: exam ? "Examination Hall" : "Online Submission",
        description: exam
          ? "Monthly assessment covering recently completed topics."
          : "Monthly assignment milestone.",
        topic: pick(TOPICS[subject], random),
        duration: 60,
        priority: "high",
        status: random() < rate ? "completed" : "pending"
      });
    }

    // FOCUS SESSIONS
    const focusChance =
      student.profile === "consistent"
        ? 0.72
        : 0.48 + (d.getUTCMonth() / 12) * 0.25;

    if ((weekday || dow === 6) && random() < focusChance) {
      const count = random() < 0.22 ? 2 : 1;

      for (let i = 0; i < count; i++) {
        const minutes =
          student.profile === "consistent"
            ? 35 + Math.floor(random() * 56)
            : 20 + Math.floor(random() * (35 + d.getUTCMonth() * 3));

        const started = new Date(Date.UTC(
          d.getUTCFullYear(),
          d.getUTCMonth(),
          d.getUTCDate(),
          16 + Math.floor(random() * 5),
          Math.floor(random() * 4) * 15
        ));

        focusSessions.push({
          userId: user._id,
          taskId: null,
          taskTitle: pick([
            "Deep Study Session",
            "Assignment Preparation",
            "Revision Session",
            "Coding Practice"
          ], random),
          durationMinutes: Math.min(180, minutes),
          status: "completed",
          startedAt: started,
          completedAt: new Date(started.getTime() + minutes * 60000)
        });
      }
    }

    dayCount++;
  }

  // MONTHLY PROJECTS
  for (let m = 0; m < 12; m++) {
    const d = new Date(Date.UTC(2025, 10 + m, 18));
    const subject = SUBJECTS[m % 6];

    activities.push({
      userId: user._id,
      type: "project",
      title: `${subject} Monthly Mini Project`,
      subject,
      date: dateKey(d),
      deadline: addDays(d, 7),
      time: "15:00",
      startTime: "15:00",
      endTime: "16:30",
      location: "Computer Lab",
      description: "Monthly practical project milestone and review.",
      topic: pick(TOPICS[subject], random),
      duration: 90,
      priority: "high",
      status: random() < completionRate(student, d)
        ? "completed"
        : "pending"
    });
  }

  const timetable = createTimetable(user._id);

  if (tasks.length) await Task.insertMany(tasks);
  if (activities.length) await Activity.insertMany(activities);
  if (focusSessions.length) await FocusSession.insertMany(focusSessions);
  if (timetable.length) await TimetableClass.insertMany(timetable);

  return {
    name: student.name,
    email: student.email,
    tasks: tasks.length,
    activities: activities.length,
    focusSessions: focusSessions.length,
    timetableClasses: timetable.length
  };
}

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error(
      "MONGO_URI missing. Keep it in server/.env; never paste it into this file."
    );
  }

  await mongoose.connect(process.env.MONGO_URI);

  try {
    console.log("Connected to MongoDB. Creating demo data...");

    const results = [];

    for (let i = 0; i < STUDENTS.length; i++) {
      results.push(
        await seedStudent(STUDENTS[i], 20261030 + i * 97)
      );
    }

    console.table(results);

    console.log("\nDEMO LOGINS");

    for (const s of STUDENTS) {
      console.log(
        `\n${s.name}\nEmail: ${s.email}\nPassword: ${s.password}`
      );
    }

    console.log("\nDate range: 2025-10-30 to 2026-10-29.");
    console.log("Only marked AURA demo accounts are reset.");

  } finally {
    await mongoose.disconnect();
  }
}

main().catch(async error => {
  console.error("Seeder failed:", error.message);

  try {
    await mongoose.disconnect();
  } catch (_) {}

  process.exitCode = 1;
});
