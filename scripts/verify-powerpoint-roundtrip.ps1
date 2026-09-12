[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$InputPptx,
    [Parameter(Mandatory = $true)][string]$OutputDirectory,
    [string]$ExpectedCellText = 'Contract',
    [string]$ReplacementText = 'Contract verified'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$inputPath = (Resolve-Path -LiteralPath $InputPptx).Path
$outputRoot = [System.IO.Path]::GetFullPath($OutputDirectory)
$outputPath = Join-Path $outputRoot (([System.IO.Path]::GetFileNameWithoutExtension($inputPath)) + '.roundtrip.pptx')
if ($inputPath -eq $outputPath) { throw 'Roundtrip output must differ from the input file.' }
if (Test-Path -LiteralPath $outputPath) { throw 'Roundtrip output already exists; choose a new evidence directory.' }
if (Get-Process POWERPNT -ErrorAction SilentlyContinue) { throw 'PowerPoint is already running; finish that session before this isolated verification.' }
[System.IO.Directory]::CreateDirectory($outputRoot) | Out-Null

$powerPoint = $null
$presentation = $null
function Get-Sha256Digest([string]$Path) {
    $stream = [System.IO.File]::OpenRead($Path)
    $algorithm = [System.Security.Cryptography.SHA256]::Create()
    try {
        $digest = [System.BitConverter]::ToString($algorithm.ComputeHash($stream)).Replace('-', '').ToLowerInvariant()
    } finally {
        $stream.Dispose()
        $algorithm.Dispose()
    }
    return $digest
}

try {
    $powerPoint = New-Object -ComObject PowerPoint.Application
    $presentation = $powerPoint.Presentations.Open($inputPath, $false, $false, $false)
    $slideCount = $presentation.Slides.Count
    $tableCount = 0
    $changedCells = 0
    $cjkCellsBefore = 0
    foreach ($slide in $presentation.Slides) {
        foreach ($shape in $slide.Shapes) {
            if ($shape.HasTable -ne -1) { continue }
            $tableCount++
            for ($row = 1; $row -le $shape.Table.Rows.Count; $row++) {
                for ($column = 1; $column -le $shape.Table.Columns.Count; $column++) {
                    $range = $shape.Table.Cell($row, $column).Shape.TextFrame.TextRange
                    if ($range.Text -match '[\u4E00-\u9FFF]') { $cjkCellsBefore++ }
                    if ($range.Text.Trim() -eq $ExpectedCellText) {
                        $range.Text = $ReplacementText
                        $changedCells++
                    }
                }
            }
        }
    }
    if ($changedCells -ne 1) { throw "Expected exactly one editable matching cell, found $changedCells." }
    $presentation.SaveAs($outputPath, 24)
    $presentation.Close()
    $presentation = $null
    $presentation = $powerPoint.Presentations.Open($outputPath, $true, $false, $false)
    $reopenedMatches = 0
    $cjkCellsAfter = 0
    foreach ($slide in $presentation.Slides) {
        foreach ($shape in $slide.Shapes) {
            if ($shape.HasTable -ne -1) { continue }
            for ($row = 1; $row -le $shape.Table.Rows.Count; $row++) {
                for ($column = 1; $column -le $shape.Table.Columns.Count; $column++) {
                    $text = $shape.Table.Cell($row, $column).Shape.TextFrame.TextRange.Text
                    if ($text.Trim() -eq $ReplacementText) { $reopenedMatches++ }
                    if ($text -match '[\u4E00-\u9FFF]') { $cjkCellsAfter++ }
                }
            }
        }
    }
    if ($reopenedMatches -ne 1 -or $presentation.Slides.Count -ne $slideCount -or $cjkCellsAfter -ne $cjkCellsBefore) {
        throw 'Native table edit, slide count, or CJK text changed during Office save/reopen.'
    }
    $imagesPath = Join-Path $outputRoot 'reopened'
    $presentation.Export($imagesPath, 'PNG', 1920, 1080)
    $report = [ordered]@{
        passed = $true
        application = 'Microsoft PowerPoint'
        version = $powerPoint.Version
        build = $powerPoint.Build
        sourceSha256 = (Get-Sha256Digest $inputPath)
        roundtripSha256 = (Get-Sha256Digest $outputPath)
        slideCount = $slideCount
        nativeTableCount = $tableCount
        editedCellCount = $changedCells
        reopenedMatchingCellCount = $reopenedMatches
        cjkTableCellCountBefore = $cjkCellsBefore
        cjkTableCellCountAfter = $cjkCellsAfter
        pngCount = @(Get-ChildItem -LiteralPath $imagesPath -Filter '*.PNG' -File).Count
    }
    $json = $report | ConvertTo-Json -Depth 8
    [System.IO.File]::WriteAllText((Join-Path $outputRoot 'roundtrip.json'), $json + "`n", (New-Object System.Text.UTF8Encoding($false)))
    Write-Output $json
} finally {
    if ($null -ne $presentation) { $presentation.Close() }
    if ($null -ne $powerPoint) { $powerPoint.Quit() }
}
