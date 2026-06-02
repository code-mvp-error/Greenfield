'use client'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  totalItems: number
  itemsPerPage: number
}

export function Pagination({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }: PaginationProps) {
  const { t } = useTranslation()
  if (totalItems === 0) return null

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('...')
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (currentPage < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
      <p className="text-sm text-muted-foreground font-medium">
        {t('pagination.showing')} <span className="text-foreground">{startItem}-{endItem}</span> {t('pagination.of')} <span className="text-foreground">{totalItems}</span> {t('pagination.results')}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors duration-150"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors duration-150"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {getPageNumbers().map((page, i) => (
          typeof page === 'number' ? (
            <Button
              key={i}
              variant={currentPage === page ? 'default' : 'outline'}
              size="icon"
              className={`h-8 w-8 transition-all duration-150 ${
                currentPage === page
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/20'
                  : 'hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
              }`}
              onClick={() => onPageChange(page)}
            >
              {page}
            </Button>
          ) : (
            <span key={i} className="px-1 text-muted-foreground text-sm">...</span>
          )
        ))}

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors duration-150"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors duration-150"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
