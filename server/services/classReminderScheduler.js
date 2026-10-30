
const cron = require("node-cron");
const webPush = require("web-push");
const TimetableClass = require("../models/TimetableClass");
const PushSubscription = require("../models/PushSubscription");

const TIME_ZONE = "Asia/Kolkata";

function getLocalParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  const dayNumbers = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3,
    Thu: 4, Fri: 5, Sat: 6,
  };

  return {
    dateKey: `${values.year}-${values.month}-${values.day}`,
    dayOfWeek: dayNumbers[values.weekday],
    hour: Number(values.hour),
    minute: Number(values.minute),
  };
}

function configurePush() {
  if (
    !process.env.VAPID_PUBLIC_KEY ||
    !process.env.VAPID_PRIVATE_KEY ||
    !process.env.VAPID_SUBJECT
  ) {
    throw new Error("VAPID configuration is missing.");
  }

  webPush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

async function sendClassReminders() {
  const now = getLocalParts();
  const nowMinutes = now.hour * 60 + now.minute;

  const classes = await TimetableClass.find({
    active: true,
    dayOfWeek: now.dayOfWeek,
  });

  for (const item of classes) {
    const [startHour, startMinute] = item.startTime.split(":").map(Number);
    const reminderAt = startHour * 60 + startMinute - 15;

    if (reminderAt !== nowMinutes) continue;

    const reminderKey = `${now.dateKey}-${item._id}`;

    if (item.sentReminderKeys.includes(reminderKey)) continue;

    const subscriptions = await PushSubscription.find({
      userId: item.userId,
    });

    if (!subscriptions.length) continue;

    let allSent = true;

    for (const savedSubscription of subscriptions) {
      try {
        await webPush.sendNotification(
          savedSubscription.subscription,
          JSON.stringify({
            title: `Class in 15 minutes: ${item.subject}`,
            body: `${item.startTime}–${item.endTime}${
              item.room ? ` · Room ${item.room}` : ""
            }`,
            url: "/academic-planner",
          }),
          { TTL: 3600, urgency: "high" }
        );
      } catch (error) {
        console.error("Push delivery error:", error.statusCode, error.message);

        if (error.statusCode === 404 || error.statusCode === 410) {
          await PushSubscription.deleteOne({ _id: savedSubscription._id });
        } else {
          allSent = false;
        }
      }
    }

    if (allSent) {
      await TimetableClass.updateOne(
        { _id: item._id },
        { $addToSet: { sentReminderKeys: reminderKey } }
      );
    }
  }
}

function startClassReminderScheduler() {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY || !process.env.VAPID_SUBJECT) {
    console.warn("Class push scheduler not started: VAPID configuration is incomplete. API server will continue running.");
    return false;
  }

  try {
    configurePush();
  } catch (error) {
    console.error("Class push scheduler not started:", error.message);
    return false;
  }

  cron.schedule("* * * * *", async () => {
    try {
      await sendClassReminders();
    } catch (error) {
      console.error("Class reminder scheduler error:", error);
    }
  }, { timezone: TIME_ZONE });

  console.log("Class reminder scheduler started (Asia/Kolkata).");
  return true;
}

module.exports = { startClassReminderScheduler };
