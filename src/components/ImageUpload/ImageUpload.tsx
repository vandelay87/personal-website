import type { FC } from 'react'

export interface ImageUploadProps {
  onUpload: (key: string) => void
  currentKey?: string
  getToken: () => Promise<string>
}

export const ImageUpload: FC<ImageUploadProps> = () => {
  return null
}

export default ImageUpload
