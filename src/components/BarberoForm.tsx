//my-app\src\components\BarberoForm.tsx
'use client';

import { useState, useEffect } from 'react';
import ImageUpload from './ImageUpload';

interface BarberoFormProps {
  barberoId?: number;
  onSuccess?: () => void;
}

interface Barbero {
  id?: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  foto?: string;
  especialidad?: string;
  experiencia?: number;
  calificacion?: number;
  instagram?: string;
  biografia?: string;
}

export default function BarberoForm({ barberoId, onSuccess }: BarberoFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Barbero>({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    foto: '',
    especialidad: '',
    experiencia: 0,
    calificacion: 5.0,
    instagram: '',
    biografia: ''
  });

  // Cargar datos si estamos editando un barbero existente
  useEffect(() => {
    if (barberoId) {
      const fetchBarbero = async () => {
        try {
          setLoading(true);
          const res = await fetch(`/api/admin/barberos/${barberoId}`);
          
          if (!res.ok) {
            const errorText = await res.text();
            console.error("Error response:", errorText);
            throw new Error(`Error al cargar datos del barbero: ${res.status} - ${errorText}`);
          }
          
          const data = await res.json();
          console.log("Datos del barbero recibidos:", data); // Para depuración
          
          setFormData(data);
          
          // Verificar específicamente si hay una URL de foto
          if (data.foto) {
            console.log("URL de foto encontrada:", data.foto);
            setImagePreview(data.foto);
          } else {
            console.log("No se encontró URL de foto");
            setImagePreview(null);
          }
        } catch (err) {
          console.error('Error:', err);
          setError('No se pudo cargar la información del barbero');
        } finally {
          setLoading(false);
        }
      };

      fetchBarbero();
    }
  }, [barberoId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    // Convertir valores numéricos
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? '' : Number(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageUpload = (file: File, previewUrl: string) => {
    console.log("Imagen cargada:", { file, previewUrl });
    setImageFile(file);
    setImagePreview(previewUrl);
    // No actualizamos formData.foto aquí porque necesitamos subir la imagen primero
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Si hay una imagen nueva, subirla primero
      let fotoUrl = formData.foto;
      
      if (imageFile) {
        // Crear un FormData para la subida de la imagen
        const imageFormData = new FormData();
        imageFormData.append('file', imageFile);
        
        try {
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: imageFormData
          });
          
          if (!uploadRes.ok) {
            // Try to get JSON error if available
            let errorMessage = 'Error al subir la imagen';
            try {
              const errorData = await uploadRes.json();
              errorMessage = errorData.error || errorMessage;
            } catch (_) {
              // If not JSON, try to get text
              errorMessage = await uploadRes.text();
            }
            console.error("Error al subir imagen:", errorMessage);
            throw new Error(errorMessage);
          }
          
          const uploadData = await uploadRes.json();
          console.log("Respuesta de subida de imagen:", uploadData);
          
          // Make sure the URL is correctly set
          fotoUrl = uploadData.url;
          console.log("URL de foto actualizada:", fotoUrl);
        } catch (error) {
          console.error("Error de subida:", error);
          throw new Error('Error al subir la imagen: ' + error.message);
        }
      }
      
      // 2. Enviar los datos del barbero con la URL de la imagen
      const barberoData = {
        ...formData,
        foto: fotoUrl, // Usar la URL de la imagen actualizada o la existente
        instagram: formData.instagram || null,
        biografia: formData.biografia || null,
        experiencia: formData.experiencia ? Number(formData.experiencia) : null,
        calificacion: formData.calificacion ? Number(formData.calificacion) : null
      };
      
      const url = barberoId 
        ? `/api/admin/barberos/${barberoId}` 
        : '/api/admin/barberos';
      
      const method = barberoId ? 'PUT' : 'POST';
      
      // Luego, al enviar los datos:
      console.log("Datos a enviar:", barberoData);
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(barberoData)
      });
      
      // Comprobar si la respuesta es válida
      if (!res.ok) {
        const errorText = await res.text(); // Obtener texto en lugar de JSON para ver qué está mal
        console.error("Error response:", errorText);
        throw new Error(`Error HTTP: ${res.status} - ${errorText}`);
      }
      
      const result = await res.json();
      console.log("Respuesta exitosa:", result);
      
      // Éxito
      if (onSuccess) onSuccess();
      
      // Si no hay callback de éxito, redirigir
      if (!onSuccess) {
        window.location.href = '/admin/barberos';
      }
      
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !formData.nombre) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
      <h2 className="text-xl font-bold text-white mb-6 pb-2 border-b border-gray-700">
        {barberoId ? 'Editar Barbero' : 'Crear Nuevo Barbero'}
      </h2>
      
      {error && (
        <div className="bg-red-900/30 border border-red-500 text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Columna izquierda */}
        <div className="space-y-6">
          {/* Nombre */}
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-300 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Apellido */}
          <div>
            <label htmlFor="apellido" className="block text-sm font-medium text-gray-300 mb-1">
              Apellido *
            </label>
            <input
              type="text"
              id="apellido"
              name="apellido"
              value={formData.apellido}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Teléfono */}
          <div>
            <label htmlFor="telefono" className="block text-sm font-medium text-gray-300 mb-1">
              Teléfono
            </label>
            <input
              type="text"
              id="telefono"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Especialidad */}
          <div>
            <label htmlFor="especialidad" className="block text-sm font-medium text-gray-300 mb-1">
              Especialidad
            </label>
            <select
              id="especialidad"
              name="especialidad"
              value={formData.especialidad || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Seleccionar especialidad</option>
              <option value="Cortes clásicos">Cortes clásicos</option>
              <option value="Degradados">Degradados</option>
              <option value="Barba">Barba</option>
              <option value="Cortes modernos">Cortes modernos</option>
              <option value="Coloración">Coloración</option>
            </select>
          </div>
          
          {/* Experiencia */}
          <div>
            <label htmlFor="experiencia" className="block text-sm font-medium text-gray-300 mb-1">
              Años de experiencia
            </label>
            <input
              type="number"
              id="experiencia"
              name="experiencia"
              min="0"
              max="50"
              value={formData.experiencia || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        {/* Columna derecha */}
        <div className="space-y-6">
          {/* Foto */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Foto del barbero
            </label>
            <ImageUpload 
              onImageUpload={handleImageUpload}
              currentImageUrl={formData.foto}
            />
          </div>
          
          {/* Instagram */}
          <div>
            <label htmlFor="instagram" className="block text-sm font-medium text-gray-300 mb-1">
              Instagram
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-400">@</span>
              <input
                type="text"
                id="instagram"
                name="instagram"
                value={(formData.instagram || '').replace('@', '')}
                onChange={(e) => {
                  const value = e.target.value.startsWith('@') 
                    ? e.target.value 
                    : `@${e.target.value}`;
                  setFormData(prev => ({ ...prev, instagram: value }));
                }}
                className="w-full px-3 py-2 pl-8 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          {/* Calificación */}
          <div>
            <label htmlFor="calificacion" className="block text-sm font-medium text-gray-300 mb-1">
              Calificación (1-5)
            </label>
            <input
              type="number"
              id="calificacion"
              name="calificacion"
              min="1"
              max="5"
              step="0.1"
              value={formData.calificacion || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Biografía */}
          <div>
            <label htmlFor="biografia" className="block text-sm font-medium text-gray-300 mb-1">
              Biografía
            </label>
            <textarea
              id="biografia"
              name="biografia"
              rows={4}
              value={formData.biografia || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Escribe una breve biografía del barbero..."
            />
          </div>
        </div>
      </div>
      
      {/* Botones */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center"
        >
          {loading && (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {barberoId ? 'Actualizar Barbero' : 'Crear Barbero'}
        </button>
      </div>
    </form>
  );
}