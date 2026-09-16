'use client';

import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function BrandLogo({ className = '', size = 'md' }: BrandLogoProps) {
  const dimensionClass = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  }[size];

  return (
    <div
      className={`${dimensionClass} rounded-xl overflow-hidden shadow-md flex-shrink-0 relative group-hover:scale-105 transition-transform duration-200 ${className}`}
    >
      <img
        src="/logo.png"
        alt="Bingelog Logo"
        className="w-full h-full object-cover"
      />
    </div>
  );
}
