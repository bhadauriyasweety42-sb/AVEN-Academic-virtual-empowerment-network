import { motion } from "framer-motion";

type StudyBuddyCardProps = {
  name: string;
  personality: string;
  image: string;
  selected: boolean;
  onSelect: () => void;
};

function StudyBuddyCard({
  name,
  personality,
  image,
  selected,
  onSelect,
}: StudyBuddyCardProps) {
  return (
    <motion.button
      type="button"
      className={`buddy-card ${selected ? "selected" : ""}`}
      onClick={onSelect}
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
    >
      {selected && (
        <motion.div
          className="selected-check"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          ✓
        </motion.div>
      )}

      <div className="buddy-image-area">
        <motion.img
          src={image}
          alt={name}
          className="buddy-image"
          animate={
            selected
              ? { scale: 1.04, y: -3 }
              : { scale: 1, y: 0 }
          }
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="buddy-info">
        <h3>{name}</h3>
        <p>{personality}</p>
      </div>
    </motion.button>
  );
}

export default StudyBuddyCard;