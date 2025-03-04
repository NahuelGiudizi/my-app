import { useState, useEffect } from 'react';

interface ImageUploadProps {
  onImageUpload: (file: File, previewUrl: string) => void;
  currentImageUrl?: string | null;
}

export default function ImageUpload({ onImageUpload, currentImageUrl }: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Establecer la imagen actual como previsualización al cargar el componente
  useEffect(() => {
    console.log("ImageUpload - currentImageUrl:", currentImageUrl);
    if (currentImageUrl) {
      setPreviewUrl(currentImageUrl);
    }
  }, [currentImageUrl]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    // Validar tipo de archivo
    if (!file.type.match('image.*')) {
      alert('Por favor selecciona una imagen');
      return;
    }

    // Crear URL para previsualización
    const fileUrl = URL.createObjectURL(file);
    setPreviewUrl(fileUrl);
    onImageUpload(file, fileUrl);
  };

  return (
    <div 
      className={`relative border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-colors cursor-pointer
        ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 hover:border-gray-500'}
        ${previewUrl ? 'h-64' : 'h-48'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById('file-upload')?.click()}
    >
      <input
        type="file"
        id="file-upload"
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
      
      {previewUrl ? (
        // Mostrar previsualización de la imagen
        <div className="w-full h-full relative">
          <img 
            src={previewUrl} 
            alt="Preview" 
            className="w-full h-full object-contain rounded"
          />
          <button
            type="button"
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewUrl(null);
              onImageUpload(null as any, '');
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      ) : (
        // Interfaz para arrastrar y soltar
        <>
          <div className="mb-3 w-12 h-12 text-gray-400">
            {isDragging ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-1">Arrastra y suelta una imagen</p>
            <p className="text-xs text-gray-500">o haz clic para seleccionar un archivo</p>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG o WEBP (Máx. 2MB)</p>
          </div>
        </>
      )}
    </div>
  );
}