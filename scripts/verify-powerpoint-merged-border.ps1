[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$InputPptx,
    [Parameter(Mandatory = $true)][string]$ReportPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$inputPath = (Resolve-Path -LiteralPath $InputPptx).Path
$reportFile = [System.IO.Path]::GetFullPath($ReportPath)
if (Test-Path -LiteralPath $reportFile) { throw 'The evidence report already exists; choose a new path.' }
if (Get-Process POWERPNT -ErrorAction SilentlyContinue) { throw 'PowerPoint is already running; finish that session before this isolated verification.' }
[System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($reportFile)) | Out-Null

# This is the merged-header fixture in docs/maintainer/fixtures/pptx-office-fidelity.md.
# A full-slide image score and the presence of DrawingML line nodes miss a dropped segment.
function Get-TableBorderPaint($Table, [int]$Row, [int]$Column, [int]$Edge) {
    $border = $Table.Cell($Row, $Column).Borders.Item($Edge)
    return [ordered]@{
        row = $Row
        column = $Column
        edge = $Edge
        visible = [int]$border.Visible
        colorRgb = [int]$border.ForeColor.RGB
        transparency = [double]$border.Transparency
        weightPt = [double]$border.Weight
    }
}

function Get-MergedBorderReport([string]$inputPath) {
    $powerPoint = $null
    $presentation = $null
    $inputStream = [System.IO.File]::OpenRead($inputPath)
    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    try {
        $inputSha256 = [System.BitConverter]::ToString($sha256.ComputeHash($inputStream)).Replace('-', '').ToLowerInvariant()
    } finally {
        $inputStream.Dispose()
        $sha256.Dispose()
    }
    $report = [ordered]@{
        observedAt = [DateTime]::UtcNow.ToString('o')
        passed = $false
        application = 'Microsoft PowerPoint'
        version = $null
        build = $null
        sourceSha256 = $inputSha256
        slide = $null
        borders = @()
        failures = @()
    }
    try {
        $powerPoint = New-Object -ComObject PowerPoint.Application
        $report.version = $powerPoint.Version
        $report.build = $powerPoint.Build
        $presentation = $powerPoint.Presentations.Open($inputPath, $true, $false, $false)
        $matches = @()
        foreach ($slide in $presentation.Slides) {
            foreach ($shape in $slide.Shapes) {
                if ($shape.HasTable -ne -1) { continue }
                $text = $shape.Table.Cell(1, 1).Shape.TextFrame.TextRange.Text
                if ($text.StartsWith('Merged header', [StringComparison]::Ordinal)) {
                    $matches += [pscustomobject]@{ slide = $slide.SlideIndex; table = $shape.Table }
                }
            }
        }
        if ($matches.Count -ne 1) { throw "Expected exactly one merged-header fixture, found $($matches.Count)." }
        $table = $matches[0].table
        $report.slide = $matches[0].slide
        if ($table.Rows.Count -ne 2 -or $table.Columns.Count -ne 2) { throw 'The merged-header fixture must retain two rows and two columns.' }

        # PowerPoint's border indices are ppBorderTop=1 and ppBorderBottom=3.
        $report.borders = @(
            (Get-TableBorderPaint $table 1 1 3),
            (Get-TableBorderPaint $table 2 1 1),
            (Get-TableBorderPaint $table 2 2 1)
        )
        $paintTolerance = 0.0001
        $expected = $report.borders[0]
        foreach ($border in $report.borders) {
            if ($border.visible -ne -1 -or $border.colorRgb -lt 0 -or $border.transparency -lt 0 -or $border.transparency -ge 1 -or $border.weightPt -le 0) {
                $report.failures += "Cell $($border.row),$($border.column) has a missing or mixed separator."
                continue
            }
            if ($border.colorRgb -ne $expected.colorRgb -or [Math]::Abs($border.transparency - $expected.transparency) -gt $paintTolerance -or [Math]::Abs($border.weightPt - $expected.weightPt) -gt $paintTolerance) {
                $report.failures += "Cell $($border.row),$($border.column) does not share the merged header's separator paint."
            }
        }
        $headerWidth = $table.Cell(1, 1).Shape.Width
        $bodyWidth = $table.Cell(2, 1).Shape.Width + $table.Cell(2, 2).Shape.Width
        if ([Math]::Abs($headerWidth - $bodyWidth) -gt 0.01) { $report.failures += 'The header no longer spans both body columns.' }
        $report.passed = $report.failures.Count -eq 0
    } catch {
        $report.failures += $_.Exception.Message
    } finally {
        $matches = $null
        $table = $null
        $shape = $null
        $slide = $null
        try {
            if ($null -ne $presentation) {
                try { $presentation.Close() }
                finally { [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($presentation) }
            }
        } finally {
            if ($null -ne $powerPoint) {
                try { $powerPoint.Quit() }
                finally { [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($powerPoint) }
            }
        }
    }
    return $report
}

$report = Get-MergedBorderReport $inputPath
# Function scope releases Office's hidden collection enumerators before collecting RCWs.
[GC]::Collect()
[GC]::WaitForPendingFinalizers()
foreach ($process in @(Get-Process POWERPNT -ErrorAction SilentlyContinue)) {
    if (-not $process.WaitForExit(5000)) {
        $report.failures += 'The verification PowerPoint process did not finish shutting down.'
        $report.passed = $false
    }
    $process.Dispose()
}
$json = $report | ConvertTo-Json -Depth 8
[System.IO.File]::WriteAllText($reportFile, $json + "`n", (New-Object System.Text.UTF8Encoding($false)))
Write-Output $json
if (-not $report.passed) { throw 'PowerPoint merged-border verification failed; see the recorded failures.' }
