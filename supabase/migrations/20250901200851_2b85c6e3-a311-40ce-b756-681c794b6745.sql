-- Criar algumas notificações de teste para demonstrar o sistema
INSERT INTO public.notifications (
  user_id,
  title,
  message,
  type,
  priority,
  project_id,
  action_url,
  metadata,
  is_read
) 
SELECT 
  u.id,
  'Bem-vindo ao SEO Dashboard!',
  'Sistema de notificações em tempo real está ativo. Você receberá alertas sobre mudanças de ranking.',
  'success',
  'medium',
  NULL::uuid,
  '/',
  '{"welcome": true}'::jsonb,
  false
FROM auth.users u
WHERE u.email IN ('admin@test.com', 'client@test.com', 'display@test.com')

UNION ALL

SELECT 
  u.id,
  'Sistema de Alertas Ativo',
  'Monitoramento automático de mudanças de ranking configurado com sucesso.',
  'info',
  'low',
  NULL::uuid,
  '/rankings',
  '{"system_alert": true}'::jsonb,
  false
FROM auth.users u
WHERE u.email IN ('admin@test.com', 'client@test.com', 'display@test.com')

UNION ALL

-- Notificação específica para admin
SELECT 
  u.id,
  'Painel de Administração',
  'Você tem acesso completo a todas as funcionalidades administrativas.',
  'info',
  'high',
  NULL::uuid,
  '/',
  '{"admin_access": true}'::jsonb,
  false
FROM auth.users u
WHERE u.email = 'admin@test.com';