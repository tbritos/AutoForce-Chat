import React from 'react';

export const Logo = ({ className = "h-8" }: { className?: string }) => (
  <img 
    src="https://static.autodromo.com.br/uploads/1dc32f4d-ab47-428d-91dd-756266d45b47_LOGOTIPO-AUTOFORCE-HORIZONTAL.svg" 
    alt="AutoForce" 
    className={className}
  />
);