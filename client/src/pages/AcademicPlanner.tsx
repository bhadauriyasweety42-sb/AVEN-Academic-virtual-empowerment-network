
import { useState, type ChangeEvent, type FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./AcademicPlanner.css";

export default function AcademicPlanner() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [notes, setNotes] = useState("");

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;

    setError("");
    setSuccess("");
    setNotes("");

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const allowedExtensions = [".pdf", ".pptx", ".docx", ".txt"];
    const lowerName = selectedFile.name.toLowerCase();
    const supported = allowedExtensions.some((extension) => lowerName.endsWith(extension));
    if (!supported) {
      setFile(null);
      setError("Supported files: PDF, PPTX, DOCX, and TXT.");
      event.target.value = "";
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setFile(null);
      setError("File size must be 10 MB or less.");
      event.target.value = "";
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!file) {
      setError("Please select a syllabus, notes, or timetable file first.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please log in again to upload your study file.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setNotes("");

    try {
      const formData = new FormData();
      formData.append("document", file);

      const response = await fetch(
        "http://localhost:5000/api/planner/upload",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Document upload failed.");
      }

      
setNotes(data.notes || "");

if (!data.notes) {
  throw new Error("The PDF was processed, but no smart notes were returned.");
}

const detail = data.totalSlides
  ? `${data.totalSlides} slides`
  : data.totalPages
    ? `${data.totalPages} pages`
    : `${String(data.fileType || "file").toUpperCase()} processed`;
setSuccess(`Smart notes generated successfully! ${data.fileName} · ${detail}`);

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not upload the PDF. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="academic-planner">
      <header className="planner-header">
        <button
          type="button"
          className="planner-back"
          onClick={() => {
            window.location.href = "/dashboard";
          }}
        >
          ← Back to Dashboard
        </button>

        <p className="planner-eyebrow">YOUR ACADEMIC WORKSPACE</p>
        <h1>Academic Planner</h1>
        <p className="planner-description">
          Upload study material to generate concise, exam-oriented notes.
        </p>
      </header>

      <section className="planner-card">
        <div className="planner-file-icon">📚</div>
        <h2>Upload study material</h2>
        <p>
          Supported formats: PDF, PowerPoint (.pptx), Word (.docx), and text (.txt). Maximum file size: 10 MB.
        </p>

        <form onSubmit={handleUpload}>
          <label htmlFor="academic-pdf" className="planner-file-label">
            Choose study file
          </label>

          <input
            id="academic-pdf"
            type="file"
            accept=".pdf,.pptx,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            onChange={handleFileChange}
          />

          {file && (
            <p className="planner-selected-file">
              Selected: {file.name}
            </p>
          )}

          <button
            className="planner-upload-button"
            type="submit"
            disabled={loading || !file}
          >
{loading ? "Generating Smart Notes..." : "Generate Smart Notes"}

          </button>
        </form>

        {error && (
          <p className="planner-message planner-error" role="alert">
            {error}
          </p>
        )}

        {success && (
          <p className="planner-message planner-success" role="status">
            {success}
          </p>
        )}
      </section>

     
{notes && (
  <section className="planner-preview">
    <h2>📘 Your Smart Notes</h2>
    <p>
      AI-generated concise study notes based on your uploaded material.
    </p>
   
<div className="notes-content">
  <ReactMarkdown remarkPlugins={[remarkGfm]}>
    {notes}
  </ReactMarkdown>
</div>

  </section>
)}


      <p className="planner-note">
        Upload supported study material to generate concise, exam-oriented notes. Review AI-generated notes before relying on them for exams.
      </p>
    </main>
  );
}
