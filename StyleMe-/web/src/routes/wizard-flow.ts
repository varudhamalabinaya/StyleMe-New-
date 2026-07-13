import { paths } from './paths'

/** Ordered steps after authentication. */
export const wizardStepPaths = [
  paths.setup,
  paths.capture,
  paths.faceShape,
  paths.prompt,
  paths.result,
] as const

export type WizardStepPath = (typeof wizardStepPaths)[number]

export function getPreviousWizardPath(currentPath: string): string | null {
  // "auth" page was removed; Setup is now the first wizard step.
  if (currentPath === paths.setup) return null
  const i = wizardStepPaths.indexOf(currentPath as WizardStepPath)
  if (i <= 0) return null
  return wizardStepPaths[i - 1]!
}

export function getNextWizardPath(currentPath: string): string | null {
  const i = wizardStepPaths.indexOf(currentPath as WizardStepPath)
  if (i < 0 || i >= wizardStepPaths.length - 1) return null
  return wizardStepPaths[i + 1]!
}

export function isWizardStepPath(path: string): path is WizardStepPath {
  return (wizardStepPaths as readonly string[]).includes(path)
}
