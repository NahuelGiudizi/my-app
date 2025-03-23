"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import LocationSelector from "@/components/LocationSelector";
import AnimatedBackground from "@/components/AnimatedBackground";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-900 py-12 relative overflow-hidden">
      {/* Animated Background Component */}
      <AnimatedBackground />

      {/* Enlaces de navegación */}
      <div className="absolute top-4 right-4 z-10 flex space-x-4">
        <Link
          href="/cliente/login"
          className="text-gray-400 hover:text-white transition-colors text-sm"
        >
          Iniciar Sesión
        </Link>
        <Link
          href="/admin/login"
          className="text-gray-400 hover:text-white transition-colors text-sm"
        >
          Panel Admin
        </Link>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 relative">
          <h1 className="text-5xl font-bold text-center text-white mb-4">
            Barbería System
          </h1>
          <p className="text-gray-400 max-w-md mx-auto">
            Encuentra tu barbería ideal y agenda tu cita en minutos
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-10 max-w-7xl mx-auto">
          {/* Selector de ubicación */}
          <div className="md:col-span-1">
            <LocationSelector />
          </div>

          {/* Barberías destacadas */}
          <div className="md:col-span-1 bg-gray-800/80 rounded-lg p-6 backdrop-blur-sm shadow-lg">
            <h2 className="text-xl font-bold text-white mb-4">
              Barberías destacadas
            </h2>

            <div className="space-y-4">
              {/* Mostraremos 3-4 barberías destacadas con su información */}
              <div className="bg-gray-700/50 rounded-lg p-4 flex space-x-4 hover:bg-gray-700 transition-colors">
                <div className="w-16 h-16 bg-gray-600 rounded-lg flex-shrink-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">BS</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white mb-1">Barbería System</h3>
                  <p className="text-sm text-gray-300 mb-1">
                    La mejor experiencia en cortes de cabello
                  </p>
                  <div className="flex space-x-2 text-xs">
                    <span className="px-2 py-0.5 bg-blue-900/40 text-blue-200 rounded-full">
                      3 sucursales
                    </span>
                    <span className="px-2 py-0.5 bg-green-900/40 text-green-200 rounded-full">
                      15 barberos
                    </span>
                  </div>
                </div>
              </div>

              {/* Placeholder para más barberías destacadas */}
              <div className="bg-gray-700/50 rounded-lg p-4 flex space-x-4 hover:bg-gray-700 transition-colors">
                <div className="w-16 h-16 bg-gray-600 rounded-lg flex-shrink-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">EB</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white mb-1">Elite Barbers</h3>
                  <p className="text-sm text-gray-300 mb-1">
                    Estilo y elegancia en cada corte
                  </p>
                  <div className="flex space-x-2 text-xs">
                    <span className="px-2 py-0.5 bg-blue-900/40 text-blue-200 rounded-full">
                      2 sucursales
                    </span>
                    <span className="px-2 py-0.5 bg-green-900/40 text-green-200 rounded-full">
                      8 barberos
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700/50 rounded-lg p-4 flex space-x-4 hover:bg-gray-700 transition-colors">
                <div className="w-16 h-16 bg-gray-600 rounded-lg flex-shrink-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">CB</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white mb-1">Classic Barber</h3>
                  <p className="text-sm text-gray-300 mb-1">
                    Tradición y modernidad en barbería
                  </p>
                  <div className="flex space-x-2 text-xs">
                    <span className="px-2 py-0.5 bg-blue-900/40 text-blue-200 rounded-full">
                      5 sucursales
                    </span>
                    <span className="px-2 py-0.5 bg-green-900/40 text-green-200 rounded-full">
                      20 barberos
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-center mt-6">
                <Link
                  href="/barberias/destacadas"
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                >
                  Ver todas las barberías destacadas →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Sección de beneficios */}
        <div className="mt-20 grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          <div className="bg-gray-800/60 backdrop-blur-sm p-6 rounded-lg text-center">
            <div className="bg-blue-600/30 w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-blue-300"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Ahorra tiempo</h3>
            <p className="text-gray-300">
              Olvídate de las llamadas y largas esperas. Reserva tu turno con un
              par de clics.
            </p>
          </div>

          <div className="bg-gray-800/60 backdrop-blur-sm p-6 rounded-lg text-center">
            <div className="bg-blue-600/30 w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-blue-300"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Cerca de ti</h3>
            <p className="text-gray-300">
              Encuentra las mejores barberías en tu zona con nuestro sistema de
              ubicación.
            </p>
          </div>

          <div className="bg-gray-800/60 backdrop-blur-sm p-6 rounded-lg text-center">
            <div className="bg-blue-600/30 w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-blue-300"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Servicios de calidad
            </h3>
            <p className="text-gray-300">
              Explora reseñas, calificaciones y elige entre los mejores
              profesionales.
            </p>
          </div>
        </div>

        {/* Footer minimalista */}
        <footer className="mt-20 text-center text-gray-500 text-sm">
          <p>© 2025 Barbería System. Todos los derechos reservados.</p>
          <div className="flex justify-center space-x-6 mt-3">
            <a href="#" className="hover:text-white transition-colors">
              Instagram
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Facebook
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Twitter
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Contacto
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}
