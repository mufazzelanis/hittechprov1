# Builds every logo/icon asset from brand\logo-original.jpg (the owner's logo on yellow).
# Run from the project root:   powershell -ExecutionPolicy Bypass -File scripts\make-logo-assets.ps1
#
# Outputs
#   public\logo-mark.png            transparent "ht" mark (navbar, footer, admin)
#   public\icons\icon-*.png         app icons (yellow tile + mark): 180, 192, 512, maskable 512
#   public\icons\favicon.png        default favicon (replaceable in Admin -> Settings -> Branding)
#   app\opengraph-image.png         1200x630 social share image (+ twitter-image.png)
#
# The yellow background is removed by treating each pixel as a blend of the background yellow and
# one of the two letter colours, which keeps anti-aliased edges clean.

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

Add-Type -TypeDefinition @"
using System;
public static class Keyer {
  public static void Key(byte[] px, double[] Y, double[] C, double[] L) {
    double[][] fgs = new double[][] { C, L };
    for (int i = 0; i < px.Length; i += 4) {
      double b = px[i], g = px[i + 1], r = px[i + 2];
      double bestErr = double.MaxValue, bestT = 0; double[] bestF = C;
      foreach (double[] F in fgs) {
        double vr = F[0] - Y[0], vg = F[1] - Y[1], vb = F[2] - Y[2];
        double dr = r - Y[0], dg = g - Y[1], db = b - Y[2];
        double t = (dr * vr + dg * vg + db * vb) / (vr * vr + vg * vg + vb * vb);
        double tc = Math.Max(0, Math.Min(1, t));
        double er = dr - tc * vr, eg = dg - tc * vg, eb = db - tc * vb;
        double err = er * er + eg * eg + eb * eb;
        if (err < bestErr) { bestErr = err; bestT = tc; bestF = F; }
      }
      double a = bestT;
      if (a < 0.05) a = 0; else if (a > 0.95) a = 1;
      px[i] = (byte)bestF[2]; px[i + 1] = (byte)bestF[1]; px[i + 2] = (byte)bestF[0];
      px[i + 3] = (byte)Math.Round(a * 255);
    }
  }
}
"@

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
$srcPath = Join-Path $root "brand\logo-original.jpg"
$src = [System.Drawing.Bitmap]::new($srcPath)
$W = $src.Width; $H = $src.Height
$k = $W / 2000.0

function Px($x, $y) { $c = $src.GetPixel([int]($x * $k), [int]($y * $k)); return ,@([double]$c.R, [double]$c.G, [double]$c.B) }
$Y = Px 30 30          # background yellow
$C = Px 520 1000       # cyan "h"
$L = Px 1000 1150      # lavender "t"
$bgColor = [System.Drawing.Color]::FromArgb(255, [int]$Y[0], [int]$Y[1], [int]$Y[2])

# --- key out the background -------------------------------------------------
$rect = [System.Drawing.Rectangle]::new(0, 0, $W, $H)
$data = $src.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$bytes = New-Object byte[] ($data.Stride * $H)
[System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $bytes.Length)
$src.UnlockBits($data)
[Keyer]::Key($bytes, $Y, $C, $L)

# keep only the monogram area, and drop the small "Pro" text (bottom right) for the icon mark
$x0 = 380; $x1 = 1690; $y0 = 400; $y1 = 1490   # tagline starts near y=1520
$stride = $data.Stride
for ($y = 0; $y -lt $H; $y++) {
  for ($x = 0; $x -lt $W; $x++) {
    $outside = ($x -lt $x0 -or $x -gt $x1 -or $y -lt $y0 -or $y -gt $y1)
    $pro = ($x -ge 1500 -and $y -ge 1300)   # the small "Pro" sits below-right of the arc
    if ($outside -or $pro) { $bytes[$y * $stride + $x * 4 + 3] = 0 }
  }
}

$keyed = [System.Drawing.Bitmap]::new($W, $H, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$d2 = $keyed.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::WriteOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
[System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $d2.Scan0, $bytes.Length)
$keyed.UnlockBits($d2)

# tight bounding box of visible pixels
$minX = $W; $minY = $H; $maxX = 0; $maxY = 0
for ($y = 0; $y -lt $H; $y++) { for ($x = 0; $x -lt $W; $x++) {
  if ($bytes[$y * $stride + $x * 4 + 3] -gt 24) { if ($x -lt $minX) { $minX = $x }; if ($x -gt $maxX) { $maxX = $x }; if ($y -lt $minY) { $minY = $y }; if ($y -gt $maxY) { $maxY = $y } }
} }
$box = [System.Drawing.Rectangle]::new($minX, $minY, $maxX - $minX + 1, $maxY - $minY + 1)
$mark = $keyed.Clone($box, $keyed.PixelFormat)
Write-Host "mark box: $($box.Width) x $($box.Height)"

function New-Canvas($w, $h, $fill) {
  $b = [System.Drawing.Bitmap]::new($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($b)
  $g.SmoothingMode = "HighQuality"; $g.InterpolationMode = "HighQualityBicubic"; $g.PixelOffsetMode = "HighQuality"
  if ($fill) { $g.Clear($fill) }
  return @{ Bitmap = $b; G = $g }
}

# --- transparent mark for the site UI ----------------------------------------
$mh = 256; $mw = [int]([math]::Round($mark.Width * $mh / $mark.Height))
$c = New-Canvas $mw $mh $null
$c.G.DrawImage($mark, 0, 0, $mw, $mh)
$c.Bitmap.Save((Join-Path $root "public\logo-mark.png"), [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "logo-mark.png ${mw}x${mh}"

# --- app icons: yellow tile + mark -------------------------------------------
function Save-Icon($path, $size, $frac) {
  $c = New-Canvas $size $size $bgColor
  $w = $size * $frac; $h = $w * $mark.Height / $mark.Width
  $c.G.DrawImage($mark, [single](($size - $w) / 2), [single](($size - $h) / 2), [single]$w, [single]$h)
  $c.Bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
}
New-Item -ItemType Directory -Force -Path (Join-Path $root "public\icons") | Out-Null
Save-Icon (Join-Path $root "public\icons\icon-180.png") 180 0.66
Save-Icon (Join-Path $root "public\icons\icon-192.png") 192 0.66
Save-Icon (Join-Path $root "public\icons\icon-512.png") 512 0.66
Save-Icon (Join-Path $root "public\icons\icon-maskable-512.png") 512 0.5   # inside the 80% maskable safe zone
Save-Icon (Join-Path $root "public\icons\favicon.png") 192 0.7

# --- social share image (uses the original artwork incl. tagline) ------------
$og = New-Canvas 1200 630 $bgColor
$srcRect = [System.Drawing.Rectangle]::new(0, 350, $W, 1260)
$dw = [int]($W * 630 / 1260)
$og.G.DrawImage($src, [System.Drawing.Rectangle]::new([int]((1200 - $dw) / 2), 0, $dw, 630), $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
$og.Bitmap.Save((Join-Path $root "app\opengraph-image.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$og.Bitmap.Save((Join-Path $root "app\twitter-image.png"), [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "done"
