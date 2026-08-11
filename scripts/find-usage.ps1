# --- Configuration ---
# Get the directory where this script is located
$scriptDir = $PSScriptRoot
# Get the project root (one level up from scripts)
$rootDir = Split-Path -Parent $scriptDir

Write-Host "🚀 Starting Usage Finder Script..." -ForegroundColor Cyan
Write-Host "Project Root: $rootDir"
Write-Host "============================================="

# Define the checks for each app
$checks = @(
    @{
        AppName = "Web App";
        Path = "apps\web\src";
        Files = @("calculateTax.jsx", "currency.jsx", "formateDate.jsx")
    },
    @{
        AppName = "Desktop App";
        Path = "apps\desktop\src";
        Files = @("calculateTax.jsx", "currency.jsx", "formateDate.jsx")
    },
    @{
        AppName = "Mobile App";
        Path = "apps\mobile\src";
        Files = @("calculateTax.js", "currency.js", "formateDate.js", "GstCalculator.js")
    }
)

foreach ($check in $checks) {
    $fullPath = Join-Path $rootDir $check.Path
    Write-Host "`n📂 Checking $($check.AppName)..." -ForegroundColor Magenta
    
    if (-not (Test-Path $fullPath)) {
        Write-Host "  ❌ Path not found: $fullPath" -ForegroundColor Red
        continue
    }

    foreach ($file in $check.Files) {
        # Search for the name without extension (e.g., "calculateTax") because imports often omit extensions
        $fileNameWithoutExt = [System.IO.Path]::GetFileNameWithoutExtension($file)
        Write-Host "  🔍 Checking usage of: '$file'"
        
        # Find all JS/JSX files in the directory recursively
        $sourceFiles = Get-ChildItem -Path $fullPath -Recurse -Include *.js,*.jsx
        
        $found = $false
        foreach ($sourceFile in $sourceFiles) {
            # Skip the file itself (don't find the definition as a usage)
            if ($sourceFile.Name -eq $file) { continue }
            
            # Read content and check for the import
            $content = Get-Content $sourceFile.FullName -Raw
            if ($content -match $fileNameWithoutExt) {
                $relativePath = $sourceFile.FullName.Substring($fullPath.Length)
                Write-Host "    🟡 Found usage in: ..$relativePath" -ForegroundColor Yellow
                $found = $true
            }
        }
        
        if (-not $found) {
            Write-Host "    🟢 Safe to delete (No usage found)." -ForegroundColor Green
        }
    }
}

Write-Host "`n============================================="
Write-Host "✅ Scan Complete." -ForegroundColor Cyan
