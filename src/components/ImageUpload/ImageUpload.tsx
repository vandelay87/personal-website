
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

// Hoisted elements, not components — these never take props, so there's no
// need to re-invoke a function (and rebuild the tree) on every render; see
// `iconRetry` in src/pages/admin/RecipeList/RecipeList.tsx for the same
// established pattern.
//
// Design: docs/design/paper/pages/Admin Recipe Editor.dc.html's `.upload`
// dropzone icon (upload-cloud, stroke-width 1.6).
const iconUploadCloud = (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
)

// Design: same doc's STEPS section "+ Add step image" ghost-button icon.
const iconAddImage = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
  </svg>
)

// Design's overlaid icon-button is a trash glyph (it deletes the image
// outright in the design's simulated backend). This component only has a
// replace-via-re-upload callback surface (see the "Ready state" note in
// the PR description), so a pencil/replace glyph is used instead of the
// literal trash icon to avoid implying a destructive delete that doesn't
// exist here.
const iconReplace = (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
)

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
            className={styles.replaceButton}
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
      <button type="button" className={styles.dropzone} onClick={handleClick}>
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
