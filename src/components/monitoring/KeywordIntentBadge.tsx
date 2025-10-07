import { Info, ShoppingCart, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface KeywordIntentBadgeProps {
  keyword: string;
}

type KeywordIntent = 'informational' | 'commercial' | 'transactional';

const getKeywordIntent = (keyword: string): KeywordIntent => {
  const lower = keyword.toLowerCase();
  
  // Palavras transacionais (compra)
  const transactionalWords = [
    'comprar', 'preço', 'barato', 'desconto', 'onde comprar', 
    'oferta', 'promoção', 'cupom', 'valor', 'custo',
    'vender', 'contratar', 'assinar', 'adquirir'
  ];
  
  // Palavras comerciais (pesquisa antes da compra)
  const commercialWords = [
    'melhor', 'comparação', 'review', 'avaliação', 'vs',
    'top', 'ranking', 'análise', 'opinião', 'teste',
    'recomendação', 'qual', 'escolher'
  ];
  
  if (transactionalWords.some(word => lower.includes(word))) {
    return 'transactional';
  }
  
  if (commercialWords.some(word => lower.includes(word))) {
    return 'commercial';
  }
  
  return 'informational';
};

const intentConfig: Record<KeywordIntent, {
  icon: typeof Info;
  color: string;
  label: string;
  description: string;
}> = {
  informational: {
    icon: Info,
    color: "text-blue-500",
    label: "Informacional",
    description: "Usuário busca informação ou conhecimento"
  },
  commercial: {
    icon: ShoppingCart,
    color: "text-amber-500",
    label: "Comercial",
    description: "Usuário pesquisa antes de comprar"
  },
  transactional: {
    icon: CreditCard,
    color: "text-green-500",
    label: "Transacional",
    description: "Usuário pronto para comprar/converter"
  }
};

export const KeywordIntentBadge = ({ keyword }: KeywordIntentBadgeProps) => {
  const intent = getKeywordIntent(keyword);
  const config = intentConfig[intent];
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-center">
            <Icon className={`h-4 w-4 ${config.color}`} />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-semibold">{config.label}</p>
            <p className="text-muted-foreground">{config.description}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
