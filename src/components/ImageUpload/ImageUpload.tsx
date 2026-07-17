
import { getUploadUrl } from '@api/recipes'
import Button from '@components/Button'
import { iconAddImage, iconReplace, iconUploadCloud } from '@components/icons'
import Image from '@components/Image'
import ProcessingPlaceholder from '@components/ProcessingPlaceholder'
import { parseImageType, recipeImageUrl, type ImageType } from '@models/recipe'
import { useEffect, useId, useRef, useState, type ChangeEvent, type FC } from 'react'

import interactions from '../../styles/interactions.module.css'
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
  // Local, session-only signal distinguishing "never uploaded" (empty
  // dropzone) from "uploaded, awaiting the server's processedAt" (shimmer
  // placeholder) — the props contract alone (`processedAt`/`preview`)
  // can't tell those apart, since both start out undefined/null. See the
  // "Empty vs. processing" note in the PR description for the one edge
  // case this doesn't cover (a page reload mid-processing from a prior
  // session) and why fixing that would need a new prop wired up by the
  // parent, out of scope here.
  const [hasAttemptedUpload, setHasAttemptedUpload] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Direct equality rather than `parseImageType(imageType).kind === 'cover'`
  // — parseImageType unconditionally calls `.slice()` on the non-cover
  // branch, which throws if `imageType` is ever undefined at runtime (the
  // "requires ... props (compile-time check)" test renders with it
  // omitted, via `@ts-expect-error`, specifically to exercise this). This
  // stays evaluated only where actually needed (`uploadParams`, still
  // called lazily on upload) for anything beyond this cover/step branch.
  const isCover = imageType === 'cover'

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

    setHasAttemptedUpload(true)
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

  const previewAspectRatio = isCover ? '16 / 9' : '4 / 3'
  const previewMaxWidth = isCover ? undefined : '128px'

  const renderContent = () => {
    if (preview) {
      return (
        <Image
          key="preview"
          src={preview}
          alt="Upload preview"
          className={styles.previewImage}
          aspectRatio={previewAspectRatio}
          maxWidth={previewMaxWidth}
          lazy={false}
        />
      )
    }

    if (processedAt !== undefined) {
      return (
        <div className={isCover ? `${styles.frame} ${styles.coverFrame}` : styles.frame}>
          <Image
            key="processed"
            src={recipeImageUrl(slug, imageType, 'medium')}
            alt={currentAlt ?? 'Current image'}
            className={styles.previewImage}
            aspectRatio={previewAspectRatio}
            maxWidth={previewMaxWidth}
          />
          <button
            type="button"
            className={`${interactions.focusRing} ${styles.replaceButton}`}
            onClick={handleClick}
            aria-label="Replace image"
          >
            {iconReplace}
          </button>
        </div>
      )
    }

    if (hasAttemptedUpload) {
      return isCover ? (
        <ProcessingPlaceholder aspectRatio="16 / 9" />
      ) : (
        <ProcessingPlaceholder height="96px" caption="Processing…" className={styles.stepProcessing} />
      )
    }

    return isCover ? (
      <button
        type="button"
        className={`${interactions.focusRing} ${interactions.uploadHover} ${styles.dropzone}`}
        onClick={handleClick}
      >
        <span aria-hidden="true" className={styles.dropzoneIcon}>
          {iconUploadCloud}
        </span>
        <span className={styles.dropzoneLabel}>Upload a cover image</span>
        <span className={styles.dropzoneHint}>JPG, PNG or WebP — landscape works best.</span>
      </button>
    ) : (
      <Button onClick={handleClick} variant="outline" size="sm" iconLeft={iconAddImage}>
        Add step image
      </Button>
    )
  }

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

      {renderContent()}

      {error && (
        <div className={styles.error} role="alert">
          <span aria-hidden="true" className={styles.errorDot}>
            ●
          </span>
          <span className={styles.errorText}>{error}</span>
          <Button onClick={handleRetry} variant="outline" size="sm" ariaLabel="Retry">
            Retry
          </Button>
        </div>
      )}

      <div aria-live="polite" className="sr-only" />
    </div>
  )
}

export default ImageUpload
