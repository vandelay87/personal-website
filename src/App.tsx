import Header from '@components/Header'
import Layout from '@components/Layout'
import About from '@pages/About'
import Home from '@pages/Home'
import NotFound from '@pages/NotFound'
import { Routes, Route, useLocation } from 'react-router-dom'

export default function App() {
  const location = useLocation()

  return (
    <>
      <Header />
      <Layout isHomePage={location.pathname === '/'}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </>
  )
}
