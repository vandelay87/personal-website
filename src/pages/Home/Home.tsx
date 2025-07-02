import CVDownload from '@components/CVDownload'
import FullPageHeader from '@components/FullPageHeader'
import type { FullPageHeaderProps } from '@components/FullPageHeader'
import imgUrl from '../../assets/profile.webp'

export default function Home() {
  const FULL_PAGE_HEADER_PROPS: FullPageHeaderProps = {
    name: 'Akli Aissat',
    tagline: 'Full-stack engineer',
    description:
      'I build beautiful, responsive web applications with React, TypeScript, and modern web technologies. Passionate about creating accessible and user-friendly experiences.',
    imageSrc: imgUrl,
  }

  return (
    <>
      <FullPageHeader {...FULL_PAGE_HEADER_PROPS} />
      <CVDownload />
    </>
  )
}
