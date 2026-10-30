import fs from 'fs'
import path from 'path'

/** Escopo fixo: somente logs criados pelo medidor dentro do perfil do app. */
export function clearMeterLogFiles(userData: string): void {
  const root = path.resolve(userData)
  const target = path.resolve(root, 'logs', 'dps-meter')
  if (path.relative(root, target) !== path.join('logs', 'dps-meter')) throw Error('Pasta de logs fora do perfil do app')
  const logs = path.join(root, 'logs')
  for (const directory of [logs, target]) {
    if (fs.existsSync(directory) && fs.lstatSync(directory).isSymbolicLink()) throw Error('Pasta de logs não pode ser um link')
  }
  fs.rmSync(target, { recursive: true, force: true })
}
