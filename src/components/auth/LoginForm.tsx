import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { ForgotPasswordModal } from "./ForgotPasswordModal";

const authSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type AuthFormData = z.infer<typeof authSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { login, signUp, isLoading } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
  });

  const onSubmit = async (data: AuthFormData) => {
    const result = mode === 'login' 
      ? await login(data.email, data.password)
      : await signUp(data.email, data.password);

    if (!result.error) {
      onSuccess?.();
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    reset();
  };

  return (
    <Card className="w-full bg-[#151D1E]">
      <CardHeader>
        <CardTitle className="text-2xl text-center">
          {mode === 'login' ? 'Fazer Login' : 'Criar Conta'}
        </CardTitle>
        <p className="text-center text-muted-foreground">
          {mode === 'login' 
            ? 'Entre com seu email e senha' 
            : 'Crie sua conta para começar'
          }
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="seu.email@exemplo.com"
              className="bg-zinc-50 placeholder:text-zinc-950 text-zinc-950"
              {...register("email")}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Senha
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Digite sua senha"
                className="bg-zinc-50 placeholder:text-zinc-950"
                {...register("password")}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          {mode === 'login' && (
            <div className="text-right">
              <Button
                type="button"
                variant="link"
                className="px-0 text-sm text-muted-foreground hover:text-primary"
                onClick={() => setShowForgotPassword(true)}
              >
                Esqueci minha senha
              </Button>
            </div>
          )}

          <Button type="submit" className="w-full bg-[#22E8F7]" disabled={isLoading}>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-r-transparent" />
                {mode === 'login' ? 'Entrando...' : 'Criando conta...'}
              </div>
            ) : (
              mode === 'login' ? 'Entrar' : 'Criar Conta'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            {mode === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?'}
          </p>
          <Button 
            variant="link" 
            onClick={switchMode}
            disabled={isLoading}
            className="mt-1"
          >
            {mode === 'login' ? 'Criar nova conta' : 'Fazer login'}
          </Button>
        </div>

        {mode === 'signup' && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground text-center">
              Ao criar uma conta, você receberá um email de confirmação. Verifique sua caixa de entrada.
            </p>
          </div>
        )}

        <ForgotPasswordModal 
          open={showForgotPassword} 
          onOpenChange={setShowForgotPassword} 
        />
      </CardContent>
    </Card>
  );
};