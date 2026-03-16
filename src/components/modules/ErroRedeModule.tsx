import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { ErroRede } from '../../types';
import {
  RefreshCw, Wifi, WifiOff, CheckCircle, AlertTriangle,
  Search, Calendar, X, ChevronDown, ChevronUp, Play, Loader2,
  Bell, BellOff, Menu,
} from 'lucide-react';

type Section = 'overview' | 'registros';

interface ErroRedeModuleProps {
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
}

const WEBHOOK_URL = 'http://valida.internet58.com.br:5678/webhook/iniciar-verificao';

// ─── helpers ─────────────────────────────────────────────
function isRegular(r: ErroRede) {
  return r.status_final_verificacao?.toLowerCase() === 'regular';
}
function isIrregular(r: ErroRede) {
  return r.status_final_verificacao?.toLowerCase() === 'irregular';
}
function isAvisado(r: ErroRede) {
  return !!r.aviso_final && r.aviso_final.trim() !== '';
}

function statusBadge(r: ErroRede) {
  if (isRegular(r)) return { label: 'Regular', color: 'bg-green-100 text-green-700 border-green-200' };
  if (isIrregular(r)) return { label: 'Irregular', color: 'bg-red-100 text-red-700 border-red-200' };
  return { label: 'Aguardando', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── metric card ─────────────────────────────────────────
function MetricCard({ title, value, sub, icon: Icon, color }: {
  title: string; value: string | number; sub?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: 'red' | 'green' | 'yellow' | 'orange' | 'slate';
}) {
  const colors = {
    red:    { bg: 'bg-red-50',    text: 'text-red-600',    icon: 'text-red-400'    },
    green:  { bg: 'bg-green-50',  text: 'text-green-600',  icon: 'text-green-400'  },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', icon: 'text-yellow-400' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', icon: 'text-orange-400' },
    slate:  { bg: 'bg-slate-50',  text: 'text-slate-700',  icon: 'text-slate-400'  },
  }[color];
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{title}</p>
        <p className={`text-3xl font-black ${colors.text}`}>{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
      <div className={`${colors.bg} p-2.5 rounded-lg`}>
        <Icon size={18} className={colors.icon} />
      </div>
    </div>
  );
}

// ─── overview ────────────────────────────────────────────
function OverviewSection({ data, onIniciar, loading, webhookStatus }: {
  data: ErroRede[];
  onIniciar: () => void;
  loading: boolean;
  webhookStatus: 'idle' | 'loading' | 'success' | 'error';
}) {
  const total = data.length;
  const regular = data.filter(isRegular).length;
  const irregular = data.filter(isIrregular).length;
  const aguardando = data.filter(r => !isRegular(r) && !isIrregular(r)).length;
  const avisados = data.filter(isAvisado).length;

  return (
    <div className="space-y-6">
      {/* Botão principal */}
      <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <h3 className="text-base font-bold text-slate-800 mb-1">Iniciar Verificação de Rede</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Dispara o fluxo de verificação para todos os clientes registrados. O sistema irá
              contatar cada cliente e informar se a conexão voltou ao normal ou ainda está com problema.
            </p>
          </div>
          <button
            onClick={onIniciar}
            disabled={webhookStatus === 'loading'}
            className={`
              flex items-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-sm
              transition-all duration-200 flex-shrink-0 shadow-md
              ${webhookStatus === 'loading'
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : webhookStatus === 'success'
                  ? 'bg-green-500 text-white shadow-green-500/30'
                  : webhookStatus === 'error'
                    ? 'bg-red-500 text-white shadow-red-500/30'
                    : 'bg-gradient-to-r from-red-500 to-orange-500 text-white hover:opacity-90 shadow-red-500/30'
              }
            `}
          >
            {webhookStatus === 'loading' ? (
              <><Loader2 size={16} className="animate-spin" /> Disparando...</>
            ) : webhookStatus === 'success' ? (
              <><CheckCircle size={16} /> Enviado!</>
            ) : webhookStatus === 'error' ? (
              <><AlertTriangle size={16} /> Erro — tentar novamente</>
            ) : (
              <><Play size={16} /> Iniciar Verificação</>
            )}
          </button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard title="Total" value={total} sub="registros" icon={Wifi} color="slate" />
        <MetricCard title="Regular" value={regular} sub="conexão ok" icon={CheckCircle} color="green" />
        <MetricCard title="Irregular" value={irregular} sub="ainda offline" icon={WifiOff} color="red" />
        <MetricCard title="Aguardando" value={aguardando} sub="sem status" icon={AlertTriangle} color="yellow" />
        <MetricCard title="Avisados" value={avisados} sub="cliente notificado" icon={Bell} color="orange" />
      </div>

      {/* Lista resumida */}
      {data.length > 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">Clientes com Ocorrências</p>
            <p className="text-xs text-slate-400 mt-0.5">Todos os registros ativos</p>
          </div>
          <div className="divide-y divide-slate-100">
            {data.slice(0, 10).map(r => {
              const { label, color } = statusBadge(r);
              return (
                <div key={r.id} className="px-5 py-3 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{r.nome || '—'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      ID: {r.id_cliente || '—'} · Rota: {r.rota || '—'}
                    </p>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${color}`}>
                    {label}
                  </span>
                  {isAvisado(r) ? (
                    <Bell size={14} className="text-orange-400 flex-shrink-0" />
                  ) : (
                    <BellOff size={14} className="text-slate-300 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
          {data.length > 10 && (
            <div className="px-5 py-3 bg-slate-50 text-xs text-slate-400 text-center">
              +{data.length - 10} registros — veja em Registros
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 shadow-sm text-center">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <CheckCircle size={24} className="text-green-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700">Nenhuma ocorrência registrada</p>
          <p className="text-xs text-slate-400 mt-1">
            Quando clientes com problemas de rede entrarem em contato, os registros aparecerão aqui.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── registros ───────────────────────────────────────────
function RegistrosSection({ data }: { data: ErroRede[] }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'regular' | 'irregular' | 'aguardando'>('todos');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 30;

  const filtered = data.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      r.nome?.toLowerCase().includes(q) ||
      r.id_cliente?.toLowerCase().includes(q) ||
      r.cnpjcpf?.toLowerCase().includes(q) ||
      r.rota?.toLowerCase().includes(q);
    const matchStatus =
      statusFilter === 'todos' ||
      (statusFilter === 'regular' && isRegular(r)) ||
      (statusFilter === 'irregular' && isIrregular(r)) ||
      (statusFilter === 'aguardando' && !isRegular(r) && !isIrregular(r));
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const statusButtons: { key: typeof statusFilter; label: string }[] = [
    { key: 'todos',      label: 'Todos' },
    { key: 'regular',    label: 'Regular' },
    { key: 'irregular',  label: 'Irregular' },
    { key: 'aguardando', label: 'Aguardando' },
  ];

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar por nome, ID, CPF/CNPJ, rota..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/30 bg-slate-50"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {statusButtons.map(b => (
            <button
              key={b.key}
              onClick={() => { setStatusFilter(b.key); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === b.key
                  ? 'bg-red-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        {paged.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-12">Nenhum registro encontrado</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {paged.map(r => {
              const { label, color } = statusBadge(r);
              const isExp = expanded === r.id;
              return (
                <div key={r.id}>
                  <button
                    onClick={() => setExpanded(isExp ? null : r.id)}
                    className="w-full px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-800 truncate">
                          {r.nome || '—'}
                        </span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${color}`}>
                          {label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        ID: {r.id_cliente || '—'} · CPF/CNPJ: {r.cnpjcpf || '—'} · Rota: {r.rota || '—'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {isAvisado(r) ? (
                        <Bell size={14} className="text-orange-400" />
                      ) : (
                        <BellOff size={14} className="text-slate-300" />
                      )}
                      <span className="text-xs text-slate-400">{fmtDate(r.created_at)}</span>
                      {isExp ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                    </div>
                  </button>
                  {isExp && (
                    <div className="px-5 pb-4 bg-slate-50 border-t border-slate-100">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3">
                        {[
                          { label: 'ID Cliente',           value: r.id_cliente },
                          { label: 'Nome',                 value: r.nome },
                          { label: 'CPF/CNPJ',             value: r.cnpjcpf },
                          { label: 'Rota (OPA)',           value: r.rota },
                          { label: 'ID 5.8',               value: r['idnumero5.8'] },
                          { label: 'Status Verificação',   value: r.status_final_verificacao },
                          { label: 'Aviso Final',          value: r.aviso_final },
                          { label: 'Registrado em',        value: fmtDate(r.created_at) },
                        ].map(f => (
                          <div key={f.label} className="bg-white rounded-lg border border-slate-200 px-3 py-2.5">
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-0.5">{f.label}</p>
                            <p className="text-sm text-slate-700 font-medium truncate">{f.value || '—'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="text-xs text-slate-500">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Próxima
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── main ─────────────────────────────────────────────────
export default function ErroRedeModule({ sidebarOpen, onSidebarToggle }: ErroRedeModuleProps) {
  const [section, setSection] = useState<Section>('overview');
  const [data, setData] = useState<ErroRede[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [webhookStatus, setWebhookStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function fetchData() {
    setLoading(true);
    let q = supabase.from('5.8-erro_rede').select('*').order('created_at', { ascending: false });
    if (filterDateFrom) q = q.gte('created_at', filterDateFrom);
    if (filterDateTo)   q = q.lte('created_at', filterDateTo + 'T23:59:59');
    const { data: rows, error } = await q;
    if (!error && rows) setData(rows as ErroRede[]);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, [filterDateFrom, filterDateTo]);

  // quick date shortcuts
  function applyShortcut(type: 'todos' | 'mes' | 'anterior' | 'trimestre') {
    const now = new Date();
    if (type === 'todos') {
      setFilterDateFrom(''); setFilterDateTo(''); return;
    }
    if (type === 'mes') {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      const to   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setFilterDateFrom(from.toISOString().split('T')[0]);
      setFilterDateTo(to.toISOString().split('T')[0]);
      return;
    }
    if (type === 'anterior') {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to   = new Date(now.getFullYear(), now.getMonth(), 0);
      setFilterDateFrom(from.toISOString().split('T')[0]);
      setFilterDateTo(to.toISOString().split('T')[0]);
      return;
    }
    if (type === 'trimestre') {
      const from = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const to   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setFilterDateFrom(from.toISOString().split('T')[0]);
      setFilterDateTo(to.toISOString().split('T')[0]);
    }
  }

  async function handleIniciarVerificacao() {
    setWebhookStatus('loading');
    try {
      const res = await fetch(WEBHOOK_URL, { method: 'POST' });
      setWebhookStatus(res.ok ? 'success' : 'error');
    } catch {
      setWebhookStatus('error');
    }
    setTimeout(() => setWebhookStatus('idle'), 4000);
  }

  const noFilter = !filterDateFrom && !filterDateTo;
  const shortcuts = [
    { key: 'todos' as const,     label: 'Todos' },
    { key: 'mes' as const,       label: 'Este mês' },
    { key: 'anterior' as const,  label: 'Mês anterior' },
    { key: 'trimestre' as const, label: 'Trimestre' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm px-4 sm:px-6 py-4 sticky top-0 z-20">
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={onSidebarToggle} className="lg:hidden p-1.5 text-slate-500 hover:text-slate-800">
            <Menu size={20} />
          </button>

          {/* Título */}
          <div className="flex items-center gap-2 mr-2">
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
              <Wifi size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-800 leading-tight">Erro na Rede</h1>
              <p className="text-[10px] text-slate-400">Monitor de falhas</p>
            </div>
          </div>

          {/* Seções */}
          <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5">
            {(['overview', 'registros'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSection(s)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  section === s
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {s === 'overview' ? 'Visão Geral' : 'Registros'}
              </button>
            ))}
          </div>

          {/* Atalhos de data */}
          <div className="flex items-center gap-1.5 ml-auto flex-wrap">
            {shortcuts.map(s => {
              const isActive = s.key === 'todos' ? noFilter : false;
              return (
                <button
                  key={s.key}
                  onClick={() => applyShortcut(s.key)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-red-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
            <div className="flex items-center gap-1.5 ml-1">
              <Calendar size={13} className="text-slate-400" />
              <input
                type="date"
                value={filterDateFrom}
                onChange={e => setFilterDateFrom(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-500/30 bg-white w-32"
              />
              <span className="text-slate-400 text-xs">→</span>
              <input
                type="date"
                value={filterDateTo}
                onChange={e => setFilterDateTo(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-500/30 bg-white w-32"
              />
              {!noFilter && (
                <button
                  onClick={() => applyShortcut('todos')}
                  className="p-1.5 rounded-lg bg-slate-100 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <X size={13} />
                </button>
              )}
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 p-4 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin text-red-400" />
          </div>
        ) : section === 'overview' ? (
          <OverviewSection
            data={data}
            onIniciar={handleIniciarVerificacao}
            loading={loading}
            webhookStatus={webhookStatus}
          />
        ) : (
          <RegistrosSection data={data} />
        )}
      </div>
    </div>
  );
}
