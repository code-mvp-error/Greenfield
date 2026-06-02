'use client'

import { useI18n } from '@/lib/i18n/context'
import { Globe, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface LanguageSwitcherProps {
  variant?: 'compact' | 'full'
}

const languages = [
  { code: 'en' as const, label: 'EN', fullLabel: 'English', flag: '🇬🇧' },
  { code: 'fr' as const, label: 'FR', fullLabel: 'Français', flag: '🇫🇷' },
]

export function LanguageSwitcher({ variant = 'compact' }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useI18n()

  const currentLang = languages.find((l) => l.code === locale) ?? languages[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={variant === 'full' ? 'default' : 'icon'}
          className={
            variant === 'compact'
              ? 'h-9 w-9 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-200'
              : 'gap-2 rounded-lg px-3 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-200'
          }
          aria-label={t.common.language}
        >
          <Globe className="h-4 w-4" />
          {variant === 'full' && (
            <span className="text-sm font-medium">
              {currentLang.flag} {currentLang.fullLabel}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[180px] rounded-lg border border-border/50 shadow-lg dark:shadow-emerald-950/20"
      >
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLocale(lang.code)}
            className={
              'cursor-pointer gap-2 rounded-md px-3 py-2 transition-all duration-150 ' +
              (locale === lang.code
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-semibold'
                : 'hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20 hover:text-emerald-600 dark:hover:text-emerald-400')
            }
          >
            {variant === 'full' ? (
              <>
                <span className="text-base leading-none">{lang.flag}</span>
                <span className="flex-1 text-sm">{lang.fullLabel}</span>
              </>
            ) : (
              <>
                <span className="text-base leading-none">{lang.flag}</span>
                <span className="flex-1 text-sm font-medium">{lang.label}</span>
              </>
            )}
            {locale === lang.code && (
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
