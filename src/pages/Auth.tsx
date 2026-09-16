import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, Loader2, UserX } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(
  returnTo: string | null,
  fallback = "/dashboard",
) {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth,
  );
  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);
  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      setStep({ email: formData.get("email") as string });
      setIsLoading(false);
    } catch (error) {
      console.error("Email sign-in error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo enviar el código. Inténtalo de nuevo.",
      );
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);

      navigate(redirect);
    } catch (error) {
      console.error("OTP verification error:", error);

      setError("El código introducido no es correcto.");
      setIsLoading(false);

      setOtp("");
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("anonymous");
      navigate(redirect);
    } catch (error) {
      console.error("Guest login error:", error);
      setError(
        `No se pudo entrar como invitado: ${error instanceof Error ? error.message : "error desconocido"}`,
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Minimal header */}
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex size-6 items-center justify-center rounded-full border border-foreground/40">
              <span className="size-2 rounded-full bg-foreground/70" />
            </span>
            <span className="text-sm font-medium tracking-[0.22em] uppercase">
              Minimal Lunar Design
            </span>
          </Link>
          <Link
            to="/"
            className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Volver al inicio
          </Link>
        </div>
      </header>

      {/* Auth content */}
      <div className="flex flex-1 items-center justify-center px-5 py-16">
        <Card className="w-full max-w-sm rounded-sm border-border/70 pb-0 shadow-none">
          {step === "signIn" ? (
            <>
              <CardHeader className="text-center">
                <div className="mb-2 flex justify-center">
                  <span className="flex size-10 items-center justify-center rounded-full border border-border">
                    <span className="size-3 rounded-full bg-foreground/80" />
                  </span>
                </div>
                <CardTitle className="text-lg font-light tracking-tight">
                  Entra al estudio
                </CardTitle>
                <CardDescription className="text-[13px]">
                  Un año de luz de luna te espera. Inicia sesión o crea tu
                  cuenta.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleEmailSubmit}>
                <CardContent>
                  <Input
                    name="email"
                    placeholder="name@example.com"
                    type="email"
                    className="h-10 rounded-sm border-border bg-transparent"
                    disabled={isLoading}
                    required
                  />
                  {error && (
                    <p className="mt-2 text-[12px] text-destructive">{error}</p>
                  )}

                  <div className="mt-5">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border/70" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-card px-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                          o
                        </span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4 w-full rounded-sm border-border"
                      onClick={handleGuestLogin}
                      disabled={isLoading}
                    >
                      <UserX className="mr-2 size-4" />
                      Entrar como invitado
                    </Button>
                  </div>
                </CardContent>
                <CardContent className="pb-6">
                  <Button
                    type="submit"
                    className="h-10 w-full rounded-sm"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="ml-2 size-4" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </form>
            </>
          ) : (
            <>
              <CardHeader className="mt-4 text-center">
                <CardTitle className="text-lg font-light tracking-tight">
                  Revisa tu correo
                </CardTitle>
                <CardDescription className="text-[13px]">
                  Te hemos enviado un código de seis dígitos a {step.email}
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleOtpSubmit}>
                <CardContent className="pb-4">
                  <input type="hidden" name="email" value={step.email} />
                  <input type="hidden" name="code" value={otp} />

                  <div className="flex justify-center">
                    <InputOTP
                      value={otp}
                      onChange={setOtp}
                      maxLength={6}
                      disabled={isLoading}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          otp.length === 6 &&
                          !isLoading
                        ) {
                          const form = (e.target as HTMLElement).closest(
                            "form",
                          );
                          if (form) {
                            form.requestSubmit();
                          }
                        }
                      }}
                    >
                      <InputOTPGroup>
                        {Array.from({ length: 6 }).map((_, index) => (
                          <InputOTPSlot key={index} index={index} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  {error && (
                    <p className="mt-2 text-center text-[12px] text-destructive">
                      {error}
                    </p>
                  )}
                  <p className="mt-4 text-center text-[12px] text-muted-foreground">
                    ¿No te ha llegado el código?{" "}
                    <Button
                      variant="link"
                      className="h-auto p-0 text-[12px]"
                      onClick={() => setStep("signIn")}
                    >
                      Inténtalo de nuevo
                    </Button>
                  </p>
                </CardContent>
                <CardFooter className="flex-col gap-2">
                  <Button
                    type="submit"
                    className="h-10 w-full rounded-sm"
                    disabled={isLoading || otp.length !== 6}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Verificando…
                      </>
                    ) : (
                      <>
                        Verify code
                        <ArrowRight className="ml-2 size-4" />
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep("signIn")}
                    disabled={isLoading}
                    className="w-full text-muted-foreground"
                  >
                    Usar otro correo
                  </Button>
                </CardFooter>
              </form>
            </>
          )}

          <div className="rounded-b-lg border-t border-border/70 bg-muted/40 px-6 py-4 text-center text-[11px] text-muted-foreground">
            Secured by{" "}
            <a
              href="https://freebuff.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 transition-colors hover:text-foreground"
            >
              freebuff.com
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}
