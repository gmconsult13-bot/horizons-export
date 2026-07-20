import React, { useCallback, useState } from 'react';
import { UploadCloud, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ImageUpload({ value, onChange, multiple = false, previewUrl }) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onChange(multiple ? Array.from(e.dataTransfer.files) : e.dataTransfer.files[0]);
    }
  }, [onChange, multiple]);

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onChange(multiple ? Array.from(e.target.files) : e.target.files[0]);
    }
  };

  const clearSelection = () => {
    onChange(multiple ? [] : null);
  };

  const getPreview = () => {
    if (multiple && Array.isArray(value) && value.length > 0) {
      return (
        <div className="text-sm text-primary font-medium">{value.length} files selected</div>
      );
    }
    if (!multiple && value instanceof File) {
      return <img src={URL.createObjectURL(value)} alt="Preview" className="h-32 object-cover rounded-md" />;
    }
    if (previewUrl) {
      return <img src={previewUrl} alt="Current" className="h-32 object-cover rounded-md" />;
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div 
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragActive ? 'border-primary bg-primary/5' : 'border-border bg-muted/20'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <UploadCloud className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
        <p className="text-sm text-foreground/80 mb-2">Drag and drop your image{multiple ? 's' : ''} here, or click to browse</p>
        <p className="text-xs text-muted-foreground mb-4">Supports JPG, PNG, WEBP (Max 20MB)</p>
        <input
          type="file"
          id="file-upload"
          className="hidden"
          multiple={multiple}
          accept="image/*"
          onChange={handleChange}
        />
        <Button type="button" variant="outline" onClick={() => document.getElementById('file-upload').click()}>
          Select File{multiple ? 's' : ''}
        </Button>
      </div>

      {(value || previewUrl) && (
        <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-lg border border-border relative">
          {getPreview()}
          <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={clearSelection}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}