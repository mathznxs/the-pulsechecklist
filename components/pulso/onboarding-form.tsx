"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertCircle, Loader2 } from "lucide-react"
import { completeOnboarding } from "@/lib/actions/onboarding"

const SETORES = [
  "Masculino",
  "Feminino",
  "Anfitriao",
  "Categorias",
  "Futebol",
  "OMS",
  "Caixa",
  "Provador",
  "Geral",
]

interface OnboardingFormProps {
  lojas: { id: string; numero_loja: string; nome: string }[]
}

export function OnboardingForm({ lojas }: OnboardingFormProps) {
  const [matricula, setMatricula] = useState("")
  const [nome, setNome] = useState("")
  const [cargo, setCargo] = useState<"assistente" | "supervisão" | "gerente">(
    "assistente"
  )
  const [setorBase, setSetorBase] = useState<string>("")
  const [lojaNumero, setLojaNumero] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!matricula.trim()) {
      setError("Informe sua matricula.")
      setLoading(false)
      return
    }

    if (!nome.trim()) {
      setError("Informe seu nome.")
      setLoading(false)
      return
    }

    if (!lojaNumero) {
      setError("Selecione sua loja.")
      setLoading(false)
      return
    }

    const result = await completeOnboarding({
      matricula: matricula.trim(),
      nome: nome.trim(),
      cargo,
      setor_base: setorBase || null,
      loja_numero: lojaNumero,
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.push("/")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="nome">Nome completo</Label>
        <Input
          id="nome"
          type="text"
          placeholder="Seu nome completo"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="matricula">Matricula</Label>
        <Input
          id="matricula"
          type="text"
          inputMode="numeric"
          placeholder="Ex: 10234"
          value={matricula}
          onChange={(e) => setMatricula(e.target.value.replace(/\D/g, ""))}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="loja">Loja</Label>
        <Select value={lojaNumero} onValueChange={setLojaNumero}>
          <SelectTrigger id="loja">
            <SelectValue placeholder="Selecione sua loja" />
          </SelectTrigger>
          <SelectContent>
            {lojas.map((l) => (
              <SelectItem key={l.id} value={l.numero_loja}>
                {l.nome} ({l.numero_loja})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="cargo">Cargo</Label>
        <Select value={cargo} onValueChange={(v) => setCargo(v as typeof cargo)}>
          <SelectTrigger id="cargo">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="assistente">Assistente</SelectItem>
            <SelectItem value="supervisao">Supervisao</SelectItem>
            <SelectItem value="gerente">Gerente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="setor">Setor base (opcional)</Label>
        <Select value={setorBase} onValueChange={setSetorBase}>
          <SelectTrigger id="setor">
            <SelectValue placeholder="Selecione um setor" />
          </SelectTrigger>
          <SelectContent>
            {SETORES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Salvando...
          </>
        ) : (
          "Concluir cadastro"
        )}
      </Button>
    </form>
  )
}
