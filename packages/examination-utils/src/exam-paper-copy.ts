export const examCopyFileNameToS3Path = (filename: string) => {
  if (!filename || !filename.includes('.')) {
    return filename
  }

  const examinationPeriod = filename.substring(0, 5)
  const fileExtension = filename.split('.').pop()!.toLowerCase()

  return `${examinationPeriod}/${fileExtension}/${filename}`
}
