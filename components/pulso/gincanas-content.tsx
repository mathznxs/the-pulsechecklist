"use client"

import { useState, useTransition, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { Challenge, ChallengeScore, Profile } from "@/lib/types"
import {
  createChallenge,
  endChallenge,
  incrementScore,
  decrementScore,
  setScore,
} from "@/lib/actions/challenges"
import { isChallengeEditable } from "@/lib/utils/challenges.utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Trophy,
  Medal,
  Award,
  Star,
  Plus,
  Loader2,
  TrendingUp,
  Minus,
  ChevronDown,
  XCircle,
  Calendar,
} from "lucide-react"

interface GincanasContentProps {
  challenges: Challenge[]
  scores: ChallengeScore[]
  profiles: Profile[]
  isLideranca: boolean
}

/* ─── Banner + Description ─── */
function ChallengeBanner({ challenge }: { challenge: Challenge }) {
  const [expanded, setExpanded] = useState(false)
  const [needsExpand, setNeedsExpand] = useState(false)
  const descRef = useRef<HTMLDivElement>(null)

  const hasDescription = !!challenge.descricao?.trim()

  useEffect(() => {
    if (descRef.current) {
      setNeedsExpand(descRef.current.scrollHeight > 80)
    }
  }, [challenge.descricao])

  const dateRange = [
    challenge.data_inicio
      ? new Date(challenge.data_inicio + "T12:00:00").toLocaleDateString("pt-BR")
      : null,
    challenge.data_fim
      ? new Date(challenge.data_fim + "T12:00:00").toLocaleDateString("pt-BR")
      : null,
  ]
    .filter(Boolean)
    .join(" - ")

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Banner header */}
      <div className="relative flex flex-col gap-1 bg-primary px-5 py-4 sm:px-6 sm:py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary-foreground/80" />
              <h2 className="text-lg font-bold text-primary-foreground sm:text-xl text-balance">
                {challenge.nome}
              </h2>
            </div>
            {dateRange && (
              <div className="flex items-center gap-1.5 text-primary-foreground/70">
                <Calendar className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">{dateRange}</span>
              </div>
            )}
          </div>
          <div className="shrink-0 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1">
            <Star className="mr-1 inline h-3.5 w-3.5 text-primary-foreground" />
            <span className="text-xs font-semibold text-primary-foreground">Ativa</span>
          </div>
        </div>
      </div>

      {/* Description area */}
      {hasDescription && (
        <div className="px-5 py-4 sm:px-6">
          <div className="relative">
            <div
              ref={descRef}
              className={`whitespace-pre-wrap text-sm leading-relaxed text-foreground transition-all duration-300 ${
                !expanded && needsExpand ? "max-h-[80px] overflow-hidden" : ""
              }`}
            >
              {challenge.descricao}
            </div>
            {/* Gradient fade */}
            {needsExpand && !expanded && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card to-transparent" />
            )}
          </div>
          {needsExpand && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="mt-2 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              {expanded ? "Mostrar menos" : "Ler mais"}
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  expanded ? "rotate-180" : ""
                }`}
              />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Podium Card ─── */
function PodiumCard({
  score,
  position,
}: {
  score: ChallengeScore
  position: 1 | 2 | 3
}) {
  const positionConfig = {
    1: {
      height: "h-32",
      bg: "bg-amber-50 border-amber-300",
      icon: Trophy,
      iconColor: "text-amber-500",
      label: "1o",
    },
    2: {
      height: "h-24",
      bg: "bg-muted border-border",
      icon: Medal,
      iconColor: "text-muted-foreground",
      label: "2o",
    },
    3: {
      height: "h-20",
      bg: "bg-amber-50/50 border-amber-200",
      icon: Award,
      iconColor: "text-amber-700",
      label: "3o",
    },
  }
  const config = positionConfig[position]
  const IconComp = config.icon

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-col items-center gap-0.5 sm:gap-1">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full border-2 sm:h-12 sm:w-12 ${config.bg}`}
        >
          <IconComp className={`h-4 w-4 sm:h-6 sm:w-6 ${config.iconColor}`} />
        </div>
        <p className="max-w-[70px] truncate text-xs font-bold text-foreground sm:max-w-none sm:text-sm">
          {score.profile?.nome ?? "N/A"}
        </p>
        <p className="hidden text-xs text-muted-foreground sm:block">
          {score.profile?.setor_base ?? ""}
        </p>
        <p className="text-sm font-bold text-foreground sm:text-lg">
          {score.pontos} pts
        </p>
      </div>
      <div
        className={`mt-1 flex w-16 items-end justify-center rounded-t-lg border-x border-t sm:mt-2 sm:w-24 ${config.bg} ${config.height}`}
      >
        <span className="pb-1 text-lg font-black text-foreground/30 sm:pb-2 sm:text-2xl">
          {config.label}
        </span>
      </div>
    </div>
  )
}

/* ─── Main Content ─── */
export function GincanasContent({
  challenges,
  scores,
  profiles,
  isLideranca,
}: GincanasContentProps) {
  const [showCreate, setShowCreate] = useState(false)
  const [showAddScore, setShowAddScore] = useState(false)
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [editingScoreId, setEditingScoreId] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const activeChallenge = challenges[0]
  const top3 = scores.slice(0, 3)
  const editable = activeChallenge ? isChallengeEditable(activeChallenge) : false

  async function handleCreate(formData: FormData) {
    setCreateError(null)
    startTransition(async () => {
      const result = await createChallenge(formData)
      if (result.error) {
        setCreateError(result.error)
        return
      }
      setShowCreate(false)
      router.refresh()
    })
  }

  async function handleEnd() {
    if (!activeChallenge) return
    startTransition(async () => {
      await endChallenge(activeChallenge.id)
      setShowEndConfirm(false)
      router.refresh()
    })
  }

  async function handleAddScore(formData: FormData) {
    if (!activeChallenge) return
    const userId = formData.get("user_id") as string
    const pontos = Number(formData.get("pontos"))
    startTransition(async () => {
      await setScore(activeChallenge.id, userId, pontos)
      setShowAddScore(false)
      router.refresh()
    })
  }

  async function handleIncrement(profileId: string) {
    if (!activeChallenge || !editable) return
    startTransition(async () => {
      await incrementScore(activeChallenge.id, profileId)
      router.refresh()
    })
  }

  async function handleDecrement(profileId: string) {
    if (!activeChallenge || !editable) return
    startTransition(async () => {
      await decrementScore(activeChallenge.id, profileId)
      router.refresh()
    })
  }

  async function handleSetScore(profileId: string, value: number) {
    if (!activeChallenge || !editable) return
    startTransition(async () => {
      await setScore(activeChallenge.id, profileId, value)
      setEditingScoreId(null)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Gincanas</h1>
          <p className="text-sm text-muted-foreground">
            {activeChallenge
              ? "Ranking individual da gincana ativa"
              : "Nenhuma gincana ativa"}
          </p>
        </div>
        {isLideranca && (
          <div className="flex flex-wrap items-center gap-2">
            {/* End challenge button */}
            {activeChallenge && editable && (
              <Dialog open={showEndConfirm} onOpenChange={setShowEndConfirm}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                    <XCircle className="mr-1.5 h-3.5 w-3.5" />
                    Encerrar Gincana
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Encerrar Gincana</DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground">
                    Tem certeza que deseja encerrar a gincana{" "}
                    <strong className="text-foreground">{activeChallenge.nome}</strong> antes do
                    prazo? Essa acao nao podera ser desfeita.
                  </p>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEndConfirm(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={isPending}
                      onClick={handleEnd}
                    >
                      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Encerrar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {/* Create challenge */}
            <Dialog open={showCreate} onOpenChange={(open) => { setShowCreate(open); if (!open) setCreateError(null) }}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Nova Gincana
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Gincana</DialogTitle>
                </DialogHeader>
                <form action={handleCreate} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="nome">Nome</Label>
                    <Input
                      id="nome"
                      name="nome"
                      required
                      placeholder="Gincana Fevereiro 2026"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="descricao">Descricao (opcional)</Label>
                    <Textarea
                      id="descricao"
                      name="descricao"
                      placeholder={"Descreva o objetivo da gincana...\nVoce pode usar varias linhas e emojis!"}
                      rows={5}
                      className="resize-y"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="data_inicio">Data inicio</Label>
                      <Input id="data_inicio" name="data_inicio" type="date" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="data_fim">Data fim</Label>
                      <Input id="data_fim" name="data_fim" type="date" />
                    </div>
                  </div>
                  {createError && (
                    <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {createError}
                    </p>
                  )}
                  <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Criar
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            {/* Add score */}
            {activeChallenge && editable && (
              <Dialog open={showAddScore} onOpenChange={setShowAddScore}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Adicionar Pontos
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Pontos</DialogTitle>
                  </DialogHeader>
                  <form action={handleAddScore} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="user_id">Funcionario</Label>
                      <select
                        id="user_id"
                        name="user_id"
                        required
                        className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground"
                      >
                        <option value="">Selecione</option>
                        {profiles
                          .filter((p) => p.ativo)
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nome} ({p.matricula})
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="pontos">Pontos</Label>
                      <Input
                        id="pontos"
                        name="pontos"
                        type="number"
                        required
                        min="0"
                      />
                    </div>
                    <Button type="submit" disabled={isPending}>
                      {isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Salvar
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}
      </div>

      {/* Challenge Banner */}
      {activeChallenge && <ChallengeBanner challenge={activeChallenge} />}

      {/* Podium */}
      {top3.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <h3 className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Podio
          </h3>
          <div className="mt-4 flex items-end justify-center gap-3 sm:mt-6 sm:gap-6">
            {top3[1] && <PodiumCard score={top3[1]} position={2} />}
            {top3[0] && <PodiumCard score={top3[0]} position={1} />}
            {top3[2] && <PodiumCard score={top3[2]} position={3} />}
          </div>
        </div>
      )}

      {/* Full Ranking */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Ranking Completo
        </h3>
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[500px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Funcionario
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Setor
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Pontuacao
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tendencia
                </th>
              </tr>
            </thead>
            <tbody className="bg-card">
              {scores.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    {activeChallenge
                      ? "Nenhuma pontuacao registrada ainda"
                      : "Crie uma gincana para comecar"}
                  </td>
                </tr>
              ) : (
                scores.map((s, idx) => {
                  const isEditing = editingScoreId === s.user_id
                  return (
                    <tr
                      key={s.id}
                      className={`border-b border-border transition-colors last:border-b-0 hover:bg-muted/30 ${
                        idx < 3 ? "bg-amber-50/30" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                            idx === 0
                              ? "bg-amber-100 text-amber-700"
                              : idx === 1
                                ? "bg-muted text-muted-foreground"
                                : idx === 2
                                  ? "bg-amber-50 text-amber-600"
                                  : "text-foreground"
                          }`}
                        >
                          {idx + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">
                          {s.profile?.nome ?? "N/A"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {s.profile?.matricula}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {s.profile?.setor_base ?? ""}
                      </td>
                      <td className="px-4 py-3">
                        {isLideranca && editable ? (
                          isEditing ? (
                            <form
                              className="flex items-center gap-1"
                              onSubmit={(e) => {
                                e.preventDefault()
                                const input =
                                  e.currentTarget.querySelector<HTMLInputElement>(
                                    "input[name=pontos]"
                                  )
                                if (input) {
                                  handleSetScore(s.user_id, Number(input.value))
                                }
                              }}
                            >
                              <Input
                                name="pontos"
                                type="number"
                                min={0}
                                defaultValue={s.pontos}
                                className="h-8 w-20"
                              />
                              <Button type="submit" size="sm" disabled={isPending}>
                                Ok
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingScoreId(null)}
                              >
                                Cancelar
                              </Button>
                            </form>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 shrink-0"
                                onClick={() => handleDecrement(s.user_id)}
                                disabled={isPending || s.pontos <= 0}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="min-w-[2rem] text-center font-bold text-foreground">
                                {s.pontos} pts
                              </span>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 shrink-0"
                                onClick={() => handleIncrement(s.user_id)}
                                disabled={isPending}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-xs"
                                onClick={() => setEditingScoreId(s.user_id)}
                              >
                                Editar
                              </Button>
                            </div>
                          )
                        ) : (
                          <span className="font-bold text-foreground">
                            {s.pontos} pts
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
