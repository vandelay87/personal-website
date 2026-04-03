import Button from '@components/Button'
import FileMeta from '@components/FileMeta'
import { FC, useEffect, useState } from 'react'
import fileUrl from '../../assets/Akli-Aissat-CV.pdf'
import styles from './CVDownload.module.css'

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
      className={styles.section}
      aria-labelledby="cv-section-heading"
    >
      <div className={styles.inner}>
        <h2 id="cv-section-heading" className={styles.heading}>
          Interested in working together?
        </h2>

        <p className={styles.paragraph}>
          Take a look at my experience, skills, and background. Download my CV
          to learn more about what I can bring to your team.
        </p>

        <Button onClick={handleDownload} ariaLabel="Download CV as PDF">
          Download my CV
        </Button>
        <div className={styles.metaWrapper}>
          <FileMeta fileInfo={fileInfo} hasError={hasError} />
        </div>
      </div>
    </section>
  )
}

export default CVDownload
