import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import PortfolioPage from './pages/PortfolioPage'
import CVPage from './pages/CVPage'
import ProjectPage from './pages//ProjectPage'
import '../src/styles/global.css'

export default function App() {
  const base = "/Portfolio/"
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path={base} element={<PortfolioPage />} />
        <Route path={base + "CV"} element={<CVPage />} />
        <Route path={base + "project/:id"} element={<ProjectPage />} />
      </Routes>
    </BrowserRouter>
  )
}