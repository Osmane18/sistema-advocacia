-- =====================================================
-- Sistema de Advocacia - Schema Supabase
-- =====================================================

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELA: user_profiles
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'advogado' CHECK (role IN ('admin', 'advogado')),
  oab TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: clients
-- =====================================================
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  cpf_cnpj TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- TABELA: processes
-- =====================================================
CREATE TABLE IF NOT EXISTS public.processes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  number TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  area TEXT NOT NULL DEFAULT 'Outros' CHECK (area IN ('Trabalhista', 'Civil', 'Criminal', 'Família', 'Tributário', 'Empresarial', 'Previdenciário', 'Outros')),
  phase TEXT,
  lawyer_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'encerrado', 'suspenso')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: process_updates (andamentos processuais)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.process_updates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  process_id UUID REFERENCES public.processes(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: events (agenda)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'compromisso' CHECK (type IN ('audiencia', 'prazo', 'reuniao', 'compromisso')),
  date DATE NOT NULL,
  time TIME,
  process_id UUID REFERENCES public.processes(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id),
  alert_days INTEGER DEFAULT 1,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: financial_records (registros financeiros)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.financial_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  process_id UUID REFERENCES public.processes(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'honorario' CHECK (type IN ('honorario', 'pagamento', 'despesa')),
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  due_date DATE,
  paid_date DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pago', 'pendente', 'atrasado')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: documents
-- =====================================================
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  process_id UUID REFERENCES public.processes(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- FUNÇÕES E TRIGGERS para updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger user_profiles
CREATE TRIGGER set_updated_at_user_profiles
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger clients
CREATE TRIGGER set_updated_at_clients
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger processes
CREATE TRIGGER set_updated_at_processes
  BEFORE UPDATE ON public.processes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger events
CREATE TRIGGER set_updated_at_events
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger financial_records
CREATE TRIGGER set_updated_at_financial_records
  BEFORE UPDATE ON public.financial_records
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- TRIGGER: Criar perfil automaticamente ao registrar usuário
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 'advogado');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES: user_profiles
-- =====================================================
CREATE POLICY "Usuários podem ver todos os perfis"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Inserir perfil próprio"
  ON public.user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- POLICIES: clients
-- =====================================================
CREATE POLICY "Usuários autenticados podem ver clientes"
  ON public.clients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar clientes"
  ON public.clients FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Usuários autenticados podem atualizar clientes"
  ON public.clients FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem excluir clientes"
  ON public.clients FOR DELETE
  TO authenticated
  USING (true);

-- =====================================================
-- POLICIES: processes
-- =====================================================
CREATE POLICY "Usuários autenticados podem ver processos"
  ON public.processes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar processos"
  ON public.processes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar processos"
  ON public.processes FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem excluir processos"
  ON public.processes FOR DELETE
  TO authenticated
  USING (true);

-- =====================================================
-- POLICIES: process_updates
-- =====================================================
CREATE POLICY "Usuários autenticados podem ver andamentos"
  ON public.process_updates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar andamentos"
  ON public.process_updates FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem excluir andamentos"
  ON public.process_updates FOR DELETE
  TO authenticated
  USING (true);

-- =====================================================
-- POLICIES: events
-- =====================================================
CREATE POLICY "Usuários autenticados podem ver eventos"
  ON public.events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar eventos"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar eventos"
  ON public.events FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem excluir eventos"
  ON public.events FOR DELETE
  TO authenticated
  USING (true);

-- =====================================================
-- POLICIES: financial_records
-- =====================================================
CREATE POLICY "Usuários autenticados podem ver financeiro"
  ON public.financial_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar financeiro"
  ON public.financial_records FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar financeiro"
  ON public.financial_records FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem excluir financeiro"
  ON public.financial_records FOR DELETE
  TO authenticated
  USING (true);

-- =====================================================
-- POLICIES: documents
-- =====================================================
CREATE POLICY "Usuários autenticados podem ver documentos"
  ON public.documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar documentos"
  ON public.documents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem excluir documentos"
  ON public.documents FOR DELETE
  TO authenticated
  USING (true);

-- =====================================================
-- STORAGE: Bucket documentos
-- Execute isso no Supabase Dashboard > Storage
-- ou via API após criar o bucket manualmente
-- =====================================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('documentos', 'documentos', false);

-- Storage policies (criar via Dashboard ou descomente abaixo)
-- CREATE POLICY "Usuários autenticados podem fazer upload"
--   ON storage.objects FOR INSERT
--   TO authenticated
--   WITH CHECK (bucket_id = 'documentos');

-- CREATE POLICY "Usuários autenticados podem ver arquivos"
--   ON storage.objects FOR SELECT
--   TO authenticated
--   USING (bucket_id = 'documentos');

-- CREATE POLICY "Usuários autenticados podem excluir arquivos"
--   ON storage.objects FOR DELETE
--   TO authenticated
--   USING (bucket_id = 'documentos');
