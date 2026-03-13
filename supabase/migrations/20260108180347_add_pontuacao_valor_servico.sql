/*
  # Adicionar campos de pontuação e valor do serviço
  
  1. Alterações
    - Adicionar coluna `pontuacao_servico` (numeric) - Pontuação de qualidade do serviço (0-10)
    - Adicionar coluna `valor_servico` (numeric) - Valor monetário do serviço prestado
    
  2. Notas
    - Ambos os campos são opcionais para manter compatibilidade com dados existentes
    - Valores padrão podem ser configurados posteriormente conforme necessário
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = '5.8-analises' AND column_name = 'pontuacao_servico'
  ) THEN
    ALTER TABLE "5.8-analises" ADD COLUMN pontuacao_servico numeric;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = '5.8-analises' AND column_name = 'valor_servico'
  ) THEN
    ALTER TABLE "5.8-analises" ADD COLUMN valor_servico numeric DEFAULT 150;
  END IF;
END $$;