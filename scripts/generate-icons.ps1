Add-Type -AssemblyName System.Drawing

function Create-BaytnaIcon {
    param(
        [int]$size,
        [string]$outputPath,
        [bool]$maskable = $false
    )
    
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Background gradient
    $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $c1 = [System.Drawing.ColorTranslator]::FromHtml('#E11D48')
    $c2 = [System.Drawing.ColorTranslator]::FromHtml('#9F1239')
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $c1, $c2, 45.0)
    
    if ($maskable) {
        $g.FillRectangle($brush, $rect)
    } else {
        $radius = [int]($size * 0.22)
        $path = New-Object System.Drawing.Drawing2D.GraphicsPath
        $path.AddArc(0, 0, $radius * 2, $radius * 2, 180, 90)
        $path.AddArc($size - $radius * 2, 0, $radius * 2, $radius * 2, 270, 90)
        $path.AddArc($size - $radius * 2, $size - $radius * 2, $radius * 2, $radius * 2, 0, 90)
        $path.AddArc(0, $size - $radius * 2, $radius * 2, $radius * 2, 90, 90)
        $path.CloseFigure()
        $g.FillPath($brush, $path)
    }

    $scale = $size / 100.0
    $cx = $size / 2.0
    $cy = ($size / 2.0) - (2.0 * $scale)

    # House Roof over heart
    $roofPen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, [Math]::Max(2, [int](4.5 * $scale)))
    $roofPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $roofPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    
    $pLeft = New-Object System.Drawing.PointF([float]($cx - 28.0 * $scale), [float]($cy - 8.0 * $scale))
    $pApex = New-Object System.Drawing.PointF([float]$cx, [float]($cy - 28.0 * $scale))
    $pRight = New-Object System.Drawing.PointF([float]($cx + 28.0 * $scale), [float]($cy - 8.0 * $scale))
    $g.DrawLine($roofPen, $pLeft, $pApex)
    $g.DrawLine($roofPen, $pApex, $pRight)

    # Chimney
    $chimneyPen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, [Math]::Max(2, [int](3.5 * $scale)))
    $chimneyPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Square
    $chimneyPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Square
    $pC1 = New-Object System.Drawing.PointF([float]($cx + 15.0 * $scale), [float]($cy - 18.0 * $scale))
    $pC2 = New-Object System.Drawing.PointF([float]($cx + 15.0 * $scale), [float]($cy - 28.0 * $scale))
    $g.DrawLine($chimneyPen, $pC1, $pC2)

    # Heart shape inside
    $hPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $hPath.AddArc([float]($cx - 20.0 * $scale), [float]($cy - 10.0 * $scale), [float](20.0 * $scale), [float](20.0 * $scale), 140, 220)
    $hPath.AddArc([float]$cx, [float]($cy - 10.0 * $scale), [float](20.0 * $scale), [float](20.0 * $scale), 180, 220)
    $hPath.AddLine([float]($cx + 18.0 * $scale), [float]($cy + 6.0 * $scale), [float]$cx, [float]($cy + 26.0 * $scale))
    $hPath.AddLine([float]$cx, [float]($cy + 26.0 * $scale), [float]($cx - 18.0 * $scale), [float]($cy + 6.0 * $scale))
    $hPath.CloseFigure()

    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $g.FillPath($whiteBrush, $hPath)

    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Generated: $outputPath ($size x $size)"
}

Create-BaytnaIcon -size 192 -outputPath 'public/icons/icon-192.png'
Create-BaytnaIcon -size 512 -outputPath 'public/icons/icon-512.png'
Create-BaytnaIcon -size 512 -outputPath 'public/icons/icon-maskable.png' -maskable $true
Create-BaytnaIcon -size 180 -outputPath 'public/icons/apple-touch-icon.png'
Create-BaytnaIcon -size 64 -outputPath 'public/icons/favicon-64.png'
Create-BaytnaIcon -size 32 -outputPath 'public/favicon.ico'
