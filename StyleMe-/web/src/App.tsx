import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { WizardProvider } from './context/WizardContext'
import { CaptureScreen } from './pages/CaptureScreen'
import { FaceShapeScreen } from './pages/FaceShapeScreen'
import { PromptScreen } from './pages/PromptScreen'
import { ResultScreen } from './pages/ResultScreen'
import { SetupScreen } from './pages/SetupScreen'
import { SplashScreen } from './pages/SplashScreen'
import { AboutScreen } from './pages/AboutScreen'
import { SupportScreen } from './pages/SupportScreen'
import { paths } from './routes/paths'
import { PersistWizard } from './routes/PersistWizard'
import { RequireGuest } from './routes/RequireGuest'
import { WizardLayout } from './routes/WizardLayout'

export default function App() {
  return (
    <WizardProvider>
      <BrowserRouter>
        <PersistWizard />
        <Routes>
          <Route path="/" element={<Navigate to={paths.splash} replace />} />
          <Route path={paths.splash} element={<SplashScreen />} />
          <Route path={paths.about} element={<AboutScreen />} />
          <Route path={paths.support} element={<SupportScreen />} />
          <Route element={<RequireGuest />}>
            <Route element={<WizardLayout />}>
              <Route path={paths.setup} element={<SetupScreen />} />
              <Route path={paths.capture} element={<CaptureScreen />} />
              <Route path={paths.faceShape} element={<FaceShapeScreen />} />
              <Route path={paths.prompt} element={<PromptScreen />} />
              <Route path={paths.result} element={<ResultScreen />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to={paths.splash} replace />} />
        </Routes>
      </BrowserRouter>
    </WizardProvider>
  )
}
