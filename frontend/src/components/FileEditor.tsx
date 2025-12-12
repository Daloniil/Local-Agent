import React, { useState, useEffect } from "react";

interface FileEditorProps {
  filePath: string | null;
  readOnly: boolean;
}

const FileEditor: React.FC<FileEditorProps> = ({ filePath, readOnly }) => {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (filePath) {
      readFileContent(filePath);
    } else {
      setContent("");
    }
  }, [filePath]);

  const readFileContent = async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/files/read?path=${encodeURIComponent(path)}`,
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_API_TOKEN}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data = await response.text(); // Assuming file content is plain text
      setContent(data);
    } catch (err: unknown) {
      // Use unknown for caught errors
      setError(err instanceof Error ? err.message : String(err)); // Handle error gracefully
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/files/write", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_API_TOKEN}`,
        },
        body: JSON.stringify({ path: filePath, content }),
      });
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      setMessage("File saved successfully!");
    } catch (err: unknown) {
      // Use unknown for caught errors
      setError(err instanceof Error ? err.message : String(err)); // Handle error gracefully
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      // For backup, we can re-use the write endpoint, as it creates a backup automatically.
      // Or we can create a dedicated backup endpoint in backend if more control is needed.
      const response = await fetch("/api/files/write", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_API_TOKEN}`,
        },
        body: JSON.stringify({ path: filePath, content }),
      });
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      setMessage("Backup created and file saved!");
    } catch (err: unknown) {
      // Use unknown for caught errors
      setError(err instanceof Error ? err.message : String(err)); // Handle error gracefully
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="file-editor">
      <h2>File Editor: {filePath || "No file selected"}</h2>
      {loading && <p>Loading content...</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        readOnly={readOnly || !filePath}
        rows={20}
        cols={80}
      />
      {!readOnly && filePath && (
        <div>
          <button onClick={handleSave} disabled={loading}>
            Save
          </button>
          <button onClick={handleBackup} disabled={loading}>
            Backup & Save
          </button>
        </div>
      )}
    </div>
  );
};

export default FileEditor;
