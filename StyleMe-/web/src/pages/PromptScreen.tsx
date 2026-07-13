import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen } from '../components/ui/Screen'
import { TextArea } from '../components/ui/TextField'
import { StylePills } from '../components/ui/StylePills'
import { useWizard } from '../context/useWizard'
import { paths } from '../routes/paths'

export function PromptScreen() {
  const navigate = useNavigate()
  const { imageUri, faceShape, prompt, setPrompt, selectedStylePill, setSelectedStylePill } = useWizard()

  useEffect(() => {
    if (!faceShape) navigate(paths.capture, { replace: true })
  }, [faceShape, navigate])

  return (
    <Screen wide>
      <p className="ui-eyebrow">Prompt</p>
      <h1 className="ui-title">Make it yours</h1>
      <p className="ui-body">Add words and tap a style direction—we will shape ideas around both.</p>

      <div className="ui-stack">
        {imageUri ? (
          <img src={imageUri} alt="" className="ui-preview ui-preview--centered" />
        ) : null}

        <TextArea
          label="What are you hoping for?"
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. softer around the jaw, keep length, open to bangs…"
        />

        <StylePills value={selectedStylePill} onChange={setSelectedStylePill} />
      </div>
    </Screen>
  )
}
