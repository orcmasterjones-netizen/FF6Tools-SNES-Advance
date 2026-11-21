# A clean USA retail input exercises conversion as well as all Regular editor checks.
param([Parameter(Mandatory=$true)][string]$Rom,
      [ValidateSet('chrome','msedge','firefox')][string[]]$Browsers=@('msedge','firefox'))
$ErrorActionPreference='Stop'
if ($env:OS -ne 'Windows_NT') { throw "This matrix records native Windows results." }
$inputRom=(Resolve-Path -LiteralPath $Rom).Path
$run=Join-Path ([System.IO.Path]::GetTempPath()) ('ff6tools-'+[guid]::NewGuid())
New-Item -ItemType Directory -Path $run | Out-Null
$failed=@()
foreach ($browser in $Browsers) {
    $target=Join-Path $run $browser
    python (Join-Path $PSScriptRoot 'browser_test.py') $inputRom $target $browser
    if ($LASTEXITCODE -ne 0) { $failed+=$browser; continue }
    Copy-Item -LiteralPath (Join-Path $target 'browser-report.json') -Destination (Join-Path $run ($browser+'-report.json'))
    # The test inputs/outputs below are generated copies in our private temp directory.
    Remove-Item -LiteralPath $target -Force -Recurse
}
Write-Output "Individual browser reports are in $run."
if ($failed.Count) { throw ("Browser tests did not complete for "+($failed -join ', ')+". Failure artifacts remain in that browser's temp folder.") }
