import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { createServiceClient } from "@/lib/supabase/service"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name: string
      matricula: string
      profileId: string
      cargo: string
      lojaId: string | null
      ativo: boolean
    }
  }

  interface JWT {
    profileId?: string
    matricula?: string
    cargo?: string
    lojaId?: string | null
    ativo?: boolean
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  debug: process.env.NEXTAUTH_DEBUG === "true",
  trustHost: true,
  providers: [
    Credentials({
      name: "Credenciais",
      credentials: {
        matricula: { label: "Matrícula", type: "text" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const matricula = (credentials?.matricula as string | undefined)?.trim()
        const senha = credentials?.senha as string | undefined

        console.log("[LOGIN DEBUG] matricula recebida:", JSON.stringify(matricula))
        console.log("[LOGIN DEBUG] senha recebida:", senha ? "(preenchida)" : "(vazia)")

        if (!matricula || !senha) {
          console.log("[LOGIN DEBUG] FALHOU: matricula ou senha vazia no form")
          throw new Error("CredentialsSignin")
        }

        const supabase = createServiceClient()
        const { data: profile, error: dbError } = await supabase
          .from("profiles")
          .select("id, nome, matricula, senha_hash, cargo, loja_id, ativo")
          .eq("matricula", matricula)
          .single()

        console.log("[LOGIN DEBUG] erro do supabase:", dbError)
        console.log("[LOGIN DEBUG] profile encontrado:", profile ? { ...profile, senha_hash: profile.senha_hash ? "(existe)" : "(NULL)" } : null)

        if (!profile || !profile.senha_hash) {
          console.log("[LOGIN DEBUG] FALHOU: nenhum profile com essa matricula, ou senha_hash NULL")
          throw new Error("CredentialsSignin")
        }

        const senhaValida = await bcrypt.compare(senha, profile.senha_hash)
        console.log("[LOGIN DEBUG] senha bateu?", senhaValida)

        if (!senhaValida) {
          console.log("[LOGIN DEBUG] FALHOU: senha incorreta (hash nao confere)")
          throw new Error("CredentialsSignin")
        }

        if (!profile.ativo) {
          console.log("[LOGIN DEBUG] FALHOU: profile.ativo = false")
          throw new Error("AccountBlocked")
        }

        console.log("[LOGIN DEBUG] SUCESSO")

        return {
          id: profile.id,
          name: profile.nome,
          matricula: profile.matricula,
          profileId: profile.id,
          cargo: profile.cargo,
          lojaId: profile.loja_id,
          ativo: profile.ativo,
        } as unknown as { id: string }
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as {
          profileId: string
          matricula: string
          cargo: string
          lojaId: string | null
          ativo: boolean
        }
        token.profileId = u.profileId
        token.matricula = u.matricula
        token.cargo = u.cargo
        token.lojaId = u.lojaId
        token.ativo = u.ativo
      }

      if (token.profileId) {
        const supabase = createServiceClient()
        const { data: dbProfile } = await supabase
          .from("profiles")
          .select("cargo, loja_id, ativo")
          .eq("id", token.profileId as string)
          .single()

        if (dbProfile) {
          token.cargo = dbProfile.cargo
          token.lojaId = dbProfile.loja_id
          token.ativo = dbProfile.ativo
        } else {
          token.ativo = false
        }
      }

      return token
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: (token.profileId as string) ?? "",
        matricula: (token.matricula as string) ?? "",
        profileId: (token.profileId as string) ?? "",
        cargo: (token.cargo as string) ?? "",
        lojaId: (token.lojaId as string | null) ?? null,
        ativo: (token.ativo as boolean) ?? false,
      }
      return session
    },
  },
  session: {
    strategy: "jwt",
  },
})