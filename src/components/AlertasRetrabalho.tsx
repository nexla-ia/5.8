import { AlertCircle } from 'lucide-react';
import type { RetrabalhoAlert } from '../types/analises';

interface AlertasRetrabalhoProps {
  alerts: RetrabalhoAlert[];
}

export default function AlertasRetrabalho({ alerts }: AlertasRetrabalhoProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
          <AlertCircle className="text-amber-600" size={20} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Alertas de Retrabalho
          </h3>
          <p className="text-sm text-gray-600">
            {alerts.length} casos detectados
          </p>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">Nenhum retrabalho detectado</p>
            <p className="text-sm text-gray-500 mt-1">Excelente qualidade de serviço!</p>
          </div>
        ) : (
          alerts.map((alert, index) => (
            <div
              key={index}
              className="bg-amber-50 border border-amber-200 rounded-lg p-4 hover:border-amber-400 transition-colors"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 mb-2">
                    {alert.cliente}
                  </h4>
                  <div className="space-y-1 text-sm text-gray-700">
                    <p>
                      <span className="font-medium">{alert.tecnico1}</span> realizou OS em{' '}
                      {new Date(alert.data1).toLocaleDateString('pt-BR')}
                    </p>
                    <p>
                      <span className="font-medium">{alert.tecnico2}</span> refez em{' '}
                      {new Date(alert.data2).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-amber-700 font-medium mt-2">
                      Intervalo: {alert.diasEntre} dias
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
