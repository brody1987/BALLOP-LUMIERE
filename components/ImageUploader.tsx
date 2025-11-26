import React, { useCallback } from 'react';
import { ImageFile } from '../types';

interface ImageUploaderProps {
  label: string;
  subLabel?: string;
  images: ImageFile[];
  onImagesChange: (images: ImageFile[]) => void;
  multiple?: boolean;
  maxFiles?: number;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  label, 
  subLabel, 
  images, 
  onImagesChange, 
  multiple = false,
  maxFiles = 1
}) => {

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: File[] = Array.from(e.target.files);
      
      const processedFiles: ImageFile[] = await Promise.all(newFiles.map(async (file: File) => {
        return new Promise<ImageFile>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              id: Math.random().toString(36).substr(2, 9),
              file,
              previewUrl: URL.createObjectURL(file),
              base64: reader.result as string
            });
          };
          reader.readAsDataURL(file);
        });
      }));

      if (multiple) {
        const combined = [...images, ...processedFiles];
        // Enforce max files if multiple
        onImagesChange(combined.slice(0, maxFiles));
      } else {
        onImagesChange([processedFiles[0]]);
      }
    }
  }, [images, multiple, maxFiles, onImagesChange]);

  const removeImage = (idToRemove: string) => {
    onImagesChange(images.filter(img => img.id !== idToRemove));
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex justify-between items-baseline">
        <label className="text-brand-cream font-serif text-xl">{label}</label>
        {subLabel && <span className="text-brand-gray text-sm font-sans">{subLabel}</span>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {images.map((img) => (
          <div key={img.id} className="relative group aspect-[3/4] bg-neutral-900 border border-neutral-800">
            <img 
              src={img.previewUrl} 
              alt="Preview" 
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
            />
            <button 
              onClick={() => removeImage(img.id)}
              className="absolute top-1 right-1 bg-black/50 hover:bg-red-900 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center text-xs transition-colors"
            >
              ×
            </button>
          </div>
        ))}

        {(multiple ? images.length < (maxFiles || 5) : images.length === 0) && (
           <label className="flex flex-col items-center justify-center aspect-[3/4] border border-dashed border-neutral-700 hover:border-brand-gold transition-colors cursor-pointer bg-neutral-900/50 hover:bg-neutral-800">
            <input 
              type="file" 
              className="hidden" 
              accept="image/*" 
              multiple={multiple}
              onChange={handleFileChange}
            />
            <span className="text-4xl text-neutral-600 mb-2">+</span>
            <span className="text-xs text-neutral-500 font-sans uppercase tracking-widest">Upload</span>
          </label>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;