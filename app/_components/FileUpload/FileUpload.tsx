import React, { useState, useRef } from "react";

type FileUploadProps = {
  id: string;
  fieldName: string;
  limit?: number;
  supportedFileTypes: string;
  uponFileChange: (files: File[]) => void; // Now consistently handles an array of URLs/strings
  isMultiple: boolean;
};

export const FileUpload = ({
  id,
  fieldName,
  limit = 1, // Default limit to avoid undefined errors
  supportedFileTypes,
  uponFileChange,
  isMultiple,
}: FileUploadProps) => {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    processFiles(files);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    processFiles(files);
  };

  const processFiles = (files: File[]) => {
    const validFiles = files.filter((file) => file.size < 10090000);

    if (validFiles.length !== files.length) {
      alert("Some files exceeded the 10MB limit and were not added.");
      return;
    }

    if (uploadedFiles.length + validFiles.length > limit) {
      alert(`You can only upload up to ${limit} files.`);
      return;
    }

    const newFileURLs = validFiles.map((file) => URL.createObjectURL(file));
    const updatedFiles = [...uploadedFiles, ...newFileURLs];

    setUploadedFiles(updatedFiles);
    uponFileChange(files); // Pass the updated array of file URLs to the parent
  };

  const handleRemoveFile = (index: number) => {
    const updatedFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(updatedFiles);
    //uponFileChange({});
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  return (
    <div className="col-span-6 py-3 w-full">
      <label
        htmlFor={fieldName}
        className="block text-sm font-medium text-gray-700"
      >
        {fieldName}
      </label>

      <div className="my-2">
        {uploadedFiles.length == 0 ? (
          <div
            className={`flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pt-5 pb-6 ${
              isDragOver ? "bg-gray-100" : ""
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="text-center space-y-1">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="text-sm text-gray-600">
                <label
                  htmlFor={id}
                  className="relative cursor-pointer bg-white font-medium text-indigo-600 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:text-indigo-500"
                >
                  <span>Upload a file</span>
                  <input
                    id={id}
                    name={id}
                    type="file"
                    accept={supportedFileTypes}
                    multiple={isMultiple}
                    className="sr-only"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                </label>
                <p> or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">
                {supportedFileTypes} up to 10MB
              </p>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap gap-4 mt-5 justify-center">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="relative w-32 h-32">
                  <img
                    src={file}
                    alt={`Uploaded file ${index + 1}`}
                    className="w-full h-full object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="btn absolute top-0 right-0 bg-red-600 text-white rounded-full p-1 w-[20px] h-[20px] flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
