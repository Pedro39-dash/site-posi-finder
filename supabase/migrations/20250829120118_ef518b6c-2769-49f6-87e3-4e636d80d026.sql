-- Step 1: Clean up existing duplicate and irrelevant keywords
DELETE FROM audit_keywords 
WHERE keyword IN (
  'copyright renove inox desenvolvido',
  'agora ou whats app',
  'todos os direitos reservados',
  'desenvolvido por',
  'whats app',
  'copyright',
  'todos direitos',
  'direitos reservados',
  'reservados desenvolvido',
  'desenvolvido',
  'direitos',
  'reservados',
  'whatsapp',
  'javascript',
  'copyright renove',
  'renove inox desenvolvido',
  'inox desenvolvido por',
  'por todos',
  'todos os',
  'os direitos',
  'agora ou',
  'ou whats',
  'whats',
  'app',
  'contato comercial técnicos'
);

-- Step 2: Remove keywords that are too long (over 50 characters)
DELETE FROM audit_keywords 
WHERE LENGTH(keyword) > 50;

-- Step 3: Remove keywords that are just numbers or contain only common words
DELETE FROM audit_keywords 
WHERE keyword ~ '^[0-9]+$'
   OR keyword IN ('para', 'com', 'por', 'são', 'uma', 'mais', 'sua', 'seus', 'das', 'dos', 'nos', 'nas', 'pela', 'pelo');

-- Step 4: Keep only the highest scoring duplicate keywords
DELETE FROM audit_keywords 
WHERE id NOT IN (
  SELECT DISTINCT ON (keyword, audit_report_id) id
  FROM audit_keywords 
  ORDER BY keyword, audit_report_id, relevance_score DESC
);

-- Step 5: Add unique constraint to prevent future duplicates
ALTER TABLE audit_keywords 
ADD CONSTRAINT unique_keyword_per_audit UNIQUE (audit_report_id, keyword);

-- Step 6: Update relevance scores to be more meaningful
UPDATE audit_keywords 
SET relevance_score = CASE 
  -- Commercial terms get higher scores
  WHEN keyword ~* '(inox|polimento|escovamento|tratamento|serviços|empresa|técnicos|comercial)' THEN relevance_score + 50
  -- Service-related terms get medium scores  
  WHEN keyword ~* '(manutenção|máquinas|equipamentos|industrial|qualidade)' THEN relevance_score + 30
  -- Short meaningful terms get bonus
  WHEN LENGTH(keyword) BETWEEN 4 AND 15 AND keyword !~* '(para|com|por|uma|mais)' THEN relevance_score + 20
  -- Very specific/relevant compound terms
  WHEN keyword ~* '(polimento.*elevadores|escovamento.*inox|tratamento.*inox)' THEN relevance_score + 100
  ELSE relevance_score
END;

-- Step 7: Remove low-quality keywords (score < 10)
DELETE FROM audit_keywords 
WHERE relevance_score < 10;