import React, { useState, useEffect, useRef } from "react";
import { useGlobalStore } from "../store/useGlobalStore";


const FileBrowser: React.FC = () => {

  const serverURL = import.meta.env.VITE_SERVER_URL

  const {
    setCurrentSlide,
    } = useGlobalStore();

  const [currentPath, setCurrentPath] = useState<string>("");
  const [directories, setDirectories] = useState<string[]>([]);
  const [files, setFiles] = useState<string[]>([]);
  const [filteredDirectories, setFilteredDirectories] = useState<string[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  

  useEffect(() => {
    const initPath = async () => {
      try {
        const response = await fetch(`${serverURL}/username/`);
        const data = await response.text();
        const cleanedData = data.replace(/['"`]/g, "");
        const userPath = `/home/${cleanedData}/`;
        setCurrentPath(userPath);
        fetchDirectory(userPath);
      } catch (error) {
        console.error("Error fetching username", error);
      }
    };
    initPath();
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

  const handleDirectoryClick = (dir: string) => {

    if (dir === "..") {
      handleGoBack();
      return;
    }
    const fullPath = currentPath.split('/').slice(0, -1).join('/')
    const newPath = `${fullPath}/${dir}/`;
    setCurrentPath(newPath);
    fetchDirectory(newPath);
  };

  const handleFileClick = (file: string) => {
    setCurrentSlide(`${currentPath}${file}`);
  };

  const handleGoBack = () => {
    if (currentPath === '/') return;

    let endIdx: number = -1;
    if (currentPath.endsWith('/')) {endIdx = -2};
    const newPath = currentPath.split("/").slice(0, endIdx).join("/") + "/";
    setCurrentPath(newPath);
    fetchDirectory(newPath);
  };

  const handlePathChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newPath = event.target.value;

    const oldDepth = currentPath.split('/').length;
    const newDepth = newPath.split('/').length;

    setCurrentPath(newPath);

    if (oldDepth !== newDepth){
      let endIdx: number = -1;
      if (newPath.endsWith('/')) {endIdx = -2};
      fetchDirectory(newPath.split("/").slice(0, -1).join("/") + "/");
    }

    const lowerCasePath = newPath.toLowerCase();
    setFilteredDirectories(directories.filter(dir => dir.toLowerCase().startsWith(lowerCasePath.split('/').slice(-1)[0])));
    setFilteredFiles(files.filter(file => file.toLowerCase().startsWith(lowerCasePath.split('/').slice(-1)[0])));
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const keepFocus = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div 
      style={{ width: "90%", maxWidth: "600px", padding: "16px", border: "1px solid #ccc", borderRadius: "8px" }} 
      onClick={keepFocus} 
    >
      <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
        <button onClick={handleGoBack} disabled={currentPath === '/'}>⬅</button>
        <input 
          ref={inputRef} 
          type="text" 
          value={currentPath} 
          onChange={handlePathChange} 
          onBlur={keepFocus} 
          style={{ flexGrow: 1 }} 
        />
      </div>
      <ul style={{ maxHeight: "300px", overflowY: "auto", border: "1px solid #ddd", padding: "8px", borderRadius: "4px" }}>
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
    </div>
  );
};

export default FileBrowser;
