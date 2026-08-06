import React, { useState, useEffect } from 'react';

interface DateTimePanelProps {
  className?: string;
}

export const DateTimePanel: React.FC<DateTimePanelProps> = ({ className = '' }) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();

      // Format time in Brasília timezone (America/Sao_Paulo) -> HH:mm
      const formattedTime = now.toLocaleTimeString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      // Format full date in Brasília timezone (America/Sao_Paulo)
      // Example: "quinta-feira, 6 de agosto de 2026"
      const rawDate = now.toLocaleDateString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      // Capitalize first letter of weekday
      const formattedDate = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);

      setTimeStr(formattedTime);
      setDateStr(formattedDate);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!timeStr) return null;

  return (
    <div
      className={`flex flex-col items-center justify-center text-center select-none ${className}`}
      id="datetime-panel"
    >
      {/* Time in light, discrete typography */}
      <div className="flex items-center gap-1.5 leading-none">
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#73B993] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#73B993]"></span>
        </span>
        <span className="text-sm sm:text-base font-bold font-mono text-white tracking-wider">
          {timeStr}
        </span>
        <span className="text-[9px] font-bold text-[#73B993] tracking-widest uppercase">
          BRT
        </span>
      </div>

      {/* Date in small, light discrete typography */}
      <div className="text-[10px] sm:text-[11px] font-medium text-gray-400 mt-1 tracking-tight truncate">
        {dateStr}
      </div>
    </div>
  );
};
