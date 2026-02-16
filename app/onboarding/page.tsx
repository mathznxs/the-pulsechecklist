import { getLojas } from "@/lib/actions/onboarding"
import { OnboardingForm } from "@/components/pulso/onboarding-form"

export default async function OnboardingPage() {
  const lojas = await getLojas()

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 text-primary-foreground"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-foreground">
              CENTAURO <span className="text-primary">PULSO</span>
            </span>
          </div>
          <h1 className="text-lg font-semibold text-foreground">
            Complete seu cadastro
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Preencha seus dados para acessar o sistema
          </p>
        </div>

        <OnboardingForm lojas={lojas} />

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Centauro Pulso - Acesso restrito a colaboradores
        </p>
      </div>
    </div>
  )
}
