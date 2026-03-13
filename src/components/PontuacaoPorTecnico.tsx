import { Award } from 'lucide-react';
import type { TecnicoStats } from '../types/analises';

interface PontuacaoPorTecnicoProps {
  stats: TecnicoStats[];
  tecnicosAuxMap?: Record<string, string>;
}

export default function PontuacaoPorTecnico({ stats, tecnicosAuxMap = {} }: PontuacaoPorTecnicoProps) {
  const nomeTecnico = (id: string) => tecnicosAuxMap[id] ? `${tecnicosAuxMap[id]}` : `Técnico ${id}`;
  const sortedStats = [...stats].sort((a, b) => b.pontuacaoPonderada - a.pontuacaoPonderada);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <Award className="text-green-600" size={20} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Pontuação por Técnico
          </h3>
          <p className="text-sm text-gray-600">
            Performance baseada em pontuação × valor
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {sortedStats.map((stat, index) => (
          <div
            key={index}
            className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-4 border border-gray-200 hover:border-green-300 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {index === 0 && (
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">1º</span>
                  </div>
                )}
                {index === 1 && (
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">2º</span>
                  </div>
                )}
                {index === 2 && (
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">3º</span>
                  </div>
                )}
                {index > 2 && (
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 text-sm font-bold">{index + 1}º</span>
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-gray-800">{nomeTecnico(stat.tecnico)}</h4>
                  <p className="text-sm text-gray-500 text-xs">ID {stat.tecnico} · {stat.totalOS} OS realizadas</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  {stat.pontuacaoPonderada.toFixed(0)}
                </div>
                <p className="text-xs text-gray-500">pontos</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-200">
              <div>
                <p className="text-xs text-gray-600 mb-1">Pontuação Média</p>
                <p className="text-sm font-semibold text-gray-800">
                  {stat.pontuacaoMedia.toFixed(1)}/10
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Valor Total</p>
                <p className="text-sm font-semibold text-gray-800">
                  R$ {stat.valorTotal.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Valor Médio</p>
                <p className="text-sm font-semibold text-gray-800">
                  R$ {(stat.valorTotal / stat.totalOS).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
