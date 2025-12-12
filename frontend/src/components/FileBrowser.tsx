import React, { useState, useEffect } from "react";

interface FileBrowserProps {
  currentPath: string; // Add currentPath to props
  onFileSelect: (filePath: string) => void;
  onDirectoryChange: (directoryPath: string) => void;
}

interface FileEntry {
  name: string;
  isDirectory: boolean;
  isFile: boolean;
  size: number;
  birthtime: Date;
  mtime: Date;
}

const FileBrowser: React.FC<FileBrowserProps> = ({
  currentPath: initialPath,
  onFileSelect,
  onDirectoryChange,
}) => {
  const [currentPath, setCurrentPath] = useState<string>(initialPath);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentPath(initialPath); // Update internal state when prop changes
  }, [initialPath]);

  useEffect(() => {
    fetchFiles(currentPath);
  }, [currentPath]);

  const fetchFiles = async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/files/list?path=${encodeURIComponent(path)}`,
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_API_TOKEN}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data: FileEntry[] = await response.json();
      setFiles(data);
    } catch (err: unknown) {
      // Use unknown for caught errors
      setError(err instanceof Error ? err.message : String(err)); // Handle error gracefully
    } finally {
      setLoading(false);
    }
  };

  const handlePathChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentPath(event.target.value);
  };

  const handleLoadClick = () => {
    fetchFiles(currentPath);
  };

  const handleEntryClick = (entry: FileEntry) => {
    const newPath = `${currentPath}/${entry.name}`;
    if (entry.isDirectory) {
      setCurrentPath(newPath);
      onDirectoryChange(newPath);
    } else {
      onFileSelect(newPath);
    }
  };

  return (
    <div className="file-browser">
      <h2>File Browser</h2>
      <input
        type="text"
        value={currentPath}
        onChange={handlePathChange}
        placeholder="Enter path"
      />
      <button onClick={handleLoadClick} disabled={loading}>
        Load
      </button>
      {loading && <p>Loading files...</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      <ul>
        {files.map((file) => (
          <li key={file.name} onClick={() => handleEntryClick(file)}>
            {file.isDirectory ? "📁" : "📄"} {file.name}
            {file.isFile && <span> ({file.size} bytes)</span>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FileBrowser;
