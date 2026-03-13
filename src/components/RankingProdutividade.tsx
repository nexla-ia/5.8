import { Trophy } from 'lucide-react';
import type { TecnicoStats } from '../types/analises';

interface RankingProdutividadeProps {
  stats: TecnicoStats[];
}

export default function RankingProdutividade({ stats }: RankingProdutividadeProps) {
  const sortedByOS = [...stats].sort((a, b) => b.totalOS - a.totalOS);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center">
          <Trophy className="text-white" size={20} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Ranking de Produtividade
          </h3>
          <p className="text-sm text-gray-600">
            Total de OS realizadas
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {sortedByOS.map((stat, index) => {
          const isFirst = index === 0;
          const isSecond = index === 1;
          const isThird = index === 2;

          return (
            <div
              key={index}
              className={`rounded-lg p-4 border transition-all hover:shadow-md ${
                isFirst
                  ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300'
                  : isSecond
                  ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300'
                  : isThird
                  ? 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-300'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {isFirst && (
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                      <Trophy className="text-white" size={24} />
                    </div>
                  )}
                  {isSecond && (
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center shadow-lg">
                      <Trophy className="text-white" size={24} />
                    </div>
                  )}
                  {isThird && (
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                      <Trophy className="text-white" size={24} />
                    </div>
                  )}
                  {!isFirst && !isSecond && !isThird && (
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-gray-300">
                      <span className="text-xl font-bold text-gray-600">{index + 1}</span>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-800 text-lg">
                      {stat.tecnico}
                    </h4>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-800">
                        {stat.totalOS}
                      </div>
                      <p className="text-xs text-gray-600">OS realizadas</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-3">
                    <div className="bg-white bg-opacity-50 rounded-lg p-2">
                      <p className="text-xs text-gray-600 mb-1">Valor Total</p>
                      <p className="text-sm font-semibold text-gray-800">
                        R$ {stat.valorTotal.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-white bg-opacity-50 rounded-lg p-2">
                      <p className="text-xs text-gray-600 mb-1">Pontuação Média</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {stat.pontuacaoMedia.toFixed(1)}/10
                      </p>
                    </div>
                    <div className="bg-white bg-opacity-50 rounded-lg p-2">
                      <p className="text-xs text-gray-600 mb-1">Performance</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {stat.pontuacaoPonderada.toFixed(0)}pts
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-300 border-opacity-50">
                <div className="h-2 bg-white bg-opacity-50 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isFirst
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                        : isSecond
                        ? 'bg-gradient-to-r from-gray-400 to-gray-500'
                        : isThird
                        ? 'bg-gradient-to-r from-orange-400 to-orange-500'
                        : 'bg-gradient-to-r from-blue-400 to-blue-500'
                    }`}
                    style={{ width: `${(stat.totalOS / sortedByOS[0].totalOS) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
