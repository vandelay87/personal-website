import Button from '@components/Button'
import FileMeta from '@components/FileMeta'
import { FC, useEffect, useState } from 'react'
import fileUrl from '../../assets/Akli-Aissat-CV.pdf'

const DEFAULT_FILE_NAME = 'Akli-Aissat-CV'

const formatFileSize = (sizeInBytes: number) => {
  if (sizeInBytes < 1024) return `${sizeInBytes} B`
  else if (sizeInBytes < 1024 * 1024)
    return `${(sizeInBytes / 1024).toFixed(1)} KB`
  else return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`
}

const CVDownload: FC = () => {
  const [fileInfo, setFileInfo] = useState<{
    type: string
    size: string
    date?: string
  } | null>(null)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(fileUrl)
        const lastModified = response.headers.get('Last-Modified')
        const date = lastModified
          ? new Date(lastModified).toLocaleDateString('en-GB', {
              year: 'numeric',
              month: 'long',
            })
          : undefined
        const blob = await response.blob()
        setFileInfo({ type: 'PDF', size: formatFileSize(blob.size), date })
      } catch (error) {
        console.warn('Failed to load CV metadata:', error)
        setHasError(true)
      }
    }
    load()
  }, [])

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = `${DEFAULT_FILE_NAME}.pdf`
    link.click()
  }

  return (
    <section
      className="py-16 px-4 bg-linear-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-800 w-screen ml-[calc(50%-50vw)]"
      aria-labelledby="cv-section-heading"
    >
      <div className="max-w-2xl mx-auto text-center">
        <h2 id="cv-section-heading" className="text-3xl font-bold mb-4">
          Interested in working together?
        </h2>

        <p className="text-lg mb-8 leading-relaxed">
          Take a look at my experience, skills, and background. Download my CV
          to learn more about what I can bring to your team.
        </p>

        <Button onClick={handleDownload} ariaLabel="Download CV as PDF">
          Download my CV
        </Button>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-4 flex items-center justify-center min-6">
          <FileMeta fileInfo={fileInfo} hasError={hasError} />
        </div>
      </div>
    </section>
  )
}

export default CVDownload
