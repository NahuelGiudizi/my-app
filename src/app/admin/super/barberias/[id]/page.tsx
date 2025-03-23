// src/app/admin/super/barberias/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SuperAdminLayout from "@/components/SuperAdminLayout";

interface PageProps {
  params: {
    id: string;
  };
}

interface Barberia {
  id: number;
  nombre: string;
  logo: string | null;
  sitioWeb: string | null;
  email: string | null;
  telefono: string | null;
  descripcion: string | null;
  destacada: boolean;
  activa: boolean;
  createdAt: string;
  updatedAt: string;
  sucursales: {
    id: number;
    nombre: string;
    direccion: string;
  }[];
  _count: {
    sucursales: number;
    adminsBarberia: number;
  };
}

export default function DetalleBarberiaPage({ params }: PageProps) {
  const barberiaId = parseInt(params.id);
  const router = useRouter();

  const [barberia, setBarberia] = useState<Barberia | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBarberia = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/barberias/${barberiaId}`);

        if (!response.ok) {
          throw new Error("Error al cargar datos de la barbería");
        }

        const data = await response.json();
        setBarberia(data);
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

  const headerActions = (
    <Link
      href={`/admin/super/barberias/${barberiaId}/editar`}
      className="bg-blue-600/30 hover:bg-blue-700/40 text-blue-300 py-2 px-4 rounded transition-colors flex items-center gap-2 whitespace-nowrap"
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
      <span>Editar Barbería</span>
    </Link>
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

  if (error || !barberia) {
    return (
      <SuperAdminLayout title="Error" currentPage="barberias">
        <div className="bg-red-900/20 backdrop-blur-sm border border-red-600/30 text-red-400 p-6 rounded-lg">
          {error || "No se pudo cargar la información de la barbería"}
        </div>
        <div className="mt-4">
          <button
            onClick={() => router.push("/admin/super/barberias")}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
          >
            Volver a la lista
          </button>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout
      title={`Barbería: ${barberia.nombre}`}
      currentPage="barberias"
      actions={headerActions}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información principal */}
        <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-gray-700/30">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-gray-700 rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden">
              {barberia.logo ? (
                <img
                  src={barberia.logo}
                  alt={barberia.nombre}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-white">
                  {barberia.nombre.charAt(0)}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center">
                {barberia.nombre}
                <span
                  className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                    barberia.activa
                      ? "bg-green-600/30 text-green-300"
                      : "bg-red-600/30 text-red-300"
                  }`}
                >
                  {barberia.activa ? "Activa" : "Inactiva"}
                </span>
                {barberia.destacada && (
                  <span className="ml-2 text-xs bg-yellow-500/30 text-yellow-300 px-2 py-0.5 rounded-full">
                    Destacada
                  </span>
                )}
              </h2>
              <p className="text-gray-400 mt-1">
                Creada el {new Date(barberia.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Detalles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm text-gray-400 mb-1">Contacto</h3>
                <div className="space-y-2">
                  {barberia.email && (
                    <p className="flex items-center text-white">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-2 text-blue-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      {barberia.email}
                    </p>
                  )}
                  {barberia.telefono && (
                    <p className="flex items-center text-white">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-2 text-blue-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      {barberia.telefono}
                    </p>
                  )}
                  {barberia.sitioWeb && (
                    <p className="flex items-center text-white">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-2 text-blue-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9"
                        />
                      </svg>
                      <a
                        href={barberia.sitioWeb}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        {barberia.sitioWeb}
                      </a>
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm text-gray-400 mb-1">Estadísticas</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-700/30 p-3 rounded-lg">
                    <p className="text-gray-400 text-xs">Sucursales</p>
                    <p className="text-white text-xl font-bold">
                      {barberia._count.sucursales}
                    </p>
                  </div>
                  <div className="bg-gray-700/30 p-3 rounded-lg">
                    <p className="text-gray-400 text-xs">Administradores</p>
                    <p className="text-white text-xl font-bold">
                      {barberia._count.adminsBarberia}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Descripción */}
            <div>
              <h3 className="text-sm text-gray-400 mb-1">Descripción</h3>
              <div className="bg-gray-700/30 p-4 rounded-lg min-h-[150px]">
                {barberia.descripcion ? (
                  <p className="text-white">{barberia.descripcion}</p>
                ) : (
                  <p className="text-gray-500 italic">Sin descripción</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Acciones y Enlaces Rápidos */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-gray-700/30 space-y-6">
          <h3 className="text-lg font-medium text-white border-b border-gray-700 pb-2">
            Acciones
          </h3>

          <div className="space-y-3">
            <Link
              href={`/admin/super/barberias/${barberiaId}/sucursales`}
              className="block w-full text-center py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors"
            >
              Gestionar Sucursales
            </Link>

            <Link
              href={`/admin/super/barberias/${barberiaId}/usuarios`}
              className="block w-full text-center py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-lg transition-colors"
            >
              Gestionar Administradores
            </Link>

            <Link
              href={`/admin/super/barberias/${barberiaId}/editar`}
              className="block w-full text-center py-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 rounded-lg transition-colors"
            >
              Editar Barbería
            </Link>

            <button
              onClick={() => {
                if (
                  confirm(
                    `¿Estás seguro de cambiar el estado de ${
                      barberia.nombre
                    } a ${barberia.activa ? "inactiva" : "activa"}?`
                  )
                ) {
                  fetch(`/api/admin/barberias/${barberiaId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ activa: !barberia.activa }),
                  }).then((res) => {
                    if (res.ok) {
                      setBarberia((prev) =>
                        prev ? { ...prev, activa: !prev.activa } : null
                      );
                    }
                  });
                }
              }}
              className={`block w-full text-center py-2 ${
                barberia.activa
                  ? "bg-red-600/20 hover:bg-red-600/30 text-red-400"
                  : "bg-green-600/20 hover:bg-green-600/30 text-green-400"
              } rounded-lg transition-colors`}
            >
              {barberia.activa ? "Desactivar Barbería" : "Activar Barbería"}
            </button>
          </div>
        </div>
      </div>

      {/* Listado de Sucursales */}
      <div className="mt-8 bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-gray-700/30">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-white">Sucursales</h3>
          <Link
            href={`/admin/super/barberias/${barberiaId}/sucursales/nueva`}
            className="bg-blue-600/30 hover:bg-blue-700/40 text-blue-300 py-1 px-3 rounded text-sm transition-colors"
          >
            Añadir Sucursal
          </Link>
        </div>

        {barberia.sucursales.length === 0 ? (
          <div className="bg-gray-700/30 p-4 rounded-lg text-center">
            <p className="text-gray-400">
              Esta barbería no tiene sucursales registradas.
            </p>
            <Link
              href={`/admin/super/barberias/${barberiaId}/sucursales/nueva`}
              className="text-blue-400 hover:text-blue-300 mt-2 inline-block"
            >
              Añadir la primera sucursal
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {barberia.sucursales.map((sucursal) => (
              <div
                key={sucursal.id}
                className="bg-gray-700/30 p-4 rounded-lg hover:bg-gray-700/40 transition-colors"
              >
                <h4 className="font-medium text-white mb-2">
                  {sucursal.nombre}
                </h4>
                <p className="text-gray-400 text-sm mb-3">
                  {sucursal.direccion}
                </p>
                <Link
                  href={`/admin/super/barberias/${barberiaId}/sucursales/${sucursal.id}`}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  Ver detalles →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
}
