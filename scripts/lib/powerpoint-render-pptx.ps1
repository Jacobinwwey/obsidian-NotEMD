param(
    [Parameter(Mandatory = $true)][string]$PptxPath,
    [Parameter(Mandatory = $true)][string]$OutputDirectory,
    [Parameter(Mandatory = $true)][int]$Width,
    [Parameter(Mandatory = $true)][int]$Height
)

$ErrorActionPreference = 'Stop'

if (Test-Path $OutputDirectory) {
    Remove-Item -Recurse -Force $OutputDirectory
}
New-Item -ItemType Directory -Path $OutputDirectory | Out-Null

$powerPoint = $null
$presentation = $null

try {
    $powerPoint = New-Object -ComObject PowerPoint.Application
    $powerPoint.Visible = -1
    $presentation = $powerPoint.Presentations.Open($PptxPath)
    $slideCount = $presentation.Slides.Count
    $presentation.Export($OutputDirectory, 'PNG', $Width, $Height)
    [pscustomobject]@{
        slideCount = $slideCount
        outputDirectory = $OutputDirectory
    } | ConvertTo-Json -Compress
} finally {
    if ($presentation -ne $null) {
        $presentation.Close()
    }
    if ($powerPoint -ne $null) {
        $powerPoint.Quit()
    }
}
