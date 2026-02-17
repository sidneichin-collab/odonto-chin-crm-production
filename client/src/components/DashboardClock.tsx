import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock } from 'lucide-react';

export default function DashboardClock() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const timeString = format(currentTime, 'HH:mm:ss');
  const dateString = format(currentTime, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
  
  // Detect timezone automatically from browser
  const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timezoneOffset = -currentTime.getTimezoneOffset() / 60;
  const timezoneString = `${detectedTimezone} (GMT${timezoneOffset >= 0 ? '+' : ''}${timezoneOffset})`;

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border border-blue-200 dark:border-blue-800">
      <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      <div className="flex-1">
        <div className="text-2xl font-bold text-blue-900 dark:text-blue-100 tabular-nums">
          {timeString}
        </div>
        <div className="text-xs text-blue-700 dark:text-blue-300">
          {dateString}
        </div>
        <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
          {timezoneString}
        </div>
      </div>
    </div>
  );
}
