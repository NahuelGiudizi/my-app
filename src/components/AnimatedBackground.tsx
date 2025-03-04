'use client';

import { useEffect, useRef } from 'react';

export default function AnimatedBackground() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    // Crear destellos aleatorios con más variedad
    const createSparkleSeries = () => {
      const sparkleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      sparkleGroup.setAttribute('class', 'sparkle-group');

      // Aumentar número de destellos
      const sparkleCount = 50; // Incrementado de 20 a 50

      for (let i = 0; i < sparkleCount; i++) {
        const sparkle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        
        // Posición aleatoria
        const x = Math.random() * 1440;
        const y = Math.random() * 900;
        
        // Tamaño aleatorio (hasta 5x el tamaño original)
        const baseSize = 2;
        const randomSizeFactor = 1 + Math.random() * 4; // 1x to 5x
        const radius = baseSize * randomSizeFactor;
        
        sparkle.setAttribute('cx', x.toString());
        sparkle.setAttribute('cy', y.toString());
        sparkle.setAttribute('r', '0');
        
        // Variación de color y opacidad
        const blueShade = Math.floor(Math.random() * 100) + 130; // Variación de azul
        sparkle.setAttribute('fill', `rgba(59,${blueShade},246,0.3)`);
        
        // Animación de destello
        const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        animate.setAttribute('attributeName', 'r');
        animate.setAttribute('values', `0;${radius};0`);
        animate.setAttribute('dur', `${5 + Math.random() * 7}s`);
        animate.setAttribute('repeatCount', 'indefinite');
        animate.setAttribute('begin', `${Math.random() * 5}s`);
        
        const animateOpacity = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        animateOpacity.setAttribute('attributeName', 'fill-opacity');
        animateOpacity.setAttribute('values', '0;0.5;0');
        animateOpacity.setAttribute('dur', `${5 + Math.random() * 7}s`);
        animateOpacity.setAttribute('repeatCount', 'indefinite');
        animateOpacity.setAttribute('begin', `${Math.random() * 5}s`);
        
        sparkle.appendChild(animate);
        sparkle.appendChild(animateOpacity);
        sparkleGroup.appendChild(sparkle);
      }

      svg.appendChild(sparkleGroup);
    };

    // Añadir destellos
    createSparkleSeries();

    // Limpiar al desmontar
    return () => {
      const sparkleGroup = svg.querySelector('.sparkle-group');
      if (sparkleGroup) {
        svg.removeChild(sparkleGroup);
      }
    };
  }, []);

  return (
    <svg 
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 1440 900" 
      preserveAspectRatio="xMaxYMax slice"
      className="absolute inset-0 w-full h-full z-0"
    >
      <defs>
        {/* Sophisticated Gradient */}
        <linearGradient id="ultraGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0C0F1A" stopOpacity="1"/>
          <stop offset="50%" stopColor="#1A202C" stopOpacity="1"/>
          <stop offset="100%" stopColor="#111827" stopOpacity="1"/>
        </linearGradient>

        {/* Precision Mesh Filter */}
        <filter id="precisionFilter">
          <feTurbulence 
            type="fractalNoise" 
            baseFrequency="0.01" 
            numOctaves="2" 
            result="turbulence"
          />
          <feDisplacementMap 
            in2="turbulence" 
            in="SourceGraphic" 
            scale="3" 
            xChannelSelector="R" 
            yChannelSelector="G"
          />
          <feGaussianBlur stdDeviation="0.5" />
        </filter>
      </defs>

      {/* Background Layers */}
      <rect width="100%" height="100%" fill="url(#ultraGradient)"/>

      {/* Animated Precision Circles */}
      {[0, 1, 2].map((index) => (
        <circle 
          key={`animated-circle-${index}`}
          className="animated-circle"
          cx="50%" 
          cy="50%" 
          r={`${150 + index * 50}`}
          fill="transparent" 
          stroke="rgba(59,130,246,0.05)" 
          strokeWidth="20"
        />
      ))}

      {/* Subtle Directional Lines */}
      <g opacity="0.1" stroke="rgba(255,255,255,0.05)">
        <path 
          d="M-100 0 L1540 900 
             M-100 100 L1540 1000 
             M-100 200 L1540 1100" 
          strokeWidth="2"
        />
        <path 
          d="M1540 0 L-100 900 
             M1540 100 L-100 1000 
             M1540 200 L-100 1100" 
          strokeWidth="2"
        />
      </g>
    </svg>
  );
}