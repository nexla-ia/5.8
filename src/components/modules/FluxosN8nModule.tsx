import { useState } from 'react';
import { Menu, Zap, Play, Square, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';

interface FluxosN8nModuleProps {
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
}

interface FluxoStatus {
  loading: boolean;
  lastAction: 'ativar' | 'desativar' | null;
  success: boolean | null;
  message: string;
}

const URL_ATIVAR_CS = 'http://valida.internet58.com.br:5678/webhook/ativarcs';
const URL_DESATIVAR_CS = 'http://valida.internet58.com.br:5678/webhook/desativarcs';

const fluxos = [
  {
    id: 'cs',
    label: 'Fluxo CS',
    description: 'Fluxo de Customer Success — disparo automático de pesquisas pós-atendimento',
    urlAtivar: URL_ATIVAR_CS,
    urlDesativar: URL_DESATIVAR_CS,
    color: 'from-purple-500 to-pink-500',
    colorBg: 'bg-purple-500/10',
    colorBorder: 'border-purple-500/30',
    colorText: 'text-purple-400',
  },
];

export default function FluxosN8nModule({ onSidebarToggle }: FluxosN8nModuleProps) {
  const [statuses, setStatuses] = useState<Record<string, FluxoStatus>>(
    Object.fromEntries(
      fluxos.map((f) => [
        f.id,
        { loading: false, lastAction: null, success: null, message: '' },
      ])
    )
  );

  const handleAction = async (fluxoId: string, action: 'ativar' | 'desativar') => {
    const fluxo = fluxos.find((f) => f.id === fluxoId);
    if (!fluxo) return;

    setStatuses((prev) => ({
      ...prev,
      [fluxoId]: { loading: true, lastAction: action, success: null, message: '' },
    }));

    const url = action === 'ativar' ? fluxo.urlAtivar : fluxo.urlDesativar;

    try {
      const resp = await fetch(url, { method: 'POST' });
      const ok = resp.ok;
      setStatuses((prev) => ({
        ...prev,
        [fluxoId]: {
          loading: false,
          lastAction: action,
          success: ok,
          message: ok
            ? `Fluxo ${action === 'ativar' ? 'ativado' : 'desativado'} com sucesso!`
            : `Erro ${resp.status}: não foi possível ${action} o fluxo.`,
        },
      }));
    } catch {
      setStatuses((prev) => ({
        ...prev,
        [fluxoId]: {
          loading: false,
          lastAction: action,
          success: false,
          message: 'Falha na conexão com o webhook.',
        },
      }));
    }

    // Limpa mensagem após 5s
    setTimeout(() => {
      setStatuses((prev) => ({
        ...prev,
        [fluxoId]: { ...prev[fluxoId], success: null, message: '' },
      }));
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-800/80 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onSidebarToggle}
            className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
              <Zap size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">Fluxos N8N</h1>
              <p className="text-slate-500 text-xs">Controle de automações</p>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 p-6 max-w-3xl mx-auto w-full">
        <div className="mb-6">
          <h2 className="text-slate-300 text-sm font-semibold uppercase tracking-widest mb-1">
            Automações disponíveis
          </h2>
          <p className="text-slate-500 text-sm">
            Use os botões abaixo para ativar ou desativar cada fluxo no N8N.
          </p>
        </div>

        <div className="space-y-4">
          {fluxos.map((fluxo) => {
            const st = statuses[fluxo.id];

            return (
              <div
                key={fluxo.id}
                className={`rounded-2xl border ${fluxo.colorBorder} ${fluxo.colorBg} p-6`}
              >
                {/* Topo do card */}
                <div className="flex items-start gap-4 mb-5">
                  <div
                    className={`w-11 h-11 bg-gradient-to-br ${fluxo.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}
                  >
                    <Zap size={20} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-base">{fluxo.label}</h3>
                    <p className="text-slate-400 text-sm mt-0.5">{fluxo.description}</p>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex gap-3 flex-wrap">
                  {/* Ativar */}
                  <button
                    onClick={() => handleAction(fluxo.id, 'ativar')}
                    disabled={st.loading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-500/15 border border-green-500/30 text-green-400 hover:bg-green-500/25 hover:border-green-500/50 transition-all duration-200 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {st.loading && st.lastAction === 'ativar' ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Play size={16} />
                    )}
                    Ativar Fluxo
                  </button>

                  {/* Desativar */}
                  <button
                    onClick={() => handleAction(fluxo.id, 'desativar')}
                    disabled={st.loading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 hover:border-red-500/50 transition-all duration-200 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {st.loading && st.lastAction === 'desativar' ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Square size={16} />
                    )}
                    Desativar Fluxo
                  </button>
                </div>

                {/* Feedback */}
                {st.message && (
                  <div
                    className={`mt-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
                      st.success
                        ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                        : 'bg-red-500/10 border border-red-500/30 text-red-400'
                    }`}
                  >
                    {st.success ? (
                      <CheckCircle size={16} className="flex-shrink-0" />
                    ) : (
                      <XCircle size={16} className="flex-shrink-0" />
                    )}
                    {st.message}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Aviso */}
        <div className="mt-8 flex items-start gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
          <span>
            As ações são enviadas diretamente ao N8N. Certifique-se de que o servidor está online
            antes de executar.
          </span>
        </div>
      </div>
    </div>
  );
}
