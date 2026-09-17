$ErrorActionPreference = 'Stop'
$atlasRoot = Split-Path -Parent $PSScriptRoot
$atlasExecutable = Join-Path $atlasRoot 'release\角色关系网.exe'
$atlasProcess = Start-Process -FilePath $atlasExecutable -WindowStyle Hidden -PassThru
$atlasDeadline = [DateTime]::UtcNow.AddSeconds(40)
$atlasWindow = $null
while ([DateTime]::UtcNow -lt $atlasDeadline) {
  $atlasTree = @(Get-CimInstance Win32_Process | Where-Object { $_.ProcessId -eq $atlasProcess.Id -or $_.ParentProcessId -eq $atlasProcess.Id })
  $atlasIds = @($atlasTree.ProcessId)
  foreach ($atlasCandidate in Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.Id -in $atlasIds }) {
    if ($atlasCandidate.MainWindowTitle -eq '知交 · 角色关系网') { $atlasWindow = $atlasCandidate; break }
  }
  if ($atlasWindow) { break }
  Start-Sleep -Milliseconds 300
}
if (!$atlasWindow) { throw 'Portable application did not expose its expected main window.' }
$atlasResult = [ordered]@{ passed = $true; windowTitle = $atlasWindow.MainWindowTitle; executable = $atlasExecutable; bytes = (Get-Item -LiteralPath $atlasExecutable).Length }
if (!$atlasWindow.CloseMainWindow()) { throw 'Could not request a graceful application close.' }
if (!$atlasWindow.WaitForExit(15000)) { throw 'Application did not finish its save-and-close handshake.' }
$atlasResult.closedGracefully = $true
$atlasResult | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $atlasRoot 'test-results\portable-result.json') -Encoding utf8
$atlasResult | ConvertTo-Json
