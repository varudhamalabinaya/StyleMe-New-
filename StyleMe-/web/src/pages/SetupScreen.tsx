import { Screen } from '../components/ui/Screen'
import { Select } from '../components/ui/TextField'
import { useWizard } from '../context/useWizard'

export function SetupScreen() {
  const { setup, setSetup } = useWizard()

  const valid =
    setup.gender.trim().length > 0 &&
    setup.occasion.trim().length > 0 &&
    setup.hairLengthPref.trim().length > 0 &&
    setup.hairGoal.trim().length > 0

  const missing: string[] = []
  if (!setup.gender.trim()) missing.push('gender')
  if (!setup.occasion.trim()) missing.push('occasion')
  if (!setup.hairLengthPref.trim()) missing.push('hair length')
  if (!setup.hairGoal.trim()) missing.push('hair goal')

  return (
    <Screen>
      <p className="ui-eyebrow">Setup</p>
      <h1 className="ui-title">What are we styling for?</h1>
      <p className="ui-body">Pick a few basics so suggestions match your moment and goals.</p>

      <div className="ui-stack">
        <Select
          label="Gender"
          id="gender"
          value={setup.gender}
          onChange={(e) => setSetup({ gender: e.target.value })}
          required
        >
          <option value="">Select…</option>
          <option value="Woman">Woman</option>
          <option value="Man">Man</option>
          <option value="Non-binary">Non-binary</option>
          <option value="Prefer not to say">Prefer not to say</option>
        </Select>

        <Select
          label="Occasion"
          id="occasion"
          value={setup.occasion}
          onChange={(e) => setSetup({ occasion: e.target.value })}
          required
        >
          <option value="">Select…</option>
          <option value="Work / everyday">Work / everyday</option>
          <option value="Wedding or formal">Wedding or formal</option>
          <option value="Date or night out">Date or night out</option>
          <option value="Casual refresh">Casual refresh</option>
          <option value="Other">Other</option>
        </Select>

        <Select
          label="Hair length preference"
          id="length"
          value={setup.hairLengthPref}
          onChange={(e) => setSetup({ hairLengthPref: e.target.value })}
          required
        >
          <option value="">Select…</option>
          <option value="Short">Short</option>
          <option value="Medium">Medium</option>
          <option value="Long">Long</option>
          <option value="Growing out / flexible">Growing out / flexible</option>
        </Select>

        <Select
          label="Hair goal"
          id="goal"
          value={setup.hairGoal}
          onChange={(e) => setSetup({ hairGoal: e.target.value })}
          required
        >
          <option value="">Select…</option>
          <option value="More volume">More volume</option>
          <option value="Sleeker / polished">Sleeker / polished</option>
          <option value="Low maintenance">Low maintenance</option>
          <option value="Try something new">Try something new</option>
          <option value="Color-focused">Color-focused</option>
        </Select>

        {!valid ? (
          <p className="ui-hint" role="status">
            Select your {missing.join(', ')} to continue.
          </p>
        ) : null}
      </div>
    </Screen>
  )
}
