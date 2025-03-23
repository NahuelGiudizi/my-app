// src/app/admin/super/barberias/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SuperAdminLayout from "@/components/SuperAdminLayout";
import Link from "next/link";

interface Barberia {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  logo?: string;
  sitioWeb?: string;
  destacada: boolean;
  activa: boolean;
  _count: {
    sucursales: number;
    adminsBarberia: number;
  };
}

export default function BarberiasPage() {
  const router = useRouter();
  const [barberias, setBarberias] = useState<Barberia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterActive, setFilterActive] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchBarberias = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/admin/barberias");

        if (!response.ok) {
          throw new Error("Error al cargar barberías");
        }

        const data = await response.json();
        setBarberias(data);
      } catch (error) {
        console.error("Error:", error);
        setError("Error al cargar los datos");
      } finally {
        setLoading(false);
      }
    };

    fetchBarberias();
  }, []);

  // Filtrar barberías
  const filteredBarberias = barberias.filter((barberia) => {
    const matchesQuery =
      searchQuery === "" ||
      barberia.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (barberia.email &&
        barberia.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesActive =
      filterActive === null || barberia.activa === filterActive;

    return matchesQuery && matchesActive;
  });

  const handleDelete = async (id: number, nombre: string) => {
    if (!confirm(`¿Está seguro que desea eliminar la barbería "${nombre}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/barberias/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al eliminar barbería");
      }

      setBarberias(barberias.filter((b) => b.id !== id));
    } catch (error) {
      console.error("Error:", error);
      alert(
        error instanceof Error ? error.message : "Error al eliminar barbería"
      );
    }
  };

  const toggleActive = async (id: number, currentActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/barberias/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ activa: !currentActive }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar barbería");
      }

      setBarberias(
        barberias.map((b) =>
          b.id === id ? { ...b, activa: !currentActive } : b
        )
      );
    } catch (error) {
      console.error("Error:", error);
      alert(
        error instanceof Error ? error.message : "Error al actualizar barbería"
      );
    }
  };

  const toggleDestacada = async (id: number, currentDestacada: boolean) => {
    try {
      const response = await fetch(`/api/admin/barberias/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ destacada: !currentDestacada }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar barbería");
      }

      setBarberias(
        barberias.map((b) =>
          b.id === id ? { ...b, destacada: !currentDestacada } : b
        )
      );
    } catch (error) {
      console.error("Error:", error);
      alert(
        error instanceof Error ? error.message : "Error al actualizar barbería"
      );
    }
  };

  // Barra de búsqueda y botón de nueva barbería
  const headerActions = (
    <>
      <div className="relative flex-grow max-w-md">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            ></path>
          </svg>
        </div>
        <input
          type="search"
          className="block w-full p-2 pl-10 text-sm bg-gray-800 border border-gray-600 placeholder-gray-400 text-white rounded-lg focus:ring-blue-500 focus:border-blue-500"
          placeholder="Buscar barbería..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            onClick={() => setSearchQuery("")}
          >
            <svg
              className="w-4 h-4 text-gray-400 hover:text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        )}
      </div>

      <Link
        href="/admin/super/barberias/nueva"
        className="bg-blue-600/30 hover:bg-blue-700/40 text-blue-300 py-2 px-4 rounded transition-colors flex items-center gap-2 whitespace-nowrap"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
            clipRule="evenodd"
          />
        </svg>
        <span>Nueva Barbería</span>
      </Link>
    </>
  );

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
      title="Gestión de Barberías"
      currentPage="barberias"
      actions={headerActions}
    >
      {/* Filtros */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilterActive(null)}
          className={`px-3 py-1 rounded-md ${
            filterActive === null
              ? "bg-blue-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => setFilterActive(true)}
          className={`px-3 py-1 rounded-md ${
            filterActive === true
              ? "bg-green-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          Activas
        </button>
        <button
          onClick={() => setFilterActive(false)}
          className={`px-3 py-1 rounded-md ${
            filterActive === false
              ? "bg-red-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          Inactivas
        </button>
      </div>

      {error && (
        <div className="bg-red-900/20 backdrop-blur-sm border border-red-600/30 text-red-400 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Mensaje de no resultados */}
      {filteredBarberias.length === 0 && !loading && !error && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 text-center border border-gray-700/30">
          <p className="text-gray-400">
            {searchQuery
              ? `No se encontraron barberías que coincidan con "${searchQuery}"`
              : filterActive !== null
              ? `No hay barberías ${filterActive ? "activas" : "inactivas"}`
              : "No hay barberías registradas"}
          </p>
        </div>
      )}

      {/* Lista de Barberías */}
      {filteredBarberias.length > 0 && (
        <div className="overflow-x-auto bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/30">
          <table className="w-full text-left text-gray-300">
            <thead className="text-xs uppercase bg-gray-700/30 text-gray-300">
              <tr>
                <th className="px-6 py-3">Barbería</th>
                <th className="px-6 py-3">Contacto</th>
                <th className="px-6 py-3">Sucursales</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredBarberias.map((barberia) => (
                <tr
                  key={barberia.id}
                  className="border-b border-gray-700 bg-gray-800/10 hover:bg-gray-700/20"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-700 rounded-md flex items-center justify-center text-xl font-bold text-white mr-3">
                        {barberia.nombre.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {barberia.nombre}
                          {barberia.destacada && (
                            <span className="ml-2 text-xs bg-yellow-500/30 text-yellow-300 px-2 py-0.5 rounded-full">
                              Destacada
                            </span>
                          )}
                        </p>
                        {barberia.sitioWeb && (
                          <p className="text-xs text-blue-400">
                            <a
                              href={barberia.sitioWeb}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {barberia.sitioWeb}
                            </a>
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {barberia.email && (
                      <p className="text-sm">{barberia.email}</p>
                    )}
                    {barberia.telefono && (
                      <p className="text-sm">{barberia.telefono}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <span className="text-lg font-medium">
                        {barberia._count.sucursales}
                      </span>
                      <span className="ml-2 text-xs text-gray-400">
                        {barberia._count.adminsBarberia} admin
                        {barberia._count.adminsBarberia !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs ${
                        barberia.activa
                          ? "bg-green-600/30 text-green-300"
                          : "bg-red-600/30 text-red-300"
                      }`}
                    >
                      {barberia.activa ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() =>
                          toggleDestacada(barberia.id, barberia.destacada)
                        }
                        className={`p-1 ${
                          barberia.destacada
                            ? "text-yellow-400 hover:text-yellow-300"
                            : "text-gray-400 hover:text-gray-300"
                        }`}
                        title={
                          barberia.destacada
                            ? "Quitar destacada"
                            : "Marcar como destacada"
                        }
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                      <button
                        onClick={() =>
                          toggleActive(barberia.id, barberia.activa)
                        }
                        className={`p-1 ${
                          barberia.activa
                            ? "text-green-400 hover:text-green-300"
                            : "text-red-400 hover:text-red-300"
                        }`}
                        title={barberia.activa ? "Desactivar" : "Activar"}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d={
                              barberia.activa
                                ? "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                                : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            }
                          />
                        </svg>
                      </button>
                      <Link
                        href={`/admin/super/barberias/${barberia.id}`}
                        className="p-1 text-blue-400 hover:text-blue-300"
                        title="Ver detalles"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </Link>
                      <Link
                        href={`/admin/super/barberias/${barberia.id}/editar`}
                        className="p-1 text-yellow-400 hover:text-yellow-300"
                        title="Editar"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </Link>
                      {barberia._count.sucursales === 0 &&
                        barberia._count.adminsBarberia === 0 && (
                          <button
                            onClick={() =>
                              handleDelete(barberia.id, barberia.nombre)
                            }
                            className="p-1 text-red-400 hover:text-red-300"
                            title="Eliminar"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Vista móvil para agregar barberías */}
      <div className="md:hidden fixed bottom-4 right-4 z-10">
        <Link
          href="/admin/super/barberias/nueva"
          className="bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
        </Link>
      </div>
    </SuperAdminLayout>
  );
}
