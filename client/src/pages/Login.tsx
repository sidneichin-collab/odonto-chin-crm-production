// @ts-nocheck
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { Loader2, Activity, AlertTriangle, Info } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);

  // Check for OAuth error in URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    if (error) {
      setOauthError(error);
      // Remove error from URL without reloading
      window.history.replaceState({}, document.title, "/login");
    }
  }, []);

  const utils = trpc.useUtils();
  
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      toast.success("¡Inicio de sesión exitoso! Redirigiendo...");
      
      // Invalidate auth cache and redirect
      await utils.auth.me.invalidate();
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    },
    onError: (error) => {
      toast.error(`Error al iniciar sesión: ${error.messageText}`);
      setIsLoading(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Por favor, completa correo electrónico y contraseña.");
      return;
    }
    
    setIsLoading(true);
    loginMutation.mutate({ email, password });
  };

  const handleGoogleLogin = () => {
    window.location.href = getLoginUrl();
  };

  const getErrorAlert = () => {
    if (!oauthError) return null;

    if (oauthError === "1043") {
      return (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error 1043: Método de Login Incorreto</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p className="font-medium">
              Este correo electrónico ya está registrado en Manus, pero estás intentando usar un método de inicio de sesión diferente.
            </p>
            <div className="text-sm space-y-1">
              <p><strong>O que fazer:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Verifique seu email "Welcome to Manus" para identificar o método usado no registro</li>
                <li>Usa el MISMO método de inicio de sesión (Google, Apple, Microsoft o Email/Contraseña)</li>
                <li>Se não lembra qual método usou, entre em contato com o suporte</li>
              </ul>
            </div>
            <p className="text-xs mt-2 text-muted-foreground">
              Os métodos de login no Manus são mutuamente exclusivos. Você só pode acessar usando o método escolhido no registro.
            </p>
          </AlertDescription>
        </Alert>
      );
    }

    if (oauthError === "1003") {
      return (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error 1003: Problema de Conexão</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p className="font-medium">
              Houve um problema ao conectar com o Google.
            </p>
            <div className="text-sm space-y-1">
              <p><strong>Possíveis soluções:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Verifique sua conexão com a internet</li>
                <li>Desabilite VPN ou proxy temporariamente</li>
                <li>Limpe cache e cookies do navegador</li>
                <li>Tente em modo anônimo ou outro navegador</li>
                <li>Verifique permissões do Google em <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="underline">myaccount.google.com/security</a></li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error no Login</AlertTitle>
        <AlertDescription>
          Ocurrió un error al intentar iniciar sesión. Por favor, intenta nuevamente o contacta al soporte.
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center">
              <Activity className="w-10 h-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Odonto Chin CRM</CardTitle>
          <CardDescription>
            Sistema de Gestión - Secretarias
          </CardDescription>
        </CardHeader>
        <CardContent>
          {getErrorAlert()}

          <Alert className="mb-4 bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-900">¿Primer Acceso?</AlertTitle>
            <AlertDescription className="text-blue-800 text-sm">
              Usa el mismo método de inicio de sesión que usaste para crear tu cuenta en Manus (Google, Apple, Microsoft o Email/Contraseña).
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </form>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">O continúa con</span>
            </div>
          </div>
          
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Iniciar sesión con Manus (Google)
          </Button>
          
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>¿No tienes acceso?</p>
            <p className="mt-1">Contacta al administrador.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
