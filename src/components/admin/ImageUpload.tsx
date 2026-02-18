"use client";

import { useCallback, useState } from "react";
import { FiUpload, FiX } from "react-icons/fi";

interface ImageUploadProps {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
}

export function ImageUpload({
  files,
  onChange,
  maxFiles = 5,
}: ImageUploadProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    (newFiles: FileList | null) => {
      if (!newFiles) return;
      const accepted = Array.from(newFiles)
        .filter((f) => f.type.startsWith("image/"))
        .slice(0, maxFiles - files.length);
      if (accepted.length > 0) {
        onChange([...files, ...accepted]);
      }
    },
    [files, maxFiles, onChange]
  );

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition ${
          dragOver
            ? "border-stone-900 bg-stone-100"
            : "border-stone-300 bg-stone-50 hover:border-stone-400"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/*";
          input.multiple = true;
          input.onchange = () => handleFiles(input.files);
          input.click();
        }}
      >
        <FiUpload className="mb-2 text-2xl text-stone-400" />
        <p className="text-sm text-stone-500">
          Şəkilləri buraya sürükləyin və ya klikləyin
        </p>
        <p className="text-xs text-stone-400">
          Maksimum {maxFiles} şəkil (JPG, PNG)
        </p>
      </div>

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div key={index} className="group relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="h-20 w-20 rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition group-hover:opacity-100"
              >
                <FiX className="text-xs" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
