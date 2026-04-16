import { createContext, useContext } from 'react';

export interface CurrentUser {
  id: number;
  nome: string;
  email: string;
  role: 'admin' | 'user';
  permissao: 'view' | 'edit';
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export const AuthContext = createContext<CurrentUser | null>(null);
export const useAuth = () => useContext(AuthContext);
