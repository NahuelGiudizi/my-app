"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import Link from "next/link";
import SuperAdminLayout from "@/components/SuperAdminLayout";

interface Barberia {
  id: number;
  nombre: string;
  logo?: string | null;
  cantidadSucursales: number;
  cantidadBarberos: number;
  cantidadTurnos: number;
  activa: boolean;
  destacada: boolean;
}

interface EstadisticasGenerales {
  totalBarberias: number;
  totalSucursales: number;
  totalBarberos: number;
  totalClientes: number;
  turnosHoy: number;
  ingresosTotales: number;
}

export default function SuperAdminDashboard() {
  const [barberias, setBarberias] = useState<Barberia[]>([]);
  const [estadisticas, setEstadisticas] =
    useState<EstadisticasGenerales | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroActivas, setFiltroActivas] = useState<boolean | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    const fetchDatosIniciales = async () => {
      try {
        setLoading(true);
        setError(null);

        // En una implementación real, estas serían llamadas a API reales
        // const responseBarberias = await fetch('/api/admin/super/barberias');
        // const responseStats = await fetch('/api/admin/super/estadisticas');

        // Simulamos datos para el ejemplo
        const mockBarberias: Barberia[] = [
          {
            id: 1,
            nombre: "Barbería System",
            logo: null,
            cantidadSucursales: 5,
            cantidadBarberos: 20,
            cantidadTurnos: 150,
            activa: true,
            destacada: true,
          },
          {
            id: 2,
            nombre: "Elite Barbers",
            logo: null,
            cantidadSucursales: 3,
            cantidadBarberos: 12,
            cantidadTurnos: 85,
            activa: true,
            destacada: true,
          },
          {
            id: 3,
            nombre: "Classic Barber",
            logo: null,
            cantidadSucursales: 7,
            cantidadBarberos: 30,
            cantidadTurnos: 210,
            activa: true,
            destacada: false,
          },
          {
            id: 4,
            nombre: "UrbanCut",
            logo: null,
            cantidadSucursales: 2,
            cantidadBarberos: 8,
            cantidadTurnos: 45,
            activa: false,
            destacada: false,
          },
          {
            id: 5,
            nombre: "Gentleman's Club",
            logo: null,
            cantidadSucursales: 1,
            cantidadBarberos: 5,
            cantidadTurnos: 30,
            activa: true,
            destacada: false,
          },
        ];

        const mockEstadisticas: EstadisticasGenerales = {
          totalBarberias: 5,
          totalSucursales: 18,
          totalBarberos: 75,
          totalClientes: 2500,
          turnosHoy: 120,
          ingresosTotales: 1500000,
        };

        setBarberias(mockBarberias);
        setEstadisticas(mockEstadisticas);
      } catch (err) {
        console.error("Error cargando datos:", err);
        setError("Error al cargar los datos del dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDatosIniciales();
  }, []);

  // Filtrar barberías según el estado activo/inactivo
  const barberiasFiltradas =
    filtroActivas !== null
      ? barberias.filter((barberia) => barberia.activa === filtroActivas)
      : barberias;

  // Formatear números y moneda
  const formatNumber = (num: number) => new Intl.NumberFormat().format(num);
  const formatCurrency = (num: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(num);

  // Botones de acciones rápidas para el header
  const headerActions = (
    <div className="flex items-center gap-2">
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
    </div>
  );

  if (loading) {
    return (
      <SuperAdminLayout title="Cargando..." currentPage="dashboard">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout
      title="Dashboard Super Admin"
      currentPage="dashboard"
      actions={headerActions}
    >
      {error && (
        <div className="bg-red-900/20 backdrop-blur-sm border border-red-600/30 text-red-400 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Tarjetas de Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 rounded-lg p-6 border border-blue-800/30">
            <h3 className="text-gray-400 text-sm mb-1">Total Barberías</h3>
            <p className="text-3xl font-bold text-white">
              {estadisticas.totalBarberias}
            </p>
            <p className="mt-2 text-gray-400 text-xs">
              Activas: {barberias.filter((b) => b.activa).length}
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 rounded-lg p-6 border border-green-800/30">
            <h3 className="text-gray-400 text-sm mb-1">Total Sucursales</h3>
            <p className="text-3xl font-bold text-white">
              {estadisticas.totalSucursales}
            </p>
            <p className="mt-2 text-gray-400 text-xs">
              Promedio:{" "}
              {(
                estadisticas.totalSucursales /
                Math.max(1, estadisticas.totalBarberias)
              ).toFixed(1)}{" "}
              por barbería
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 rounded-lg p-6 border border-purple-800/30">
            <h3 className="text-gray-400 text-sm mb-1">Total Barberos</h3>
            <p className="text-3xl font-bold text-white">
              {estadisticas.totalBarberos}
            </p>
            <p className="mt-2 text-gray-400 text-xs">
              Turnos hoy: {estadisticas.turnosHoy}
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-900/30 to-orange-800/20 rounded-lg p-6 border border-orange-800/30">
            <h3 className="text-gray-400 text-sm mb-1">Ingresos Totales</h3>
            <p className="text-3xl font-bold text-white">
              {formatCurrency(estadisticas.ingresosTotales)}
            </p>
            <p className="mt-2 text-gray-400 text-xs">
              Clientes: {formatNumber(estadisticas.totalClientes)}
            </p>
          </div>
        </div>
      )}

      {/* Filtros para barberías */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 mb-6 flex flex-wrap gap-3 items-center">
        <p className="text-white font-medium">Filtrar:</p>
        <button
          onClick={() => setFiltroActivas(null)}
          className={`px-3 py-1 rounded-md text-sm transition-colors ${
            filtroActivas === null
              ? "bg-blue-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => setFiltroActivas(true)}
          className={`px-3 py-1 rounded-md text-sm transition-colors ${
            filtroActivas === true
              ? "bg-green-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          Activas
        </button>
        <button
          onClick={() => setFiltroActivas(false)}
          className={`px-3 py-1 rounded-md text-sm transition-colors ${
            filtroActivas === false
              ? "bg-red-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          Inactivas
        </button>
      </div>

      {/* Lista de Barberías */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {barberiasFiltradas.map((barberia) => (
          <div
            key={barberia.id}
            className={`${
              barberia.activa ? "bg-gray-800/50" : "bg-gray-800/20 opacity-75"
            } backdrop-blur-sm rounded-lg overflow-hidden border ${
              barberia.activa ? "border-gray-700/30" : "border-red-700/30"
            } hover:shadow-md transition-shadow`}
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-700 rounded-md flex items-center justify-center text-xl font-bold text-white mr-3">
                    {barberia.nombre.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center">
                      {barberia.nombre}
                      {barberia.destacada && (
                        <span className="ml-2 text-xs bg-yellow-500/30 text-yellow-300 px-2 py-0.5 rounded-full">
                          Destacada
                        </span>
                      )}
                    </h3>
                    <p className="text-gray-400 text-sm">ID: {barberia.id}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      barberia.activa
                        ? "bg-green-600/30 text-green-300"
                        : "bg-red-600/30 text-red-300"
                    }`}
                  >
                    {barberia.activa ? "Activa" : "Inactiva"}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-xs text-gray-400">Sucursales</p>
                  <p className="text-xl font-semibold text-white">
                    {barberia.cantidadSucursales}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Barberos</p>
                  <p className="text-xl font-semibold text-white">
                    {barberia.cantidadBarberos}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Turnos</p>
                  <p className="text-xl font-semibold text-white">
                    {barberia.cantidadTurnos}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-between gap-2">
                <Link
                  href={`/admin/super/barberias/${barberia.id}`}
                  className="flex-1 text-center text-sm px-3 py-2 bg-blue-600/30 hover:bg-blue-700/40 text-blue-300 rounded transition-colors"
                >
                  Ver Detalles
                </Link>
                <Link
                  href={`/admin/super/barberias/${barberia.id}/editar`}
                  className="flex-1 text-center text-sm px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                >
                  Editar
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mensaje si no hay barberías */}
      {barberiasFiltradas.length === 0 && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 text-center">
          <p className="text-gray-400">
            {filtroActivas !== null
              ? `No hay barberías ${filtroActivas ? "activas" : "inactivas"}`
              : "No hay barberías registradas"}
          </p>
        </div>
      )}
    </SuperAdminLayout>
  );
}
