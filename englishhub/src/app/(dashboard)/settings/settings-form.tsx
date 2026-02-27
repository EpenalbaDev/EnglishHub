'use client'

import { useState, useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { CheckCircle2, Palette, Languages } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { saveAvatarUrl, savePreferences } from './actions'
import type { AppLocale } from '@/i18n/routing'
import { swapPathLocale } from '@/i18n/navigation'
import type { AppMode, AppPalette, UserPreferences } from '@/lib/preferences'
import { applyPreferencesToDocument } from '@/lib/preferences-client'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'

interface SettingsFormProps {
  initialPreferences: UserPreferences
  initialAvatarUrl: string | null
}

const acceptedImageTypes = ['image/png', 'image/jpeg', 'image/webp']
const maxAvatarSizeBytes = 2 * 1024 * 1024

export function SettingsForm({ initialPreferences, initialAvatarUrl }: SettingsFormProps) {
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations('Settings')
  const [isPending, startTransition] = useTransition()
  const [language, setLanguage] = useState<AppLocale>(initialPreferences.language)
  const [palette, setPalette] = useState<AppPalette>(initialPreferences.palette)
  const [mode, setMode] = useState<AppMode>(initialPreferences.mode)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const onSave = () => {
    setFeedback(null)

    startTransition(async () => {
      let nextAvatarUrl = avatarUrl

      if (avatarFile) {
        if (!acceptedImageTypes.includes(avatarFile.type)) {
          setFeedback({ type: 'error', message: t('profileInvalidType') })
          return
        }
        if (avatarFile.size > maxAvatarSizeBytes) {
          setFeedback({ type: 'error', message: t('profileInvalidSize') })
          return
        }

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setFeedback({ type: 'error', message: t('saveError') })
          return
        }

        const extension = avatarFile.name.split('.').pop()?.toLowerCase() || 'jpg'
        const storagePath = `tutors/${user.id}/avatar.${extension}`
        const uploadResult = await supabase.storage
          .from('avatars')
          .upload(storagePath, avatarFile, {
            upsert: true,
            cacheControl: '3600',
            contentType: avatarFile.type,
          })

        if (uploadResult.error) {
          setFeedback({ type: 'error', message: t('profileUploadError') })
          return
        }

        const { data } = supabase.storage.from('avatars').getPublicUrl(storagePath)
        nextAvatarUrl = `${data.publicUrl}?v=${Date.now()}`
        const saveAvatarResult = await saveAvatarUrl(nextAvatarUrl)

        if (!saveAvatarResult.ok) {
          setFeedback({ type: 'error', message: t('saveError') })
          return
        }

        setAvatarUrl(nextAvatarUrl)
      }

      const result = await savePreferences({ language, palette, mode })

      if (!result.ok) {
        setFeedback({ type: 'error', message: t('saveError') })
        return
      }

      applyPreferencesToDocument(result.preferences)
      if (avatarFile) {
        setFeedback({ type: 'success', message: `${t('profileUploadSuccess')} ${t('saved')}` })
      } else {
        setFeedback({ type: 'success', message: t('saved') })
      }
      setAvatarFile(null)

      const localizedPath = swapPathLocale(pathname, result.preferences.language)
      router.replace(localizedPath)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-neutral-800 lg:text-3xl">{t('title')}</h1>
        <p className="mt-1 text-sm text-neutral-500">{t('subtitle')}</p>
      </div>

      <section className="card-base">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-base font-semibold text-neutral-800">{t('profileCardTitle')}</h2>
        </div>
        <p className="mb-4 text-sm text-neutral-500">{t('profileCardDescription')}</p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar size="lg">
            {avatarUrl && <AvatarImage src={avatarUrl} alt="Tutor avatar" />}
            <AvatarFallback>{getInitials('Tutor')}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-neutral-700">{t('profileUploadLabel')}</label>
            <input 
              title={t('profileUploadLabel')}
              placeholder={t('profileUploadLabel')}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0] || null
                setAvatarFile(file)
              }}
              className="block w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700"
            />
            <p className="mt-1 text-xs text-neutral-500">{t('profileAcceptedFormats')}</p>
          </div>
        </div>
      </section>

      <section className="card-base">
        <div className="mb-4 flex items-center gap-2">
          <Languages className="h-5 w-5 text-primary-700" strokeWidth={1.75} />
          <h2 className="text-base font-semibold text-neutral-800">{t('languageCardTitle')}</h2>
        </div>
        <p className="mb-4 text-sm text-neutral-500">{t('languageCardDescription')}</p>
        <label className="mb-1 block text-sm font-medium text-neutral-700">{t('languageLabel')}</label>
        <Select value={language} onValueChange={(value) => setLanguage(value as AppLocale)}>
          <SelectTrigger className="w-full bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="es">{t('languageEs')}</SelectItem>
            <SelectItem value="en">{t('languageEn')}</SelectItem>
          </SelectContent>
        </Select>
      </section>

      <section className="card-base">
        <div className="mb-4 flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary-700" strokeWidth={1.75} />
          <h2 className="text-base font-semibold text-neutral-800">{t('themeCardTitle')}</h2>
        </div>
        <p className="mb-4 text-sm text-neutral-500">{t('themeCardDescription')}</p>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">{t('paletteLabel')}</label>
            <Select value={palette} onValueChange={(value) => setPalette(value as AppPalette)}>
              <SelectTrigger className="w-full bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="teal">{t('paletteTeal')}</SelectItem>
                <SelectItem value="indigo">{t('paletteIndigo')}</SelectItem>
                <SelectItem value="rose">{t('paletteRose')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">{t('modeLabel')}</label>
            <Select value={mode} onValueChange={(value) => setMode(value as AppMode)}>
              <SelectTrigger className="w-full bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">{t('modeLight')}</SelectItem>
                <SelectItem value="dark">{t('modeDark')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <Button onClick={onSave} disabled={isPending} className="btn-primary">
          {isPending ? t('savingButton') : t('saveButton')}
        </Button>

        {feedback?.type === 'success' && (
          <div className="inline-flex items-center gap-1 text-sm text-success">
            <CheckCircle2 className="h-4 w-4" />
            {feedback.message}
          </div>
        )}

        {feedback?.type === 'error' && (
          <p className="text-sm text-error">{feedback.message}</p>
        )}
      </div>
    </div>
  )
}
