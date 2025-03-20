import React, { useState, useEffect, useRef } from "react";
import { useGlobalStore } from "../store/useGlobalStore";

const FileBrowser: React.FC = () => {
  const serverURL = import.meta.env.VITE_SERVER_URL;
  const defaultPath = import.meta.env.VITE_DEFAULT_FILE_BROWSER_PATH;

  const { setCurrentSlide } = useGlobalStore();

  const [currentPath, setCurrentPath] = useState<string>("");
  const [directories, setDirectories] = useState<string[]>([]);
  const [files, setFiles] = useState<string[]>([]);
  const [filteredDirectories, setFilteredDirectories] = useState<string[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<string[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null); // Reference to the component

  useEffect(() => {
    const initPath = async () => {
      try {
        const response = await fetch(`${serverURL}/home_directory/`);
        const data = await response.text();
        const homeDirPath = data.replace(/['"`]/g, "");
        setCurrentPath(homeDirPath);
        fetchDirectory(homeDirPath);
      } catch (error) {
        console.error("Error fetching username", error);
      }
    };

    if (defaultPath) {
      setCurrentPath(defaultPath);
      fetchDirectory(defaultPath);
    } else {
      initPath();
    }
  }, []);

  const fetchDirectory = async (path: string) => {
    try {
      const response = await fetch(`${serverURL}/file_browse/?dir_path=${encodeURIComponent(path)}`);
      if (!response.ok) {
        setDirectories([]);
        setFiles([]);
        setFilteredDirectories([]);
        setFilteredFiles([]);
        throw new Error(`Error fetching directory contents: ${response.statusText}`);
      }
      const data = await response.json();
      setDirectories(data.directories || []);
      setFiles(data.files || []);
      setFilteredDirectories(data.directories || []);
      setFilteredFiles(data.files || []);
    } catch (error) {
      console.error("Error fetching directory contents", error);
    }
  };

  const handleReload = () => {
    fetchDirectory(currentPath);
  };


  const handleDirectoryClick = (dir: string) => {
    if (dir === "..") {
      handleGoBack();
      return;
    }
    const fullPath = currentPath.split("/").slice(0, -1).join("/");
    const newPath = `${fullPath}/${dir}/`;
    setCurrentPath(newPath);
    fetchDirectory(newPath);
  };

  const handleFileClick = (file: string) => {
    setCurrentSlide(`${currentPath}${file}`);
  };

  const handleGoBack = () => {
    if (currentPath === "/") return;

    let endIdx: number = -1;
    if (currentPath.endsWith("/")) {
      endIdx = -2;
    }
    const newPath = currentPath.split("/").slice(0, endIdx).join("/") + "/";
    setCurrentPath(newPath);
    fetchDirectory(newPath);
  };

  const handlePathChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newPath = event.target.value;

    const oldDepth = currentPath.split("/").length;
    const newDepth = newPath.split("/").length;

    setCurrentPath(newPath);

    if (oldDepth !== newDepth) {
      let endIdx: number = -1;
      if (newPath.endsWith("/")) {
        endIdx = -2;
      }
      fetchDirectory(newPath.split("/").slice(0, -1).join("/") + "/");
    }

    const lowerCasePath = newPath.toLowerCase();
    setFilteredDirectories(
      directories.filter((dir) => dir.toLowerCase().startsWith(lowerCasePath.split("/").slice(-1)[0]))
    );
    setFilteredFiles(files.filter((file) => file.toLowerCase().startsWith(lowerCasePath.split("/").slice(-1)[0])));
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        // Click was outside the component, allow blur
        return;
      }

      // Click was inside, ensure focus stays on input
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "90%",
        maxWidth: "600px",
        padding: "16px",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    >
      <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
        <button onClick={handleGoBack} disabled={currentPath === "/"}>⬅</button>
        <button onClick={handleReload}>🔄</button>
        <input
          ref={inputRef}
          type="text" 
          value={currentPath}
          onChange={handlePathChange}
          style={{
            flexGrow: 1,
            maxWidth: "100%", // Ensures it doesn't exceed parent width
            width: "100%", // Makes it responsive to parent size
            boxSizing: "border-box" // Ensures padding/borders don’t add to width
          }}
        />
      </div>
      <ul
        style={{
          maxHeight: "300px",
          overflowY: "auto",
          border: "1px solid #ddd",
          padding: "8px",
          borderRadius: "4px",
        }}
      >
        {filteredDirectories.map((dir) => (
          <li key={dir} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }} onClick={() => handleDirectoryClick(dir)}>
            📁 {dir}
          </li>
        ))}
        {filteredFiles.map((file) => (
          <li key={file} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }} onClick={() => handleFileClick(file)}>
            📄 {file}
          </li>
        ))}
      </ul>
      Files: {filteredFiles.length}
    </div>
  );
};

export default FileBrowser;
