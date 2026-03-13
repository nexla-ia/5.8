import { BarChart3 } from 'lucide-react';
import type { ProdutividadeMes } from '../types/analises';

interface ComparativoProdutividadeProps {
  data: ProdutividadeMes[];
}

export default function ComparativoProdutividade({ data }: ComparativoProdutividadeProps) {
  const meses = [...new Set(data.map(d => d.mes))].sort().slice(-6);
  const tecnicos = [...new Set(data.map(d => d.tecnico))];

  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-amber-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-cyan-500'
  ];

  const maxOS = Math.max(...data.map(d => d.totalOS), 1);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <BarChart3 className="text-blue-600" size={20} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Comparativo de Produtividade
          </h3>
          <p className="text-sm text-gray-600">
            Últimos 6 meses
          </p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex gap-3 flex-wrap">
          {tecnicos.map((tecnico, index) => (
            <div key={tecnico} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}></div>
              <span className="text-sm text-gray-700">{tecnico}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {meses.map(mes => {
          const mesData = data.filter(d => d.mes === mes);
          const totalMes = mesData.reduce((acc, d) => acc + d.totalOS, 0);

          return (
            <div key={mes}>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-semibold text-gray-700">
                  {new Date(mes + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </h4>
                <span className="text-xs text-gray-600">{totalMes} OS</span>
              </div>

              <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                <div className="absolute inset-0 flex">
                  {tecnicos.map((tecnico, index) => {
                    const tecnicoData = mesData.find(d => d.tecnico === tecnico);
                    const width = tecnicoData ? (tecnicoData.totalOS / maxOS) * 100 : 0;

                    return (
                      <div
                        key={tecnico}
                        className={`${colors[index % colors.length]} transition-all duration-300 flex items-center justify-center text-white text-xs font-semibold`}
                        style={{ width: `${width}%` }}
                      >
                        {tecnicoData && width > 10 && tecnicoData.totalOS}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                {mesData.map((d, index) => (
                  <div key={index} className="text-xs text-gray-600">
                    <span className="font-medium">{d.tecnico}:</span> {d.totalOS} OS
                    {' '} | R$ {d.valorTotal.toFixed(0)}
                    {' '} | ⭐ {d.pontuacaoMedia.toFixed(1)}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
