import { File, Paths } from 'expo-file-system'

const FLAG_FILENAME = 'styleme-guest-entered.flag'

function guestFlagFile(): File {
  return new File(Paths.document, FLAG_FILENAME)
}

/** True after the user has completed guest entry once (Continue as guest). */
export function hasCompletedGuestEntry(): boolean {
  try {
    const exists = guestFlagFile().exists
    // #region agent log
    fetch('http://127.0.0.1:7581/ingest/978b9440-4ce2-4785-8f24-c8ce0542f3cb', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'adbeae' },
      body: JSON.stringify({
        sessionId: 'adbeae',
        runId: 'pre-fix',
        hypothesisId: 'B',
        location: 'guestSession.ts:hasCompletedGuestEntry',
        message: 'Checked guest flag file exists',
        data: { exists, uri: guestFlagFile().uri },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
    // #endregion
    return exists
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7581/ingest/978b9440-4ce2-4785-8f24-c8ce0542f3cb', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'adbeae' },
      body: JSON.stringify({
        sessionId: 'adbeae',
        runId: 'pre-fix',
        hypothesisId: 'B',
        location: 'guestSession.ts:hasCompletedGuestEntry',
        message: 'Guest flag exists check failed',
        data: { error: error instanceof Error ? error.message : 'unknown' },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
    // #endregion
    return false
  }
}

export function markGuestEntryComplete(): void {
  const file = guestFlagFile()
  const existedBefore = file.exists

  // #region agent log
  fetch('http://127.0.0.1:7581/ingest/978b9440-4ce2-4785-8f24-c8ce0542f3cb', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'adbeae' },
    body: JSON.stringify({
      sessionId: 'adbeae',
      runId: 'pre-fix',
      hypothesisId: 'A',
      location: 'guestSession.ts:markGuestEntryComplete',
      message: 'Marking guest entry (new File API)',
      data: { existedBefore, uri: file.uri },
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion

  if (!file.exists) {
    file.create()
  }
  file.write('1')

  // #region agent log
  fetch('http://127.0.0.1:7581/ingest/978b9440-4ce2-4785-8f24-c8ce0542f3cb', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'adbeae' },
    body: JSON.stringify({
      sessionId: 'adbeae',
      runId: 'pre-fix',
      hypothesisId: 'A',
      location: 'guestSession.ts:markGuestEntryComplete',
      message: 'Guest flag written successfully',
      data: { existsAfter: file.exists, text: file.textSync() },
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion
}
