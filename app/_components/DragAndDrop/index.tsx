import React, { useRef, useState } from "react";
import styles from "./index.module.css";

interface DragDropProps {
  onFileDrop: (file: File) => void; // Function to handle the dropped or manually uploaded file
}

const DragDrop: React.FC<DragDropProps> = ({ onFileDrop }) => {
  const [file, setFile] = useState<File | null>(null); // To store the dropped/uploaded file
  const [isDragging, setIsDragging] = useState(false); // To track drag state
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for hidden input

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile); // Update the state with the dropped file
      onFileDrop(droppedFile); // Notify the parent component
    }
  };

  const handleClick = () => {
    // Trigger the hidden file input when the drop zone is clicked
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile); // Update the state with the selected file
      onFileDrop(selectedFile); // Notify the parent component
    }
  };

  const renderContent = () => {
    if (file) {
      return (
        <div className={styles.filePreview}>
          <p>File Uploaded: {file.name}</p>
        </div>
      );
    }

    return (
      <p>
        {isDragging
          ? "Release to drop the file"
          : "Drag & Drop your file here or click to upload"}
      </p>
    );
  };

  return (
    <div
      className={`${styles.dropZone} ${isDragging ? styles.dragging : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick} // Handle click to open file picker
    >
      {renderContent()}
      {/* Hidden input for manual file upload */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }} // Hide the input element
        onChange={handleFileSelect}
      />
    </div>
  );
};

export default DragDrop;
