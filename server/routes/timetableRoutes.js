
const express = require("express");
const multer = require("multer");
const { extractDocumentText } = require("../utils/extractDocumentText");
const { GoogleGenAI } = require("@google/genai");
const webPush = require("web-push");

const authMiddleware = require("../middleware/authMiddleware");
const TimetableClass = require("../models/TimetableClass");
const PushSubscription = require("../models/PushSubscription");

const router = express.Router();

const path = require("path");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const extension = path
      .extname(file.originalname || "")
      .toLowerCase();

    const allowedExtensions = [
      ".pdf",
      ".pptx",
      ".docx",
      ".txt",
      ".png",
      ".jpg",
      ".jpeg",
    ];

    if (allowedExtensions.includes(extension)) {
      return cb(null, true);
    }

    cb(
      new Error(
        "Unsupported timetable file. Upload PDF, PPTX, DOCX, TXT, PNG, JPG or JPEG."
      )
    );
  },
});

function getUserId(req) {
  return (
    req.userId ||
    req.user?.id ||
    req.user?._id ||
    req.user?.userId
  );
}

function configurePush() {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } =
    process.env;

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
    throw new Error("Web Push VAPID environment variables are missing.");
  }

  webPush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

// Get saved classes
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Invalid login." });

    const classes = await TimetableClass.find({ userId, active: true })
      .sort({ dayOfWeek: 1, startTime: 1 });

    res.json({ classes });
  } catch (error) {
    console.error("Timetable GET error:", error);
    res.status(500).json({ message: "Could not load timetable." });
  }
});

// Extract weekly classes from supported timetable documents. User reviews before saving.

router.post(
  "/upload",
  authMiddleware,
  upload.single("document"),
  async (req, res) => {
    try {
      const userId = getUserId(req);

      if (!userId) {
        return res.status(401).json({ message: "Please log in again." });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Select a timetable file." });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ message: "Gemini API key is missing." });
      }


      // 1. Process image screenshots directly; extract text from documents.
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
      });

      const prompt = `
Extract recurring weekly college classes from this timetable.

Return ONLY a valid JSON array. No Markdown.
Each class must contain:
subject, dayOfWeek, startTime, endTime, room, faculty.

dayOfWeek: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday,
4=Thursday, 5=Friday, 6=Saturday.
Times must use 24-hour HH:mm format.
Use "" for unknown room or faculty.
Never invent missing details. Omit ambiguous classes.
`;


const isImage = ["image/png", "image/jpeg"].includes(
  req.file.mimetype
);

const isPdf =
  path.extname(req.file.originalname || "").toLowerCase() === ".pdf";

let contents;
let extracted = { text: "", pages: undefined, slides: undefined };

if (isImage || isPdf) {
  // Let Gemini visually read images and PDF documents.
  contents = [
    {
      role: "user",
      parts: [
        {
          inlineData: {
            mimeType: isPdf ? "application/pdf" : req.file.mimetype,
            data: req.file.buffer.toString("base64"),
          },
        },
        { text: prompt },
      ],
    },
  ];

  if (isPdf) {
    try {
      extracted = await extractDocumentText(req.file);
    } catch (error) {
      console.warn("PDF text extraction skipped:", error.message);
    }
  }
} else {
  extracted = await extractDocumentText(req.file);
  const text = extracted.text?.trim();

  if (!text) {
    return res.status(422).json({
      message:
        "No readable text found in this document. Please upload a clearer file.",
    });
  }

  if (text.length > 30000) {
    return res.status(413).json({
      message: "Please upload a smaller or week-wise timetable.",
    });
  }

  contents = `${prompt}\n\nTIMETABLE:\n${text}`;
}

      // 2. Ask Gemini to extract the classes.
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents,
        config: { maxOutputTokens: 4000 },
      });


      // 3. Parse and validate AI output before changing saved data.
      const raw = response.text?.trim() || "";
      const json = raw
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "");

      const parsed = JSON.parse(json);

      if (!Array.isArray(parsed) || parsed.length === 0) {
        return res.status(422).json({
          message:
            "AI could not identify any classes. Please upload a clearer timetable.",
        });
      }

      if (parsed.length > 100) {
        return res.status(422).json({
          message: "Too many classes were extracted. Please check the timetable file.",
        });
      }

      const validTime = (value) =>
        typeof value === "string" &&
        /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

      const classes = parsed.map((item) => ({
        subject: typeof item.subject === "string" ? item.subject.trim() : "",
        dayOfWeek: item.dayOfWeek,
        startTime: item.startTime,
        endTime: item.endTime,
        room: typeof item.room === "string" ? item.room.trim() : "",
        faculty: typeof item.faculty === "string" ? item.faculty.trim() : "",
      }));

      const invalid = classes.some((item) =>
        !item.subject ||
        !Number.isInteger(item.dayOfWeek) ||
        item.dayOfWeek < 0 ||
        item.dayOfWeek > 6 ||
        !validTime(item.startTime) ||
        !validTime(item.endTime) ||
        item.endTime <= item.startTime
      );

      if (invalid) {
        return res.status(422).json({
          message:
            "AI returned incomplete or invalid class details. Your existing timetable has not been changed.",
        });
      }

      // 4. Save the new timetable first. Keep the old timetable if insertion fails.
      const saved = await TimetableClass.insertMany(
        classes.map((item) => ({
          userId,
          ...item,
          active: true,
        }))
      );

      // Only after successful insertion, remove the user's previous timetable.
      await TimetableClass.deleteMany({
        userId,
        _id: { $nin: saved.map((item) => item._id) },
      });

      // 5. Return the saved schedule to the frontend.
      return res.json({
        message: "Timetable processed and saved successfully.",
        fileName: req.file.originalname,
        totalPages: extracted.pages,
        totalSlides: extracted.slides,
        classes: saved,
        totalClasses: saved.length,
        reminders:
          "Timetable saved. Reminder delivery depends on the class reminder scheduler and push subscription.",
      });
    } catch (error) {
      console.error("Timetable upload/save error:", error);

      return res.status(500).json({
        message: "Could not process and save the timetable.",
      });
    }
  }
);


// Save classes after user reviews them
router.put("/", authMiddleware, async (req, res) => {
  try {
    const userId = getUserId(req);
    const classes = req.body.classes;

    if (!userId) return res.status(401).json({ message: "Invalid login." });
    if (!Array.isArray(classes) || classes.length > 100) {
      return res.status(400).json({ message: "Invalid timetable data." });
    }

    for (const item of classes) {
      if (
        !item.subject?.trim() ||
        !Number.isInteger(item.dayOfWeek) ||
        item.dayOfWeek < 0 ||
        item.dayOfWeek > 6 ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(item.startTime) ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(item.endTime) ||
        item.endTime <= item.startTime
      ) {
        return res.status(400).json({
          message: "One or more classes have invalid subjects or times.",
        });
      }
    }

    await TimetableClass.deleteMany({ userId });

    const saved = await TimetableClass.insertMany(
      classes.map((item) => ({
        userId,
        subject: item.subject.trim(),
        dayOfWeek: item.dayOfWeek,
        startTime: item.startTime,
        endTime: item.endTime,
        room: item.room || "",
        faculty: item.faculty || "",
        active: true,
      }))
    );

    res.json({ message: "Timetable saved.", classes: saved });
  } catch (error) {
    console.error("Timetable save error:", error);
    res.status(500).json({ message: "Could not save timetable." });
  }
});

// Expose the public key, never the private key
router.get("/push/public-key", authMiddleware, (req, res) => {
  if (!process.env.VAPID_PUBLIC_KEY) {
    return res.status(500).json({ message: "VAPID public key is missing." });
  }
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// Store this browser's subscription
router.post("/push/subscribe", authMiddleware, async (req, res) => {
  try {
    const userId = getUserId(req);
    const subscription = req.body.subscription;

    if (!userId) return res.status(401).json({ message: "Invalid login." });
    if (!subscription?.endpoint || !subscription?.keys?.p256dh ||
        !subscription?.keys?.auth) {
      return res.status(400).json({ message: "Invalid push subscription." });
    }

    await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      { userId, endpoint: subscription.endpoint, subscription },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ message: "Push notifications enabled." });
  } catch (error) {
    console.error("Push subscribe error:", error);
    res.status(500).json({ message: "Could not save push subscription." });
  }
});

// Send a test push notification
router.post("/push/test", authMiddleware, async (req, res) => {
  try {
    configurePush();
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Invalid login." });

    const subscriptions = await PushSubscription.find({ userId });
    if (!subscriptions.length) {
      return res.status(404).json({ message: "Enable notifications first." });
    }

    const results = await Promise.allSettled(
      subscriptions.map((item) =>
        webPush.sendNotification(
          item.subscription,
          JSON.stringify({
            title: "AI Student Manager",
            body: "Your class reminder notifications are working!",
            url: "/academic-planner",
          })
        )
      )
    );

    res.json({
      message: "Test notification request sent.",
      deliveredToPushService: results.filter((r) => r.status === "fulfilled").length,
      failed: results.filter((r) => r.status === "rejected").length,
    });
  } catch (error) {
    console.error("Test push error:", error);
    res.status(500).json({ message: error.message || "Test notification failed." });
  }
});

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ message: error.message });
  }
  if (error.message && error.message.startsWith("Unsupported timetable file.")) {
    return res.status(400).json({ message: error.message });
  }
  next(error);
});

module.exports = router;
