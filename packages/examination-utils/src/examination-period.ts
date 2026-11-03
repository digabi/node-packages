export function getCurrentExaminationPeriod(): string {
  const override = globalThis.process?.env?.EXAMINATION_PERIOD_OVERRIDE
  if (override) return override

  const date = new Date()
  const year = date.getFullYear()
  const month = date.getMonth() + 1

  return String(year) + (month < 8 ? 'K' : 'S')
}

export const currentExaminationPeriod = getCurrentExaminationPeriod()
