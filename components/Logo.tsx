import React from 'react';

export const Logo = ({ className = "h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 420 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Symbol: Dois elementos dinâmicos (estilo "AF") */}
    <path d="M10 45L35 12H75L50 45H10Z" fill="#1440FF" />
    <path d="M80 12H115L105 28H70L80 12Z" fill="#1440FF" />
    
    {/* Text: Posição ajustada e viewBox aumentado para 420 para evitar cortes */}
    <text x="130" y="43" fontFamily="Titillium Web" fontWeight="700" fontSize="38" fill="#FFFFFF" letterSpacing="0.05em">
      AUTOFORCE
    </text>
  </svg>
);