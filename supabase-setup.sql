-- ============================================================
-- PETSLIFE DEMANDAS — SQL SUPABASE
-- Execute este SQL no SQL Editor do seu projeto Supabase
-- Acesse: supabase.com → seu projeto → SQL Editor → New Query
-- ============================================================

-- 1. Cria a tabela principal
CREATE TABLE demandas (
  id           BIGSERIAL PRIMARY KEY,
  protocolo    TEXT NOT NULL UNIQUE,
  nome         TEXT NOT NULL,
  email        TEXT NOT NULL,
  whatsapp     TEXT,
  setor        TEXT NOT NULL,
  estados      JSONB,                -- array de strings: ['RS','SP']
  tipo         TEXT NOT NULL,
  titulo       TEXT NOT NULL,
  descricao    TEXT NOT NULL,
  formato      TEXT,
  prazo        DATE NOT NULL,
  prioridade   TEXT NOT NULL,
  observacoes  TEXT,
  status       TEXT NOT NULL DEFAULT 'Novo',
  entrega      JSONB,                -- dados de conclusão
  link_arquivo TEXT,
  comentarios  JSONB DEFAULT '[]',   -- array de comentários internos
  criado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Trigger para atualizar atualizado_em automaticamente
CREATE OR REPLACE FUNCTION atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizado_em
  BEFORE UPDATE ON demandas
  FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

-- 3. Índices para performance
CREATE INDEX idx_demandas_status    ON demandas(status);
CREATE INDEX idx_demandas_protocolo ON demandas(protocolo);
CREATE INDEX idx_demandas_criado_em ON demandas(criado_em DESC);
CREATE INDEX idx_demandas_setor     ON demandas(setor);

-- 4. Row Level Security (RLS)
ALTER TABLE demandas ENABLE ROW LEVEL SECURITY;

-- Política: usuários autenticados (time de marketing) veem tudo
CREATE POLICY "Autenticados podem ver tudo"
  ON demandas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Autenticados podem atualizar"
  ON demandas FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Autenticados podem deletar"
  ON demandas FOR DELETE
  TO authenticated
  USING (true);

-- Política: anônimos só podem inserir (formulário público) e consultar por protocolo
CREATE POLICY "Anônimos podem inserir"
  ON demandas FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anônimos podem consultar por protocolo"
  ON demandas FOR SELECT
  TO anon
  USING (true);  -- O filtro por protocolo é feito na query da página de acompanhamento

-- 5. Realtime — habilita para o painel receber atualizações ao vivo
ALTER PUBLICATION supabase_realtime ADD TABLE demandas;

-- ============================================================
-- PRONTO! Agora crie um usuário para o time de marketing:
-- Supabase → Authentication → Users → Add user
-- ============================================================
