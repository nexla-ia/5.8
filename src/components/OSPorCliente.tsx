import { AlertTriangle, Users } from 'lucide-react';
import type { ClienteAlert } from '../types/analises';

interface OSPorClienteProps {
  alerts: ClienteAlert[];
}

export default function OSPorCliente({ alerts }: OSPorClienteProps) {
  const alertasRecentes = alerts.filter(alert => alert.totalOS >= 1);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Users className="text-blue-600" size={20} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            OS por Cliente (30 dias)
          </h3>
          <p className="text-sm text-gray-600">
            {alertasRecentes.length} clientes com atendimento recente
          </p>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {alertasRecentes.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            Nenhuma OS nos últimos 30 dias
          </p>
        ) : (
          alertasRecentes.map((alert, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-gray-800">{alert.cliente}</h4>
                <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded">
                  {alert.totalOS} OS
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <p>Última OS: {new Date(alert.ultimaOS).toLocaleDateString('pt-BR')}</p>
                <p className="mt-1">
                  Técnicos: {alert.tecnicos.join(', ')}
                </p>
              </div>
              {alert.totalOS > 1 && (
                <div className="mt-3 flex items-center gap-2 text-amber-600 text-sm">
                  <AlertTriangle size={16} />
                  <span>Múltiplas OS no período</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
