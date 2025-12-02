import i18n from '@/i18n'

export function getFriendlyErrorMessage(error: any): string {
  const msg = error instanceof Error ? error.message : String(error)

  if (
    msg.includes('Update is not a fast forward') ||
    msg.includes('409') ||
    msg.includes('Conflict')
  ) {
    return i18n.global.t('errors.git.conflict')
  }

  if (msg.includes('422') || msg.includes('Unprocessable Entity')) {
    return i18n.global.t('errors.git.unprocessable')
  }

  if (msg.includes('404') || msg.includes('Not Found')) {
    return i18n.global.t('errors.git.notFound')
  }

  if (msg.includes('403') || msg.includes('Forbidden') || msg.includes('Bad credentials')) {
    return i18n.global.t('errors.git.forbidden')
  }

  if (msg.includes('Network Error')) {
    return i18n.global.t('errors.network')
  }

  return msg
}
