
import { getUploadUrl } from '@api/recipes'
import Button from '@components/Button'
import { useEffect, useId, useRef, useState, type ChangeEvent, type FC } from 'react'

import styles from './ImageUpload.module.css'

export interface ImageUploadProps {
  onUpload: (key: string) => void
  currentKey?: string
  getToken: () => Promise<string>
  id?: string
  imageType?: 'cover' | 'step'
  stepOrder?: number
}

const MAX_SIZE = 10 * 1024 * 1024

const ImageUpload: FC<ImageUploadProps> = ({
  onUpload,
  currentKey,
  getToken,
  id,
  imageType = 'cover',
  stepOrder,
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
      const { uploadUrl, key } = await getUploadUrl(token, {
        recipeId: id ?? '',
        imageType,
        ...(imageType === 'step' && stepOrder !== undefined ? { stepOrder } : {}),
      })
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })
      onUpload(key)
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

      {preview && <img src={preview} alt="Upload preview" className={styles.preview} />}

      {error && (
        <div className={styles.error} role="alert">
          <span>{error}</span>
          <Button onClick={handleRetry} variant="secondary" ariaLabel="Retry">
            Retry
          </Button>
        </div>
      )}

      {currentKey && !preview ? (
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
