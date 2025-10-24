import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SerpApiService } from "@/services/serpApiService";

export const KeywordDomainPositionChecker: React.FC = () => {
  const [keyword, setKeyword] = useState("");
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | {
    position: number | null;
    url: string | null;
    error?: string;
  }>(null);

  const handleCheckPosition = async () => {
    setLoading(true);
    setResult(null);

    try {
      const data = await SerpApiService.checkKeywordPosition(keyword, domain);

      if (typeof data.position === "number") {
        setResult({
          position: data.position,
          url: data.url,
        });
      } else {
        setResult({
          position: null,
          url: null,
          error: "Domínio não está nos resultados do Google para essa palavra-chave.",
        });
      }
    } catch (error: any) {
      setResult({
        position: null,
        url: null,
        error: error?.message || "Erro ao consultar posição.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consultar posição de domínio na palavra-chave</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <Input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="Palavra-chave"
            disabled={loading}
          />
          <Input
            value={domain}
            onChange={e => setDomain(e.target.value)}
            placeholder="Domínio (ex: meusite.com.br)"
            disabled={loading}
          />
          <Button onClick={handleCheckPosition} disabled={!keyword || !domain || loading}>
            {loading ? "Consultando..." : "Consultar"}
          </Button>
        </div>
        {result && (
          <div style={{ marginTop: 16 }}>
            {result.error && (
              <Alert variant="destructive">
                <AlertDescription>{result.error}</AlertDescription>
              </Alert>
            )}
            {!result.error && (
              <div>
                <strong>Posição:</strong>{" "}
                {result.position !== null
                  ? `#${result.position + 1}`
                  : "Não encontrada"}<br />
                {result.url && (
                  <>
                    <strong>URL:</strong> <a href={result.url} target="_blank" rel="noopener noreferrer">{result.url}</a>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
