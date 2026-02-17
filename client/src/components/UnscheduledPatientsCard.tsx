import React, { useEffect, useState } from 'react';
import { AlertCircle, Users, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AlertSoundPopup from './AlertSoundPopup';

interface UnscheduledPatient {
  id: string;
  name: string;
  phone: string;
  lastAppointment?: string;
  daysWithoutAppointment: number;
}

interface UnscheduledPatientsCardProps {
  month: string;
  year: number;
  onViewDetails?: () => void;
}

export const UnscheduledPatientsCard: React.FC<UnscheduledPatientsCardProps> = ({
  month,
  year,
  onViewDetails,
}) => {
  const [unscheduledCount, setUnscheduledCount] = useState(0);
  const [patients, setPatients] = useState<UnscheduledPatient[]>([]);
  const [showAlert, setShowAlert] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Simular carga de pacientes no agendados
    // En producción, esto vendría de la API
    const mockPatients: UnscheduledPatient[] = [
      {
        id: '1',
        name: 'Juan García',
        phone: '595985360602',
        daysWithoutAppointment: 45,
      },
      {
        id: '2',
        name: 'María López',
        phone: '595992478413',
        daysWithoutAppointment: 32,
      },
      {
        id: '3',
        name: 'Carlos Rodríguez',
        phone: '595991650001',
        daysWithoutAppointment: 28,
      },
    ];

    setPatients(mockPatients);
    setUnscheduledCount(mockPatients.length);

    // Mostrar alerta cada 24 horas
    const alertTimer = setInterval(() => {
      setShowAlert(true);
    }, 24 * 60 * 60 * 1000);

    return () => clearInterval(alertTimer);
  }, [month, year]);

  const handleViewDetails = () => {
    setIsExpanded(!isExpanded);
    onViewDetails?.();
  };

  return (
    <div>
      {showAlert && unscheduledCount > 0 && (
        <AlertSoundPopup
          isActive={showAlert}
          count={unscheduledCount}
          onClose={() => setShowAlert(false)}
          onViewPatients={() => setShowAlert(false)}
        />
      )}

      <Card
        className={`p-6 cursor-pointer transition-all hover:shadow-lg border-2 ${
          unscheduledCount > 0 ? 'border-orange-300 bg-orange-50' : 'border-gray-200'
        }`}
        onClick={handleViewDetails}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <AlertCircle className="w-12 h-12 text-orange-500 animate-pulse" />
              <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {unscheduledCount}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-800">Pacientes sin Agendar</h3>
              <p className="text-sm text-gray-600">
                {month} de {year}
              </p>
            </div>
          </div>
          <ChevronRight
            className={`w-6 h-6 text-gray-400 transition-transform ${
              isExpanded ? 'rotate-90' : ''
            }`}
          />
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t-2 border-orange-200">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {patients.map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-100 hover:bg-orange-50"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{patient.name}</p>
                    <p className="text-xs text-gray-500">{patient.phone}</p>
                    <p className="text-xs text-orange-600 mt-1">
                      {patient.daysWithoutAppointment} días sin cita
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Agendar cita
                    }}
                  >
                    Agendar
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Total: {patients.length} pacientes
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default UnscheduledPatientsCard;
