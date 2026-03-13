import { Clock } from 'lucide-react';

interface ComingSoonProps {
  title: string;
  description: string;
  color: 'purple' | 'green' | 'red';
}

const colorMap = {
  purple: { bg: 'from-purple-500/10 to-pink-500/10', border: 'border-purple-500/20', icon: 'text-purple-400', text: 'text-purple-300' },
  green: { bg: 'from-green-500/10 to-emerald-500/10', border: 'border-green-500/20', icon: 'text-green-400', text: 'text-green-300' },
  red: { bg: 'from-red-500/10 to-orange-500/10', border: 'border-red-500/20', icon: 'text-red-400', text: 'text-red-300' },
};

export default function ComingSoon({ title, description, color }: ComingSoonProps) {
  const c = colorMap[color];
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className={`bg-gradient-to-br ${c.bg} border ${c.border} rounded-2xl p-12 max-w-md w-full text-center`}>
        <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Clock size={32} className={c.icon} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
        <div className={`mt-6 inline-block text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-800 ${c.text}`}>
          Em desenvolvimento
        </div>
      </div>
    </div>
  );
}