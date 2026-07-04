
import { getUploadUrl } from '@api/recipes'
import Button from '@components/Button'
import Image from '@components/Image'
import ProcessingPlaceholder from '@components/ProcessingPlaceholder'
import { parseImageType, recipeImageUrl, type ImageType } from '@models/recipe'
import { useEffect, useId, useRef, useState, type ChangeEvent, type FC } from 'react'

import styles from './ImageUpload.module.css'

export interface ImageUploadProps {
  slug: string
  imageType: ImageType
  currentAlt?: string
  processedAt?: number
  getToken: () => Promise<string>
  recipeId: string
  onUploadStarted?: () => void
  onUploadCompleted?: () => void
}

const MAX_SIZE = 10 * 1024 * 1024

const ImageUpload: FC<ImageUploadProps> = ({
  slug,
  imageType,
  currentAlt,
  processedAt,
  getToken,
  recipeId,
  onUploadStarted,
  onUploadCompleted,
}) => {
  const inputId = useId()
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastFile, setLastFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const handleClick = () => {
    inputRef.current?.click()
  }

  const uploadParams = () => {
    const parsed = parseImageType(imageType)
    return parsed.kind === 'cover'
      ? { recipeId, imageType: 'cover' as const }
      : { recipeId, imageType: 'step' as const, stepId: parsed.stepId }
  }

  const upload = async (file: File) => {
    setError(null)
    setLastFile(file)

    if (file.size > MAX_SIZE) {
      setError('File must be under 10MB')
      return
    }

    if (!file.type.startsWith('image/')) {
      setError('File must be an image')
      return
    }

    setPreview(URL.createObjectURL(file))

    try {
      const token = await getToken()
      const { uploadUrl } = await getUploadUrl(token, uploadParams())
      onUploadStarted?.()
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })
      onUploadCompleted?.()
    } catch {
      setError('Upload error. Please try again.')
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) upload(file)
  }

  const handleRetry = () => {
    if (lastFile) upload(lastFile)
  }

  const renderPreview = () => {
    if (preview) {
      return (
        <Image
          key="preview"
          src={preview}
          alt="Upload preview"
          className={styles.preview}
          aspectRatio="1 / 1"
          maxWidth="200px"
          lazy={false}
        />
      )
    }
    if (!processedAt) return <ProcessingPlaceholder aspectRatio="1 / 1" />
    return (
      <Image
        key="processed"
        src={recipeImageUrl(slug, imageType, 'medium')}
        alt={currentAlt ?? 'Current image'}
        className={styles.preview}
        aspectRatio="1 / 1"
        maxWidth="200px"
      />
    )
  }

  const hasCurrentImage = processedAt !== undefined

  return (
    <div className={styles.container}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="sr-only"
        id={inputId}
        aria-label="Upload image"
      />

      {renderPreview()}

      {error && (
        <div className={styles.error} role="alert">
          <span>{error}</span>
          <Button onClick={handleRetry} variant="outline" ariaLabel="Retry">
            Retry
          </Button>
        </div>
      )}

      {hasCurrentImage && !preview ? (
        <Button onClick={handleClick} ariaLabel="Replace image" variant="outline">
          Replace
        </Button>
      ) : (
        <Button onClick={handleClick} variant="solid">
          Upload
        </Button>
      )}

      <div aria-live="polite" className="sr-only" />
    </div>
  )
}

export default ImageUpload
