
import { getUploadUrl } from '@api/recipes'
import Button from '@components/Button'
import Image from '@components/Image'
import ProcessingPlaceholder from '@components/ProcessingPlaceholder'
import { recipeImageUrl } from '@models/recipe'
import { useEffect, useId, useRef, useState, type ChangeEvent, type FC } from 'react'

import styles from './ImageUpload.module.css'

export interface ImageUploadProps {
  slug: string
  imageType: 'cover' | `step-${string}`
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

  // STUB (#198): the upload-started/completed callbacks are part of the new
  // contract but not yet fired here — the react-engineer wires them around the
  // PUT. Referenced as no-ops so the unused-var lint passes meanwhile.
  void onUploadStarted
  void onUploadCompleted

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const handleClick = () => {
    inputRef.current?.click()
  }

  // STUB (#198): minimal implementation so tests compile but fail at runtime.
  // The react-engineer wires onUploadStarted/onUploadCompleted, the derived
  // getUploadUrl params, and the slug-based current image URL.
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
      const { uploadUrl } = await getUploadUrl(token, {
        recipeId,
        imageType: 'cover',
      })
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })
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
    if (!processedAt) return null
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
        className={styles.input}
        id={inputId}
        aria-label="Upload image"
      />

      {!preview && !hasCurrentImage && processedAt === undefined ? (
        <ProcessingPlaceholder aspectRatio="1 / 1" />
      ) : (
        renderPreview()
      )}

      {error && (
        <div className={styles.error} role="alert">
          <span>{error}</span>
          <Button onClick={handleRetry} variant="secondary" ariaLabel="Retry">
            Retry
          </Button>
        </div>
      )}

      {hasCurrentImage && !preview ? (
        <Button onClick={handleClick} ariaLabel="Replace image" variant="secondary">
          Replace
        </Button>
      ) : (
        <Button onClick={handleClick} variant="primary">
          Upload
        </Button>
      )}

      <div aria-live="polite" className={styles.srOnly} />
    </div>
  )
}

export default ImageUpload
