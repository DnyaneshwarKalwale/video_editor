'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center px-4">
        {/* Scalez Logo */}
        <div className="mb-8">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 623 800" 
            width="120" 
            height="160"
            className="mx-auto"
          >
            <defs>
              <linearGradient id="blue-gradient" gradientUnits="userSpaceOnUse" y2="2" x2="0" y1="62" x1="0">
                <stop stopColor="#00D4FF" stopOpacity="1" />
                <stop stopColor="#00A3FF" stopOpacity="1" offset="1" />
              </linearGradient>
            </defs>
            
            <g transform="translate(50, 50)">
              {/* SCALEZ Logo Background */}
              <path 
                d="M152.012 148.274L159.488 149.52L219.296 173.194L279.104 196.868L291.564 201.852L300.286 200.606L351.372 180.67L401.212 160.734L432.362 148.274H437.346L434.854 174.44L429.87 215.558L426.132 241.724L416.164 323.96L413.672 326.452L378.784 313.992L362.586 307.762L361.34 301.532L371.308 234.248L356.356 240.478L321.468 256.676L297.794 267.89L289.072 266.644L260.414 254.184L241.724 245.462L213.066 233.002L219.296 274.12L220.542 277.858L259.168 292.81L296.548 307.762L352.618 330.19L404.95 351.372L402.458 356.356L391.244 370.062L375.046 388.752L358.848 407.442L342.65 426.132L326.452 444.822L312.746 459.774L302.778 472.234L296.548 479.71L291.564 478.464L280.35 464.758L266.644 448.56L252.938 431.116L236.74 412.426L225.526 398.72L211.82 382.522L200.606 368.816L186.9 352.618L184.408 346.388L190.638 348.88L221.788 366.324L255.43 385.014L285.334 402.458L291.564 406.196L296.548 404.95L317.73 383.768L323.96 376.292L299.04 366.324L272.874 356.356L220.542 336.42L198.114 327.698L176.932 320.222L171.948 317.73L166.964 281.596L152.012 159.488V148.274Z" 
                fill="none"
                stroke="url(#blue-gradient)"
                strokeWidth="10"
                opacity="0.8"
                transform="translate(-25, 0)"
              />
              
              {/* SCALEZ Letters */}
              <g transform="translate(25, 500)">
                <path 
                  fill="none"
                  strokeLinejoin="round" 
                  strokeLinecap="round" 
                  strokeWidth="4" 
                  stroke="url(#blue-gradient)" 
                  d="M 48 20 Q 48 8, 32 8 Q 16 8, 16 20 Q 16 28, 24 30 Q 32 32, 40 34 Q 48 36, 48 44 Q 48 56, 32 56 Q 16 56, 16 44" 
                  transform="translate(0, 0)"
                />
                <path 
                  fill="none"
                  strokeLinejoin="round" 
                  strokeLinecap="round" 
                  strokeWidth="4" 
                  stroke="url(#blue-gradient)" 
                  d="M 48 16 C 40 8, 24 8, 16 16 C 8 24, 8 40, 16 48 C 24 56, 40 56, 48 48" 
                  transform="translate(80, 0)"
                />
                <path 
                  fill="none"
                  strokeLinejoin="round" 
                  strokeLinecap="round" 
                  strokeWidth="4" 
                  stroke="url(#blue-gradient)" 
                  d="M 32 4 L 60 60 H 4 Z M 20 40 H 44" 
                  transform="translate(160, 0)"
                />
                <path 
                  fill="none"
                  strokeLinejoin="round" 
                  strokeLinecap="round" 
                  strokeWidth="4" 
                  stroke="url(#blue-gradient)" 
                  d="M 8 8 V 56 H 56" 
                  transform="translate(240, 0)"
                />
                <path 
                  fill="none"
                  strokeLinejoin="round" 
                  strokeLinecap="round" 
                  strokeWidth="4" 
                  stroke="url(#blue-gradient)" 
                  d="M 8 8 H 56 M 8 32 H 40 M 8 56 H 56" 
                  transform="translate(320, 0)"
                />
                <path 
                  fill="none"
                  strokeLinejoin="round" 
                  strokeLinecap="round" 
                  strokeWidth="4" 
                  stroke="url(#blue-gradient)" 
                  d="M 8 8 L 56 8 L 8 56 L 56 56" 
                  transform="translate(400, 0)"
                />
              </g>
            </g>
          </svg>
        </div>

        {/* 404 Text */}
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-[#00D4FF] to-[#00A3FF] text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            Go Home
          </Link>
          <Link 
            href="/projects"
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            View Projects
          </Link>
        </div>
      </div>
    </div>
  );
}
