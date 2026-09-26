param(
    [string]$sourcePath = "logo.png",
    [string]$resDir = "android/app/src/main/res"
)

# Load System.Drawing assembly
Add-Type -AssemblyName System.Drawing

if (-not (Test-Path $sourcePath)) {
    Write-Host "Source image $sourcePath not found." -ForegroundColor Red
    Exit 1
}

if (-not (Test-Path $resDir)) {
    Write-Host "Destination resource directory $resDir not found." -ForegroundColor Red
    Exit 1
}

# Load the source image
$srcImg = [System.Drawing.Image]::FromFile($sourcePath)

# Mipmap folder configurations and sizes
$targets = @(
    @{ Folder = "mipmap-mdpi"; Size = 48 },
    @{ Folder = "mipmap-hdpi"; Size = 72 },
    @{ Folder = "mipmap-xhdpi"; Size = 96 },
    @{ Folder = "mipmap-xxhdpi"; Size = 144 },
    @{ Folder = "mipmap-xxxhdpi"; Size = 192 }
)

# Background color for legacy/round icons (#0b0f19)
$bgColor = [System.Drawing.ColorTranslator]::FromHtml("#0b0f19")

foreach ($t in $targets) {
    $folderPath = Join-Path $resDir $t.Folder
    if (-not (Test-Path $folderPath)) {
        New-Item -ItemType Directory -Path $folderPath -Force | Out-Null
    }
    
    $size = $t.Size
    
    # 1. Legacy Square Icon (ic_launcher.png) - Center on background color, taking 85% of space
    $bmpLegacy = New-Object System.Drawing.Bitmap $size, $size
    $gLegacy = [System.Drawing.Graphics]::FromImage($bmpLegacy)
    $gLegacy.Clear($bgColor)
    $gLegacy.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    
    $scaleSize = [int]($size * 0.85)
    $offset = [int](($size - $scaleSize) / 2)
    $gLegacy.DrawImage($srcImg, $offset, $offset, $scaleSize, $scaleSize)
    
    $legacyPath = Join-Path $folderPath "ic_launcher.png"
    if (Test-Path $legacyPath) { Remove-Item $legacyPath -Force }
    $bmpLegacy.Save($legacyPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $gLegacy.Dispose()
    $bmpLegacy.Dispose()
    
    # 2. Round Icon (ic_launcher_round.png) - Centered stopwatch on round slate background
    $bmpRound = New-Object System.Drawing.Bitmap $size, $size
    $gRound = [System.Drawing.Graphics]::FromImage($bmpRound)
    
    $gRound.Clear([System.Drawing.Color]::Transparent)
    $gRound.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddEllipse(0, 0, $size, $size)
    $brush = New-Object System.Drawing.SolidBrush $bgColor
    $gRound.FillPath($brush, $path)
    
    $gRound.DrawImage($srcImg, $offset, $offset, $scaleSize, $scaleSize)
    
    $roundPath = Join-Path $folderPath "ic_launcher_round.png"
    if (Test-Path $roundPath) { Remove-Item $roundPath -Force }
    $bmpRound.Save($roundPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $brush.Dispose()
    $path.Dispose()
    $gRound.Dispose()
    $bmpRound.Dispose()
    
    # 3. Adaptive Foreground Icon (ic_launcher_foreground.png) - Transparent background, center stopwatch taking 65% of space (safe zone)
    $bmpFore = New-Object System.Drawing.Bitmap $size, $size
    $gFore = [System.Drawing.Graphics]::FromImage($bmpFore)
    $gFore.Clear([System.Drawing.Color]::Transparent)
    $gFore.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    
    $foreScaleSize = [int]($size * 0.65)
    $foreOffset = [int](($size - $foreScaleSize) / 2)
    $gFore.DrawImage($srcImg, $foreOffset, $foreOffset, $foreScaleSize, $foreScaleSize)
    
    $forePath = Join-Path $folderPath "ic_launcher_foreground.png"
    if (Test-Path $forePath) { Remove-Item $forePath -Force }
    $bmpFore.Save($forePath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $gFore.Dispose()
    $bmpFore.Dispose()
}

$srcImg.Dispose()

# 4. Modify ic_launcher_background.xml to set background to our dark slate color (#0b0f19)
$bgXmlPath = Join-Path $resDir "values/ic_launcher_background.xml"
if (Test-Path $bgXmlPath) {
    $xmlContent = @"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#0b0f19</color>
</resources>
"@
    Set-Content -Path $bgXmlPath -Value $xmlContent -Force
}

Write-Host "App icons successfully generated and applied!" -ForegroundColor Green
