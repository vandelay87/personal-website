import AppsCta from '@components/AppsCta'
import CVDownload from '@components/CVDownload'
import FullPageHeader from '@components/FullPageHeader'
import type { FullPageHeaderProps } from '@components/FullPageHeader'
import img from '../../assets/profile.webp'

const FULL_PAGE_HEADER_PROPS: FullPageHeaderProps = {
  name: 'Akli Aissat',
  tagline: 'Full-stack engineer',
  description:
    'I build beautiful, responsive web applications with React, TypeScript, and modern web technologies. Passionate about creating accessible and user-friendly experiences.',
  imageSrc: img,
}

export default function Home() {
  return (
    <>
      <FullPageHeader {...FULL_PAGE_HEADER_PROPS} />
      <CVDownload />
      <AppsCta />
    </>
  )
}
