const express = require("express");
const User = require("../models/User");
const AIConversation = require("../models/AIConversation");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Get all conversations belonging to the logged-in student
router.get("/conversations", authMiddleware, async (req, res) => {
  try {
    const conversations = await AIConversation.find({
      userId: req.userId,
    })
      .select("title createdAt updatedAt")
      .sort({ updatedAt: -1 })
      .lean();

    return res.json({ conversations });
  } catch (error) {
    console.error("Load conversations error:", error.message);
    return res.status(500).json({
      message: "Could not load chat history.",
    });
  }
});

// Get messages from one conversation
router.get("/conversations/:id", authMiddleware, async (req, res) => {
  try {
    const conversation = await AIConversation.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found.",
      });
    }

    return res.json({ conversation });
  } catch (error) {
    console.error("Load conversation error:", error.message);
    return res.status(400).json({
      message: "Could not load this conversation.",
    });
  }
});

// Create a new conversation
router.post("/conversations", authMiddleware, async (req, res) => {
  try {
    const conversation = await AIConversation.create({
      userId: req.userId,
      title: "New conversation",
      messages: [],
    });

    return res.status(201).json({ conversation });
  } catch (error) {
    console.error("Create conversation error:", error.message);
    return res.status(500).json({
      message: "Could not create a conversation.",
    });
  }
});

// Send a message and save both the question and answer
router.post("/chat", authMiddleware, async (req, res) => {
  try {
    const message =
      typeof req.body.message === "string"
        ? req.body.message.trim()
        : "";

    let conversationId =
      typeof req.body.conversationId === "string"
        ? req.body.conversationId
        : "";

    if (!message) {
      return res.status(400).json({
        message: "Please enter a message.",
      });
    }

    if (message.length > 4000) {
      return res.status(400).json({
        message: "Message is too long. Please use under 4000 characters.",
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        message: "Gemini API key is missing in the server .env file.",
      });
    }

    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "Student profile not found. Please log in again.",
      });
    }

    let conversation;

    if (conversationId) {
      conversation = await AIConversation.findOne({
        _id: conversationId,
        userId: req.userId,
      });

      if (!conversation) {
        return res.status(404).json({
          message: "Conversation not found.",
        });
      }
    } else {
      conversation = await AIConversation.create({
        userId: req.userId,
        title: message.slice(0, 55),
        messages: [],
      });
    }

    const profile = [
      `Name: ${user.name || "Not provided"}`,
      `College: ${user.college || "Not provided"}`,
      `Branch: ${user.branch || "Not provided"}`,
      `Year: ${user.year ?? "Not provided"}`,
      `Semester: ${user.semester ?? "Not provided"}`,
      `Career goal: ${user.careerGoal || "Not provided"}`,
      `Available study hours per day: ${user.availableHours ?? "Not provided"}`,
      `Preferred study time: ${user.preferredStudyTime || "Not provided"}`,
    ].join("\n");

    const { GoogleGenAI } = await import("@google/genai");

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    // Include recent messages so the AI can follow the conversation
    const previousMessages = conversation.messages
      .slice(-12)
      .map((item) => ({
        role: item.role === "assistant" ? "model" : "user",
        parts: [{ text: item.content }],
      }));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: [
        ...previousMessages,
        { role: "user", parts: [{ text: message }] },
      ],
      config: {
        systemInstruction:
          "You are the AI Student Assistant inside AI Student Manager. " +
          "Help engineering students with studying, concepts, time management, " +
          "career planning, and productivity. Be friendly, clear, detailed, " +
          "and practical. Use Markdown headings, subheadings, numbered steps, " +
          "bullet points, and examples when useful.\n\n" +
          "Use the following authenticated student's profile to personalize " +
          "your answers when relevant. Do not invent missing details.\n\n" +
          "STUDENT PROFILE:\n" + profile,
        maxOutputTokens: 1200,
      },
    });

    const reply = response.text;

    if (!reply) {
      return res.status(502).json({
        message: "The AI did not return a text response. Please try again.",
      });
    }

    // Persist both messages only after the AI returns successfully
    conversation.messages.push(
      { role: "user", content: message },
      { role: "assistant", content: reply }
    );

    if (conversation.messages.length === 2) {
      conversation.title = message.slice(0, 55);
    }

    await conversation.save();

    return res.json({
      reply,
      conversationId: conversation._id.toString(),
      title: conversation.title,
    });
  } catch (error) {
    console.error("Gemini chat error:", error.message);

    return res.status(500).json({
      message:
        "AI request failed. Check the server terminal and Gemini API access.",
    });
  }
});

module.exports = router;