import { useState } from "react";
import { motion } from "framer-motion";

import StudyBuddyCard from "../components/StudyBuddyCard";
import "../StudyBuddy.css";

const kittenImg = "/mascots/kitten-waving.png";
const pandaImg = "/mascots/panda-waving.png";
const bearImg = "/mascots/bear-cub-waving.png";
const puppyImg = "/mascots/puppy-waving.png";

const buddies = [
  {
    id: "kitten",
    name: "Kitten",
    personality: "Curious & Creative",
    image: kittenImg,
  },
  {
    id: "panda",
    name: "Panda",
    personality: "Calm & Focused",
    image: pandaImg,
  },
  {
    id: "bear",
    name: "Bear Cub",
    personality: "Strong & Supportive",
    image: bearImg,
  },
  {
    id: "puppy",
    name: "Puppy",
    personality: "Energetic & Loyal",
    image: puppyImg,
  },
];

function StudyBuddy() {
  const [selectedBuddy, setSelectedBuddy] = useState<string | null>(null);

  const handleContinue = () => {
  if (!selectedBuddy) return;

  localStorage.setItem("studyBuddy", selectedBuddy);

  window.location.href = "/dashboard";
};

  return (
    <main className="buddy-page">
      <div className="buddy-background buddy-bg-one" />
      <div className="buddy-background buddy-bg-two" />

      <motion.section
        className="buddy-container"
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="buddy-brand">
          <span>✦</span>
          AI Student Manager
        </div>

        <div className="buddy-heading">
          <span className="buddy-small-title">YOUR STUDY JOURNEY</span>

          <h1>Choose Your Study Buddy</h1>

          <p>
            Pick a little companion to stay by your side while you plan,
            study and grow.
          </p>
        </div>

        <div className="buddy-grid">
          {buddies.map((buddy, index) => (
            <motion.div
              key={buddy.id}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.15 + index * 0.08,
                duration: 0.45,
              }}
            >
              <StudyBuddyCard
                name={buddy.name}
                personality={buddy.personality}
                image={buddy.image}
                selected={selectedBuddy === buddy.id}
                onSelect={() => setSelectedBuddy(buddy.id)}
              />
            </motion.div>
          ))}
        </div>

        <motion.button
          type="button"
          className="buddy-continue"
          disabled={!selectedBuddy}
          onClick={handleContinue}
          whileHover={selectedBuddy ? { y: -2 } : {}}
          whileTap={selectedBuddy ? { scale: 0.98 } : {}}
        >
          Continue
          <span>→</span>
        </motion.button>

        <p className="buddy-note">
          Don't worry — you can change your Study Buddy later.
        </p>
      </motion.section>
    </main>
  );
}

export default StudyBuddy;