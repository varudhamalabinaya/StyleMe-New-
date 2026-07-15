param(
    [string]$SessionId = "6a922531-e011-4374-b2d8-e0ed7adf04a7",
    [string]$LanBaseUrl = "http://192.168.137.32:8080"
)

$ErrorActionPreference = "Stop"

Write-Host "=== StyleMe image URL verification ==="
Write-Host "Session: $SessionId"
Write-Host ""

$sessionDir = Join-Path $PSScriptRoot "..\uploads\sessions\$SessionId"
Write-Host "[1] Disk files under uploads/sessions/$SessionId"
if (-not (Test-Path $sessionDir)) {
    Write-Host "FAIL: session directory missing: $sessionDir"
    exit 1
}

Get-ChildItem $sessionDir -File | ForEach-Object {
    $bytes = [System.IO.File]::ReadAllBytes($_.FullName)
    $magic = [BitConverter]::ToString($bytes[0..3])
    Write-Host "  OK  $($_.Name) bytes=$($_.Length) magic=$magic"
}

Write-Host ""
Write-Host "[2] HTTP GET for generated PNGs"
$urls = 1..4 | ForEach-Object { "$LanBaseUrl/uploads/sessions/$SessionId/generated-$_.png" }
$allOk = $true
foreach ($url in $urls) {
    try {
        $resp = Invoke-WebRequest -Uri $url -Method GET -UseBasicParsing -TimeoutSec 20
        $ct = $resp.Headers['Content-Type']
        $magic = [BitConverter]::ToString($resp.Content[0..3])
        $isPng = $magic -eq '89-50-4E-47'
        Write-Host "  OK  $url"
        Write-Host "      status=$($resp.StatusCode) contentType=$ct bytes=$($resp.RawContentLength) png=$isPng"
        if (-not $isPng) { $allOk = $false }
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        Write-Host "  FAIL $url status=$status"
        $allOk = $false
    }
}

if (-not $allOk) { exit 1 }
Write-Host ""
Write-Host "All checks passed."
