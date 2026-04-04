import Header from '@components/Header'
import Layout from '@components/Layout'
import Apps from '@pages/Apps'
import Home from '@pages/Home'
import NotFound from '@pages/NotFound'
import { Routes, Route } from 'react-router-dom'

export default function App() {
  return (
    <>
      <Header />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/apps" element={<Apps />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </>
  )
}
