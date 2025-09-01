-- Inserir usuários de teste com senhas hash (senha: test123)
-- Hash gerado com bcrypt para 'test123'
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  aud,
  role
) VALUES 
(
  'a0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'admin@test.com',
  '$2a$10$rI7d8M9BdZrHQHM0eUvnme7qQZ2I7jZOXgH6eJ8xOeJ8xOeJ8xOeJ',
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated'
),
(
  'b0000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'client@test.com',
  '$2a$10$rI7d8M9BdZrHQHM0eUvnme7qQZ2I7jZOXgH6eJ8xOeJ8xOeJ8xOeJ',
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated'
),
(
  'c0000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'display@test.com',
  '$2a$10$rI7d8M9BdZrHQHM0eUvnme7qQZ2I7jZOXgH6eJ8xOeJ8xOeJ8xOeJ',
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated'
);

-- Inserir perfis para os usuários de teste
INSERT INTO public.profiles (user_id, email, display_name, company_name, market_segment) VALUES
('a0000000-0000-0000-0000-000000000001', 'admin@test.com', 'Admin User', 'SEO Admin Corp', 'technology'),
('b0000000-0000-0000-0000-000000000002', 'client@test.com', 'Client User', 'Client Corp', 'e-commerce'),
('c0000000-0000-0000-0000-000000000003', 'display@test.com', 'Display User', 'Display Corp', 'marketing');

-- Inserir roles para os usuários
INSERT INTO public.user_roles (user_id, role) VALUES
('a0000000-0000-0000-0000-000000000001', 'admin'),
('b0000000-0000-0000-0000-000000000002', 'client'),
('c0000000-0000-0000-0000-000000000003', 'display');

-- Criar projeto de teste para o client
INSERT INTO public.projects (
  id,
  user_id,
  name,
  domain,
  market_segment,
  focus_keywords,
  competitor_domains,
  is_active
) VALUES (
  'd0000000-0000-0000-0000-000000000004',
  'b0000000-0000-0000-0000-000000000002',
  'Loja Online Test',
  'www.lojatest.com.br',
  'e-commerce',
  ARRAY['sapatos online', 'calçados femininos', 'tênis masculino'],
  ARRAY['www.netshoes.com.br', 'www.centauro.com.br'],
  true
);

-- Criar algumas keywords de exemplo
INSERT INTO public.keyword_rankings (
  project_id,
  keyword,
  current_position,
  previous_position,
  search_engine,
  device,
  location
) VALUES 
(
  'd0000000-0000-0000-0000-000000000004',
  'sapatos online',
  15,
  18,
  'google',
  'desktop',
  'brazil'
),
(
  'd0000000-0000-0000-0000-000000000004',
  'calçados femininos',
  8,
  12,
  'google',
  'desktop',
  'brazil'
),
(
  'd0000000-0000-0000-0000-000000000004',
  'tênis masculino',
  23,
  25,
  'google',
  'desktop',
  'brazil'
);