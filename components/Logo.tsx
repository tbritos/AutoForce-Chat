import React from 'react';

export const Logo = ({ className = "h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 300 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* AF Symbol - Stylized based on manual */}
    <path d="M40 10 H90 L75 30 H55 L40 50 H10 L25 30 L40 10Z" fill="#1440FF" />
    <path d="M75 30 H110 L100 45 H63 L75 30Z" fill="#1440FF" />
    
    {/* Text - Titillium Web Style */}
    <text x="130" y="45" fontFamily="Titillium Web" fontWeight="700" fontSize="40" fill="#FFFFFF" letterSpacing="2">
      AUTOFORCE
    </text>
  </svg>
);