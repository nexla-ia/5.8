/*
  # Atualizar políticas RLS para permitir acesso anônimo

  1. Alterações
    - Remove políticas existentes que exigem autenticação
    - Adiciona política de leitura para usuários anônimos
    - Mantém restrições para insert/update/delete
  
  2. Segurança
    - Permite SELECT para role 'anon' (leitura pública)
    - INSERT/UPDATE/DELETE continuam restritos a usuários autenticados
*/

-- Remove políticas antigas
DROP POLICY IF EXISTS "Permitir leitura para usuários autenticados" ON "5.8-analises";
DROP POLICY IF EXISTS "Permitir inserção para usuários autenticados" ON "5.8-analises";
DROP POLICY IF EXISTS "Permitir atualização para usuários autenticados" ON "5.8-analises";
DROP POLICY IF EXISTS "Permitir deleção para usuários autenticados" ON "5.8-analises";

-- Cria nova política permitindo leitura para todos (anon + authenticated)
CREATE POLICY "Permitir leitura pública"
  ON "5.8-analises"
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Mantém restrições para modificações (apenas autenticados)
CREATE POLICY "Permitir inserção para autenticados"
  ON "5.8-analises"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Permitir atualização para autenticados"
  ON "5.8-analises"
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir exclusão para autenticados"
  ON "5.8-analises"
  FOR DELETE
  TO authenticated
  USING (true);
