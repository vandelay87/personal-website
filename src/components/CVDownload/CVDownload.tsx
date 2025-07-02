import Button from '@components/Button'
import FileMeta from '@components/FileMeta'
import { useEffect, useState } from 'react'
import fileUrl from '../../assets/Akli-Aissat-CV.pdf'

const formatFileSize = (sizeInBytes: number) => {
  if (sizeInBytes < 1024) return `${sizeInBytes} B`
  else if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`
  else return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`
}

const CVDownload = () => {
  const DEFAULT_FILE_NAME = 'Akli-Aissat-CV'
  const [fileInfo, setFileInfo] = useState<null | {
    type: string
    date: string
    name: string
    size: string
  }>(null)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    // Create a blob from the imported file to get metadata
    fetch(fileUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const file = new File([blob], `${DEFAULT_FILE_NAME}.pdf`, { type: blob.type })
        setFileInfo({
          type: file.type.split('/')[1].toUpperCase() || 'PDF',
          date: new Date(file.lastModified || Date.now()).toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'long',
          }),
          name: file.name.split('.')[0] || DEFAULT_FILE_NAME,
          size: formatFileSize(blob.size),
        })
      })
      .catch((error) => {
        console.warn('Failed to load CV metadata:', error)
        setHasError(true)
      })
  }, [])

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = `${fileInfo?.name || DEFAULT_FILE_NAME}.pdf`
    link.click()
  }

  return (
    <section
      className="py-16 px-4 bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-800 w-screen ml-[calc(50%-50vw)]"
      aria-labelledby="cv-section-heading"
    >
      <div className="max-w-2xl mx-auto text-center">
        <h2 id="cv-section-heading" className="text-3xl font-bold mb-4">
          Interested in working together?
        </h2>

        <p className="text-lg mb-8 leading-relaxed">
          Take a look at my experience, skills, and background. Download my CV to learn more about
          what I can bring to your team.
        </p>

        <Button onClick={handleDownload} aria-label="Download CV as PDF">
          Download my CV
        </Button>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-4 flex items-center justify-center min-h-[1.5rem]">
          <FileMeta fileInfo={fileInfo} hasError={hasError} />
        </div>
      </div>
    </section>
  )
}

export default CVDownload
