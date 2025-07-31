export function getBasicAuthUsername(authorizationHeader?: string) {
  if (authorizationHeader) {
    const base64Credentials = authorizationHeader.split(' ')[2]
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8')
    const [username] = credentials.split(':')

    return username
  }

  return undefined
}
