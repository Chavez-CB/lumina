/**
 * CredentialAuth — Formulario login usuario + contraseña
 *
 * Componente autocontenido: gestiona su propio estado de form.
 * Al autenticar con éxito llama onSuccess(response).
 * Al fallar muestra error inline (sin toast desde aquí).
 *
 * Uso:
 *   <CredentialAuth onSuccess={(res) => loginWithResponse(res)} />
 */

import { useState } from "react"
import type { FormEvent } from "react"
import { Eye, EyeOff, Lock, User, Loader2 } from "lucide-react"
import { authService } from "@/services/authService"
import type { LoginResponse } from "@/types/auth"

interface CredentialAuthProps {
  onSuccess: (response: LoginResponse) => void
  onError?: (error: string) => void
  /**
   * Override del método de login.
   * Si se provee, se usa en lugar de authService.loginWithCredentials.
   * Útil cuando el caller quiere que el AuthContext persista la sesión.
   * Si retorna true = éxito, si false = fallo.
   */
  loginFn?: (username: string, password: string) => Promise<boolean>
}

export default function CredentialAuth({ onSuccess, onError, loginFn }: CredentialAuthProps) {
  const [usuario, setUsuario] = useState("")
  const [pass, setPass] = useState("")
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Si loginFn viene del AuthContext → usarlo (persiste sesión)
    // Si no → llamar authService directamente (modo standalone)
    if (loginFn) {
      const ok = await loginFn(usuario.trim(), pass)
      if (ok) {
        onSuccess({ success: true, method: "credentials" })
      } else {
        const msg = "Credenciales incorrectas"
        setError(msg)
        onError?.(msg)
      }
    } else {
      const response = await authService.loginWithCredentials(usuario.trim(), pass)
      if (response.success) {
        onSuccess(response)
      } else {
        const msg = response.error || "Credenciales incorrectas"
        setError(msg)
        onError?.(msg)
      }
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Campo usuario */}
      <div className="space-y-2">
        <label htmlFor="cred-usuario" className="text-sm font-medium">
          Usuario
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            id="cred-usuario"
            value={usuario}
            onChange={e => setUsuario(e.target.value)}
            placeholder="admin"
            className="w-full pl-9 pr-4 h-11 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-base"
            autoComplete="username"
            disabled={loading}
            required
          />
        </div>
      </div>

      {/* Campo contraseña */}
      <div className="space-y-2">
        <label htmlFor="cred-pass" className="text-sm font-medium">
          Contraseña
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            id="cred-pass"
            type={show ? "text" : "password"}
            value={pass}
            onChange={e => setPass(e.target.value)}
            placeholder="••••••••"
            className="w-full pl-9 pr-10 h-11 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-base"
            autoComplete="current-password"
            disabled={loading}
            required
          />
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-base"
            aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Error inline */}
      {error && (
        <div className="rounded-lg bg-accent-soft border border-accent/20 px-4 py-3 text-sm text-accent font-medium animate-fade-in-up">
          {error}
        </div>
      )}

      {/* Botón submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full h-11 rounded-lg bg-gradient-primary text-primary-foreground font-semibold shadow-glow hover:opacity-95 transition-base disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Verificando...
          </>
        ) : (
          "Ingresar al sistema"
        )}
      </button>

      {/* Credenciales demo */}
      <div className="rounded-xl border border-dashed border-border bg-muted/40 p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Credenciales demo
        </p>
        <div className="text-sm font-mono space-y-0.5">
          <p>
            <span className="text-muted-foreground">Usuario:</span>{" "}
            <span className="font-semibold">admin</span>
          </p>
          <p>
            <span className="text-muted-foreground">Clave:</span>{" "}
            <span className="font-semibold">admin123</span>
          </p>
        </div>
      </div>
    </form>
  )
}
