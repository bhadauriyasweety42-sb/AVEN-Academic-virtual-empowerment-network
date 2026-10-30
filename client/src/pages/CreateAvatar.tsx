import { useState } from "react";
import { motion } from "framer-motion";
import "./CreateAvatar.css";

function CreateAvatar() {
  const [photo, setPhoto] = useState<string | null>(() =>
    localStorage.getItem("personalAvatar")
  );
  const [avatarName, setAvatarName] = useState("");
  const [saved, setSaved] = useState(false);

  const handlePhotoUpload = (file?: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Please select an image smaller than 5 MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPhoto(reader.result);
        setSaved(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const saveAvatar = () => {
    if (!photo) return;

    try {
      localStorage.setItem("personalAvatar", photo);
      localStorage.setItem("personalAvatarName", avatarName.trim());
      setSaved(true);
    } catch {
      alert("Image storage is full. Please use a smaller photo.");
    }
  };

  return (
    <main className="create-avatar-page">
      <motion.section
        className="avatar-builder"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="avatar-eyebrow">YOUR PERSONAL SPACE</p>
        <h1>Create My 3D Avatar ✨</h1>
        <p className="avatar-description">
          Create a profile that feels like you.
        </p>

        <div className="avatar-preview">
          {photo ? (
            <img src={photo} alt="Your avatar preview" />
          ) : (
            <div className="avatar-placeholder">
              <span>✦</span>
              <strong>Your avatar starts here</strong>
              <small>Upload a clear photo to get started</small>
            </div>
          )}
        </div>

        <label className="avatar-upload">
          <input
            type="file"
            accept="image/*"
            onChange={(event) =>
              handlePhotoUpload(event.target.files?.[0])
            }
          />
          {photo ? "Choose another photo" : "Upload your photo"}
        </label>

        <label className="avatar-name-label" htmlFor="avatar-name">
          Avatar name (optional)
        </label>
        <input
          id="avatar-name"
          className="avatar-name-input"
          value={avatarName}
          onChange={(event) => setAvatarName(event.target.value)}
          placeholder="Give your avatar a name"
          maxLength={40}
        />

        <button
          className="avatar-save-button"
          type="button"
          onClick={saveAvatar}
          disabled={!photo}
        >
          Save as Profile Avatar
        </button>

        {saved && (
          <p className="avatar-success" role="status">
            Avatar saved successfully! 💜
          </p>
        )}

        <p className="avatar-note">
          This first version saves your photo as your avatar.
          3D avatar generation will be connected in the next step.
        </p>
      </motion.section>
    </main>
  );
}

export default CreateAvatar;