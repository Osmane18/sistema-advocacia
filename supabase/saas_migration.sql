-- =====================================================
-- MIGRAÇÃO SaaS - Sistema de Advocacia
-- Execute no SQL Editor do Supabase
-- =====================================================

-- Adicionar colunas SaaS na tabela user_profiles
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'recusado')),
  ADD COLUMN IF NOT EXISTS data_aprovacao TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS data_expiracao TIMESTAMPTZ;

-- Aprovar usuário admin existente (osmane) com 1 ano de acesso
UPDATE public.user_profiles
SET status = 'aprovado',
    is_admin = TRUE,
    data_aprovacao = NOW(),
    data_expiracao = NOW() + INTERVAL '365 days'
WHERE id = (SELECT id FROM auth.users WHERE email = 'osmane.silvamarques@gmail.com');

-- Adicionar coluna is_admin se não existir
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Confirmar admin
UPDATE public.user_profiles
SET is_admin = TRUE, status = 'aprovado', data_expiracao = NOW() + INTERVAL '365 days'
WHERE id = (SELECT id FROM auth.users WHERE email = 'osmane.silvamarques@gmail.com');

-- Atualizar trigger para incluir whatsapp dos metadados
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, role, whatsapp, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'advogado',
    COALESCE(NEW.raw_user_meta_data->>'whatsapp', ''),
    'pendente'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
