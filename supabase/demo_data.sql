-- =====================================================
-- DADOS DE DEMONSTRAÇÃO - Sistema de Advocacia
-- Execute no SQL Editor do Supabase
-- =====================================================

-- Clientes fictícios
INSERT INTO public.clients (name, cpf_cnpj, phone, email, address, notes, created_by)
SELECT
  nome, cpf, telefone, email, endereco, obs,
  (SELECT id FROM auth.users LIMIT 1)
FROM (VALUES
  ('João Carlos Oliveira',  '123.456.789-01', '31991234567', 'joao.oliveira@email.com',   'Rua das Flores, 123 - BH/MG',    'Cliente desde 2023. Reclamação trabalhista.'),
  ('Maria Fernanda Silva',  '234.567.890-12', '31992345678', 'maria.silva@email.com',     'Av. Afonso Pena, 456 - BH/MG',   'Processo de divórcio em andamento.'),
  ('Empresa Tech Ltda',     '12.345.678/0001-90', '3132345678', 'contato@techltda.com',  'Rua Sergipe, 789 - BH/MG',       'Contrato de prestação de serviços.'),
  ('Carlos Eduardo Santos', '345.678.901-23', '31993456789', 'carlos.santos@email.com',  'Rua Bahia, 321 - BH/MG',         'Ação de indenização por acidente.'),
  ('Ana Paula Rodrigues',   '456.789.012-34', '31994567890', 'ana.rodrigues@email.com',  'Rua Pernambuco, 654 - BH/MG',    'Herança e inventário.')
) AS t(nome, cpf, telefone, email, endereco, obs);

-- Processos fictícios
WITH client_ids AS (
  SELECT id, name FROM public.clients ORDER BY created_at LIMIT 5
),
user_id AS (SELECT id FROM auth.users LIMIT 1)
INSERT INTO public.processes (number, client_id, area, phase, lawyer_id, status, description)
SELECT
  numero, c.id, area, fase,
  (SELECT id FROM user_id),
  status, descricao
FROM (VALUES
  ('0001234-56.2024.5.03.0001', 1, 'Trabalhista',    'Instrução',         'ativo',    'Reclamação trabalhista por horas extras não pagas.'),
  ('0002345-67.2024.8.13.0024', 2, 'Família',        'Conciliação',       'ativo',    'Ação de divórcio consensual com partilha de bens.'),
  ('0003456-78.2024.8.13.0045', 3, 'Empresarial',    'Execução',          'ativo',    'Cobrança de contrato de prestação de serviços.'),
  ('0004567-89.2023.8.13.0012', 4, 'Civil',          'Sentença',          'encerrado','Ação de indenização por danos morais. Ganha.'),
  ('0005678-90.2024.8.13.0089', 5, 'Outros',         'Abertura',          'ativo',    'Inventário e partilha de herança.')
) AS t(numero, ord, area, fase, status, descricao)
JOIN (SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn FROM public.clients LIMIT 5) c ON c.rn = t.ord;

-- Eventos na agenda
WITH user_id AS (SELECT id FROM auth.users LIMIT 1),
client_ids AS (SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn FROM public.clients LIMIT 3)
INSERT INTO public.events (title, type, date, time, user_id, client_id, alert_days, completed)
SELECT titulo, tipo, data::date, hora::time, (SELECT id FROM user_id), c.id, alerta, concluido
FROM (VALUES
  ('Audiência trabalhista - João Oliveira',  'audiencia',   (CURRENT_DATE + 5)::text,   '09:00', 1, 2, false),
  ('Prazo contestação - Tech Ltda',          'prazo',       (CURRENT_DATE + 2)::text,   '17:00', 3, 3, false),
  ('Reunião com Maria Silva',                'reuniao',     (CURRENT_DATE + 1)::text,   '14:30', 2, 1, false),
  ('Protocolo petição - Ana Rodrigues',      'prazo',       (CURRENT_DATE + 10)::text,  '18:00', 5, 2, false),
  ('Audiência de conciliação - Família',     'audiencia',   (CURRENT_DATE + 15)::text,  '10:00', 2, 1, false)
) AS t(titulo, tipo, data, hora, client_ord, alerta, concluido)
LEFT JOIN client_ids c ON c.rn = t.client_ord;

-- Registros financeiros
WITH user_id AS (SELECT id FROM auth.users LIMIT 1)
INSERT INTO public.financial_records (description, type, amount, status, due_date, paid_date, created_by)
VALUES
  ('Honorários - João Oliveira (trabalhista)',  'honorario',   3500.00, 'pago',     (CURRENT_DATE - 20)::date, (CURRENT_DATE - 20)::date, (SELECT id FROM user_id)),
  ('Honorários - Maria Silva (divórcio)',       'honorario',   4200.00, 'pago',     (CURRENT_DATE - 45)::date, (CURRENT_DATE - 45)::date, (SELECT id FROM user_id)),
  ('Honorários - Tech Ltda (contrato)',         'honorario',   6000.00, 'pendente', (CURRENT_DATE + 10)::date, NULL,                      (SELECT id FROM user_id)),
  ('Custas processuais - Inventário',           'despesa',      850.00, 'pago',     (CURRENT_DATE - 10)::date, (CURRENT_DATE - 10)::date, (SELECT id FROM user_id)),
  ('Honorários - Carlos Santos (indenização)', 'honorario',   2800.00, 'atrasado', (CURRENT_DATE - 15)::date, NULL,                      (SELECT id FROM user_id)),
  ('Honorários - Ana Rodrigues (inventário)',   'honorario',   5500.00, 'pendente', (CURRENT_DATE + 20)::date, NULL,                      (SELECT id FROM user_id)),
  ('Honorários - João Oliveira (mês anterior)','honorario',   3500.00, 'pago',     (CURRENT_DATE - 50)::date, (CURRENT_DATE - 50)::date, (SELECT id FROM user_id));
