export function getCurrentExaminationPeriod(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = date.getMonth() + 1

  return String(year) + (month < 8 ? 'K' : 'S')
}

export const currentExaminationPeriod = getCurrentExaminationPeriod()
