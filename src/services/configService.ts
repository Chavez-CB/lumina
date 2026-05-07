/**
 * Config Service — Persistencia de configuracion del sistema
 *
 * HOY: lee/escribe en localStorage
 * FUTURO: GET /config y PUT /config
 */

import { empresa, configDescuentos } from "@/lib/mockData"
// import { httpClient } from "@/lib/api/client"

export interface ConfigEmpresa {
  nombre: string
  ruc: string
  direccion: string
  logo: string
}

export interface ConfigDescuentos {
  toleranciaMinutos: number
  montoTardanza: number
  porcentajeFalta: number
}

export interface ConfigData {
  empresa: ConfigEmpresa
  descuentos: ConfigDescuentos
  diasLaborables: number[]
}

const STORAGE_KEY = "lumina_config"

const DEFAULTS: ConfigData = {
  empresa: { ...empresa },
  descuentos: { ...configDescuentos },
  diasLaborables: [1, 2, 3, 4, 5],
}

class ConfigService {
  getConfig(): ConfigData {
    // ====== HOY (localStorage) ======
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return { ...DEFAULTS, ...JSON.parse(raw) }
    } catch { /* ignorar parse error */ }
    return { ...DEFAULTS }

    // ====== FUTURO (backend) ======
    // return await httpClient.get<ConfigData>("/config")
  }

  async saveConfig(data: ConfigData): Promise<void> {
    // ====== HOY (localStorage) ======
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))

    // ====== FUTURO (backend) ======
    // await httpClient.put("/config", data)
  }
}

export const configService = new ConfigService()
