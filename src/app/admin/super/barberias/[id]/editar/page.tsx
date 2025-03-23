// src/app/admin/super/barberias/[id]/editar/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SuperAdminLayout from "@/components/SuperAdminLayout";
import ImageUpload from "@/components/ImageUpload";

interface PageProps {
  params: {
    id: string;
  };
}

export default function EditarBarberiaPage({ params }: PageProps) {
  const barberiaId = parseInt(params.id);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    nombre: "",
    sitioWeb: "",
    email: "",
    telefono: "",
    descripcion: "",
    destacada: false,
    activa: true,
    logo: "",
  });

  // Cargar datos de la barbería
  useEffect(() => {
    const fetchBarberia = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/barberias/${barberiaId}`);

        if (!response.ok) {
          throw new Error("Error al cargar datos de la barbería");
        }

        const data = await response.json();
        setFormData({
          nombre: data.nombre || "",
          sitioWeb: data.sitioWeb || "",
          email: data.email || "",
          telefono: data.telefono || "",
          descripcion: data.descripcion || "",
          destacada: data.destacada || false,
          activa: data.activa !== undefined ? data.activa : true,
          logo: data.logo || "",
        });
      } catch (error) {
        console.error("Error:", error);
        setError("Error al cargar datos de la barbería");
      } finally {
        setLoading(false);
      }
    };

    if (barberiaId) {
      fetchBarberia();
    }
  }, [barberiaId]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleImageUpload = (file: File, previewUrl: string) => {
    setImageFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // 1. Si hay una imagen nueva, subirla primero
      let logoUrl = formData.logo;

      if (imageFile) {
        const imageFormData = new FormData();
        imageFormData.append("file", imageFile);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: imageFormData,
        });

        if (!uploadRes.ok) {
          const errorData = await uploadRes.json();
          throw new Error(errorData.error || "Error al subir la imagen");
        }

        const uploadData = await uploadRes.json();
        logoUrl = uploadData.url;
      }

      // 2. Actualizar datos de la barbería
      const res = await fetch(`/api/admin/barberias/${barberiaId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          logo: logoUrl,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al actualizar la barbería");
      }

      // Redireccionar a la lista de barberías
      router.push("/admin/super/barberias");
    } catch (err) {
      console.error("Error:", err);
      setError(
        err instanceof Error ? err.message : "Error al procesar la solicitud"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SuperAdminLayout title="Cargando..." currentPage="barberias">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout
      title={`Editar Barbería: ${formData.nombre}`}
      currentPage="barberias"
    >
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-gray-700/30">
        <h2 className="text-xl font-bold text-white mb-6 pb-2 border-b border-gray-700">
          Editar Barbería
        </h2>

        {error && (
          <div className="bg-red-900/30 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Columna izquierda */}
            <div className="space-y-6">
              {/* Nombre */}
              <div>
                // src/app/admin/super/barberias/[id]/editar/page.tsx
                (continuación)
                <label
                  htmlFor="nombre"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
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

              {/* Sitio Web */}
              <div>
                <label
                  htmlFor="sitioWeb"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Sitio Web
                </label>
                <input
                  type="url"
                  id="sitioWeb"
                  name="sitioWeb"
                  value={formData.sitioWeb}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://..."
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Teléfono */}
              <div>
                <label
                  htmlFor="telefono"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
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
            </div>

            {/* Columna derecha */}
            <div className="space-y-6">
              {/* Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Logo
                </label>
                <ImageUpload
                  onImageUpload={handleImageUpload}
                  currentImageUrl={formData.logo}
                />
              </div>

              {/* Descripción */}
              <div>
                <label
                  htmlFor="descripcion"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Descripción
                </label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  rows={4}
                  value={formData.descripcion}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Opciones */}
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="destacada"
                    name="destacada"
                    checked={formData.destacada}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="destacada"
                    className="ml-2 block text-sm text-gray-300"
                  >
                    Destacada
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="activa"
                    name="activa"
                    checked={formData.activa}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="activa"
                    className="ml-2 block text-sm text-gray-300"
                  >
                    Activa
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={() => router.push("/admin/super/barberias")}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center"
            >
              {saving && (
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              )}
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </SuperAdminLayout>
  );
}
