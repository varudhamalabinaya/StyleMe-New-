# Manual API smoke test (requires OPENAI_API_KEY in environment)
#
# 1) Start backend:
#    $env:OPENAI_API_KEY = "<your-key>"
#    mvn spring-boot:run "-Dspring-boot.run.profiles=local"
#
# 2) Run from styleme-backend:
#    .\scripts\test-generate.ps1

param(
    [string]$BaseUrl = "http://localhost:8080",
    [ValidateSet("mixed", "unrelated", "pill-only")]
    [string]$Case = "mixed"
)

$ErrorActionPreference = "Stop"
$photoPath = Join-Path $PSScriptRoot "sample-portrait.jpg"

if (-not $env:OPENAI_API_KEY) {
    Write-Warning "OPENAI_API_KEY is not set in this shell. The backend server must have it configured."
}

if (-not (Test-Path $photoPath)) {
    Invoke-WebRequest `
        -Uri "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400" `
        -OutFile $photoPath
}

$prompt = switch ($Case) {
    "mixed" { "soft layers around the jaw, make me taller, change my shirt" }
    "unrelated" { "make me taller and change my shirt" }
    "pill-only" { "" }
}

$stylePill = switch ($Case) {
    "mixed" { "Soft layers" }
    "unrelated" { $null }
    "pill-only" { "Sleek and polished" }
}

Write-Host "Case: $Case"
Write-Host "Creating session..."
$sessionArgs = @(
    "-s", "-X", "POST", "$BaseUrl/api/sessions",
    "-F", "photo=@$photoPath",
    "-F", "gender=Woman",
    "-F", "occasion=Work / everyday",
    "-F", "hairLength=Medium",
    "-F", "goal=More volume",
    "-F", "faceShape=Oval",
    "-F", "userPrompt=$prompt"
)
if ($stylePill) {
    $sessionArgs += @("-F", "stylePill=$stylePill")
}

$sessionResp = curl.exe @sessionArgs
$session = $sessionResp | ConvertFrom-Json
if ($session.error) {
    Write-Error "Session create failed: $($session.error)"
}
$sessionId = $session.id
Write-Host "Session: $sessionId"

Write-Host "Generating 4 preview images (this can take several minutes)..."
$generateResp = curl.exe -s -X POST "$BaseUrl/api/sessions/$sessionId/generate"
$generated = $generateResp | ConvertFrom-Json
if ($generated.error) {
    Write-Error "Generate failed: $($generated.error)"
}
if (-not $generated.images -or $generated.images.Count -lt 4) {
    Write-Error "Expected 4 images, got: $generateResp"
}

Write-Host "Generated $($generated.count) images:"
foreach ($url in $generated.images) {
    Write-Host $url
    $head = curl.exe -s -o NUL -w "%{http_code}" -I $url
    if ($head -ne "200") {
        Write-Error "Image URL not reachable ($head): $url"
    }
}

Write-Host "OK - case '$Case' passed."
