// ==================== 5.8-analises ====================
export interface Analise {
  id: number;
  validados: string | null;
  nao_validado: string | null;
  sinal_ONU: string | null;
  relato_validado: string | null;
  relato_reprovado: string | null;
  id_os: string | null;
  id_tecnico: string | null;
  nome_cliente: string | null;
  mensagem_os: string | null;
  caixaEporta: string | null;
  created_at: string;
  tecnicoprincipal: string | null;
  tecnicoauxiliar: string | null;
  pontuacao_servico?: number | null;
  valor_servico?: number | null;
  final: string | null;
}

// ==================== 5.8-cs_ixc ====================
export interface CsIxc {
  id: number;
  created_at: string;
  nome: string | null;
  cpf_cnpj: string | null;
  _id: string | null;
  id_cliente: string | null;
  id_filial: string | null;
  id_os: string | null;
  contato: string | null;
  id_mensagem: string | null;
  finalizado_ixc: string | null;
  comunicado_time: string | null;
  numero_cliente: string | null;
  mensagem_final: string | null;
  concluido_sucesso: string | null;
  avaliacao: string | null;
}

// ==================== 5.8-cs_opa ====================
export interface CsOpa {
  id: number;
  created_at: string;
  nome: string | null;
  id_cliente: string | null;
  id_atendente: string | null;
  numero_cliente: string | null;
  protocolo: string | null;
  data_inicial: string | null;
  data_final: string | null;
  'contatado?': string | null;
  os_criada: string | null;
  respondeu: string | null;
  visualizou: string | null;
}

// ==================== 5.8-erro_rede ====================
export interface ErroRede {
  id: number;
  id_cliente: string | null;
  nome: string | null;
  cnpjcpf: string | null;
  status_final_verificacao: string | null;
  aviso_final: string | null;
  created_at: string;
  rota: string | null;
  'idnumero5.8': string | null;
}

// ==================== 5.8-tecnicos_auxiliares ====================
export interface TecnicoAuxiliar {
  id: string;
  nome: string;
  nivel: 'TN0' | 'TN1' | 'TN2' | 'TN3';
}

// ==================== Stats derivados ====================
export interface TecnicoStats {
  tecnico: string;
  totalOS: number;
  pontuacaoMedia: number;
  valorTotal: number;
  pontuacaoPonderada: number;
}

export interface ClienteAlert {
  cliente: string;
  totalOS: number;
  ultimaOS: string;
  tecnicos: string[];
}

export interface RetrabalhoAlert {
  cliente: string;
  tecnico1: string;
  tecnico2: string;
  data1: string;
  data2: string;
  diasEntre: number;
  tipoServico: string;
}

export interface ProdutividadeMes {
  mes: string;
  tecnico: string;
  totalOS: number;
  valorTotal: number;
  pontuacaoMedia: number;
}

// ==================== 5.8-equipes ====================
export interface Equipe {
  id: number;
  nome: string;
  carro: string | null;
  placa: string | null;
  tecnico_principal: string;
  tecnico_auxiliar: string | null;
  ativo: boolean;
}

// ==================== 5.8-usuarios ====================
export interface Usuario {
  id: number;
  nome: string;
  email: string;
  senha_hash: string;
  role: 'admin' | 'user';
  permissao: 'view' | 'edit';
  ativo: boolean;
  created_at: string;
}

// ==================== Navegação ====================
export type AppModule = 'analises' | 'cs-ixc' | 'cs-opa' | 'erro-rede' | 'fluxos-n8n';
export type AnaliseSection = 'overview' | 'clientes' | 'produtividade' | 'ranking' | 'alertas';