// src/components/LocationSelector.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Pais {
  id: number;
  nombre: string;
  codigo: string;
}

interface Provincia {
  id: number;
  nombre: string;
  paisId: number;
}

interface Ciudad {
  id: number;
  nombre: string;
  provinciaId: number;
}

export default function LocationSelector() {
  const router = useRouter();
  const [paises, setPaises] = useState<Pais[]>([]);
  const [provincias, setProvincias] = useState<Provincia[]>([]);
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [paisId, setPaisId] = useState<number | null>(null);
  const [provinciaId, setProvinciaId] = useState<number | null>(null);
  const [ciudadId, setCiudadId] = useState<number | null>(null);
  const [loadingPaises, setLoadingPaises] = useState(true);
  const [loadingProvincias, setLoadingProvincias] = useState(false);
  const [loadingCiudades, setLoadingCiudades] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useLocation, setUseLocation] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Cargar lista de países al iniciar
  useEffect(() => {
    async function fetchPaises() {
      try {
        setLoadingPaises(true);
        setError(null);

        const response = await fetch("/api/public/paises");

        if (!response.ok) {
          throw new Error("Error al cargar países");
        }

        const data = await response.json();
        setPaises(data);

        // Intentar detectar país por defecto según el navegador
        const browserLanguage = navigator.language;
        const countryCode = browserLanguage.split("-")[1]?.toUpperCase();

        if (countryCode) {
          const defaultPais = data.find((pais) => pais.codigo === countryCode);
          if (defaultPais) {
            setPaisId(defaultPais.id);
            fetchProvincias(defaultPais.id);
          }
        }
      } catch (error) {
        console.error("Error:", error);
        setError("No pudimos cargar los países. Intenta nuevamente.");
      } finally {
        setLoadingPaises(false);
      }
    }

    fetchPaises();
  }, []);

  // Cargar provincias cuando se selecciona un país
  const fetchProvincias = async (id: number) => {
    try {
      setLoadingProvincias(true);
      setProvincias([]);
      setCiudades([]);
      setProvinciaId(null);
      setCiudadId(null);

      const response = await fetch(`/api/public/paises/${id}/provincias`);

      if (!response.ok) {
        throw new Error("Error al cargar provincias");
      }

      const data = await response.json();
      setProvincias(data);
    } catch (error) {
      console.error("Error:", error);
      setError("Error al cargar provincias");
    } finally {
      setLoadingProvincias(false);
    }
  };

  // Cargar ciudades cuando se selecciona una provincia
  const fetchCiudades = async (id: number) => {
    try {
      setLoadingCiudades(true);
      setCiudades([]);
      setCiudadId(null);

      const response = await fetch(`/api/public/provincias/${id}/ciudades`);

      if (!response.ok) {
        throw new Error("Error al cargar ciudades");
      }

      const data = await response.json();
      setCiudades(data);
    } catch (error) {
      console.error("Error:", error);
      setError("Error al cargar ciudades");
    } finally {
      setLoadingCiudades(false);
    }
  };

  // Manejar cambio de país
  const handlePaisChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(e.target.value);
    setPaisId(id);
    fetchProvincias(id);
  };

  // Manejar cambio de provincia
  const handleProvinciaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(e.target.value);
    setProvinciaId(id);
    fetchCiudades(id);
  };

  // Manejar cambio de ciudad
  const handleCiudadChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(e.target.value);
    setCiudadId(id);
  };

  // Buscar barberías por ciudad seleccionada
  const handleBuscarPorCiudad = () => {
    if (ciudadId) {
      router.push(`/barberias/ciudad/${ciudadId}`);
    }
  };

  // Buscar barberías por ubicación actual
  const handleUseLocation = () => {
    setUseLocation(true);
    setLoadingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Tu navegador no soporta la geolocalización");
      setLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        router.push(`/barberias/cercanas?lat=${latitude}&lng=${longitude}`);
      },
      (error) => {
        console.error("Error de geolocalización:", error);
        setLocationError(
          "No pudimos detectar tu ubicación. Por favor intenta más tarde o selecciona manualmente."
        );
        setLoadingLocation(false);
        setUseLocation(false);
      }
    );
  };

  return (
    <div className="bg-gray-800/80 rounded-lg p-6 backdrop-blur-sm shadow-lg">
      <h2 className="text-xl font-bold text-white mb-4">
        Encuentra barberías cerca de ti
      </h2>

      {error && (
        <div className="bg-red-900/20 backdrop-blur-sm border border-red-600/30 text-red-400 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            País
          </label>
          <select
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600"
            value={paisId || ""}
            onChange={handlePaisChange}
            disabled={loadingPaises}
          >
            <option value="">Selecciona un país</option>
            {paises.map((pais) => (
              <option key={pais.id} value={pais.id}>
                {pais.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Provincia / Estado
          </label>
          <select
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600"
            value={provinciaId || ""}
            onChange={handleProvinciaChange}
            disabled={!paisId || loadingProvincias}
          >
            <option value="">
              {loadingProvincias
                ? "Cargando..."
                : !paisId
                ? "Primero selecciona un país"
                : "Selecciona una provincia"}
            </option>
            {provincias.map((provincia) => (
              <option key={provincia.id} value={provincia.id}>
                {provincia.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Ciudad
          </label>
          <select
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600"
            value={ciudadId || ""}
            onChange={handleCiudadChange}
            disabled={!provinciaId || loadingCiudades}
          >
            <option value="">
              {loadingCiudades
                ? "Cargando..."
                : !provinciaId
                ? "Primero selecciona una provincia"
                : "Selecciona una ciudad"}
            </option>
            {ciudades.map((ciudad) => (
              <option key={ciudad.id} value={ciudad.id}>
                {ciudad.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="pt-2">
          <button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
            disabled={!ciudadId}
            onClick={handleBuscarPorCiudad}
          >
            Buscar barberías
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-800 text-gray-400">o</span>
          </div>
        </div>

        <div>
          <button
            className="w-full bg-transparent border border-blue-500 hover:bg-blue-900/20 text-blue-400 py-2 px-4 rounded-md transition-colors flex items-center justify-center"
            onClick={handleUseLocation}
            disabled={loadingLocation}
          >
            {loadingLocation ? (
              <>
                <div className="w-4 h-4 border-t-2 border-r-2 border-blue-500 rounded-full animate-spin mr-2"></div>
                Detectando ubicación...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Usar mi ubicación actual
              </>
            )}
          </button>

          {locationError && (
            <p className="text-red-400 text-sm mt-2">{locationError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
