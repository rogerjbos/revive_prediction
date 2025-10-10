import React from 'react';

interface PolkadotLogoProps {
  size?: number;
  className?: string;
}

export const PolkadotLogo: React.FC<PolkadotLogoProps> = ({
  size = 32,
  className = ""
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer circle */}
      <circle cx="32" cy="32" r="32" fill="#E6007A" />

      {/* Inner circles representing the Polkadot network */}
      <circle cx="32" cy="16" r="5" fill="white" />
      <circle cx="48" cy="24" r="5" fill="white" />
      <circle cx="48" cy="40" r="5" fill="white" />
      <circle cx="32" cy="48" r="5" fill="white" />
      <circle cx="16" cy="40" r="5" fill="white" />
      <circle cx="16" cy="24" r="5" fill="white" />


      {/* Connecting lines */}
      <line x1="32" y1="21" x2="32" y2="27" stroke="#E6007A" strokeWidth="2" />
      <line x1="37" y1="24" x2="43" y2="24" stroke="#E6007A" strokeWidth="2" />
      <line x1="37" y1="40" x2="43" y2="40" stroke="#E6007A" strokeWidth="2" />
      <line x1="32" y1="37" x2="32" y2="43" stroke="#E6007A" strokeWidth="2" />
      <line x1="21" y1="40" x2="27" y2="40" stroke="#E6007A" strokeWidth="2" />
      <line x1="21" y1="24" x2="27" y2="24" stroke="#E6007A" strokeWidth="2" />
    </svg>
  );
};