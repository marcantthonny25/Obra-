import React, { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';

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
      className={`inline-flex flex-col items-center justify-center bg-[#08120C]/80 backdrop-blur-md border border-[#73B993]/30 rounded-2xl px-4 py-2.5 shadow-lg shadow-black/50 transition-all text-white select-none ${className}`}
      id="datetime-panel"
    >
      {/* Time Header with #73B993 Details */}
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#73B993] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#73B993]"></span>
        </span>
        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#73B993] shrink-0" />
        <span className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight font-mono text-white drop-shadow">
          {timeStr}
        </span>
        <span className="text-[10px] font-bold text-[#73B993] bg-[#73B993]/15 border border-[#73B993]/30 px-1.5 py-0.5 rounded-md uppercase tracking-wider ml-0.5">
          BRT
        </span>
      </div>

      {/* Date Subtitle */}
      <div className="text-[11px] sm:text-xs font-medium text-white/90 flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-[#73B993]/20 w-full justify-center">
        <Calendar className="w-3.5 h-3.5 text-[#73B993] shrink-0" />
        <span className="truncate">{dateStr}</span>
      </div>
    </div>
  );
};
