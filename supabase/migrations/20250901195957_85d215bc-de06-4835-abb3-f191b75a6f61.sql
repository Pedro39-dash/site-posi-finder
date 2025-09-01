-- Limpar dados de teste anteriores se existirem
DELETE FROM public.user_roles WHERE user_id IN (
  'a0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000002', 
  'c0000000-0000-0000-0000-000000000003'
);

DELETE FROM public.profiles WHERE user_id IN (
  'a0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000002',
  'c0000000-0000-0000-0000-000000000003'
);

-- Inserir perfis para usuários existentes (se houverem)
INSERT INTO public.profiles (user_id, email, display_name, company_name, market_segment) 
SELECT 
  u.id,
  u.email,
  CASE 
    WHEN u.email = 'admin@test.com' THEN 'Admin User'
    WHEN u.email = 'client@test.com' THEN 'Client User'  
    WHEN u.email = 'display@test.com' THEN 'Display User'
    ELSE 'Test User'
  END,
  CASE 
    WHEN u.email = 'admin@test.com' THEN 'SEO Admin Corp'
    WHEN u.email = 'client@test.com' THEN 'Client Corp'
    WHEN u.email = 'display@test.com' THEN 'Display Corp'
    ELSE 'Test Corp'
  END,
  CASE 
    WHEN u.email = 'admin@test.com' THEN 'technology'
    WHEN u.email = 'client@test.com' THEN 'e-commerce'
    WHEN u.email = 'display@test.com' THEN 'marketing'
    ELSE 'general'
  END
FROM auth.users u
WHERE u.email IN ('admin@test.com', 'client@test.com', 'display@test.com')
ON CONFLICT (user_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  company_name = EXCLUDED.company_name,
  market_segment = EXCLUDED.market_segment;

-- Inserir roles para usuários existentes
INSERT INTO public.user_roles (user_id, role)
SELECT 
  u.id,
  CASE 
    WHEN u.email = 'admin@test.com' THEN 'admin'::user_role
    WHEN u.email = 'client@test.com' THEN 'client'::user_role
    WHEN u.email = 'display@test.com' THEN 'display'::user_role
    ELSE 'client'::user_role
  END
FROM auth.users u
WHERE u.email IN ('admin@test.com', 'client@test.com', 'display@test.com')
ON CONFLICT (user_id, role) DO NOTHING;

-- Habilitar realtime para notificações
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.notifications;

-- Habilitar realtime para keyword rankings (para alertas de mudança de posição)
ALTER TABLE public.keyword_rankings REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.keyword_rankings;