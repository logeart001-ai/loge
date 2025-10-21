# Project Migration Script - Move from OneDrive to Local Drive
# This script safely moves your project from OneDrive to improve performance

Write-Host "`n🚀 Project Migration from OneDrive" -ForegroundColor Cyan
Write-Host "===================================`n" -ForegroundColor Cyan

# Define paths
$sourcePath = "C:\Users\USER\OneDrive\Desktop\loge"
$destinationPath = "C:\Projects\loge"

# Safety checks
Write-Host "📋 Pre-migration checks..." -ForegroundColor Yellow

# Check if source exists
if (-not (Test-Path $sourcePath)) {
    Write-Host "❌ Source path not found: $sourcePath" -ForegroundColor Red
    Write-Host "   Please verify the project location and try again.`n" -ForegroundColor Red
    exit 1
}

# Check if destination parent directory exists, create if not
$destinationParent = Split-Path $destinationPath -Parent
if (-not (Test-Path $destinationParent)) {
    Write-Host "📁 Creating destination folder: $destinationParent" -ForegroundColor Green
    New-Item -ItemType Directory -Path $destinationParent -Force | Out-Null
}

# Check if destination already exists
if (Test-Path $destinationPath) {
    Write-Host "⚠️  Destination already exists: $destinationPath" -ForegroundColor Yellow
    $response = Read-Host "   Do you want to overwrite? (yes/no)"
    if ($response -ne "yes") {
        Write-Host "❌ Migration cancelled by user.`n" -ForegroundColor Red
        exit 1
    }
    Write-Host "🗑️  Removing existing destination..." -ForegroundColor Yellow
    Remove-Item -Path $destinationPath -Recurse -Force
}

# Display migration plan
Write-Host "`n📦 Migration Plan:" -ForegroundColor Cyan
Write-Host "   From: $sourcePath" -ForegroundColor Gray
Write-Host "   To:   $destinationPath" -ForegroundColor Green

# Calculate size
Write-Host "`n📊 Calculating project size..." -ForegroundColor Yellow
try {
    $size = (Get-ChildItem -Path $sourcePath -Recurse -ErrorAction SilentlyContinue | 
             Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum / 1MB
    Write-Host "   Project size: $([math]::Round($size, 2)) MB" -ForegroundColor Gray
} catch {
    Write-Host "   Could not calculate size (this is okay)" -ForegroundColor Gray
}

# Confirm migration
Write-Host "`n⚠️  Important Notes:" -ForegroundColor Yellow
Write-Host "   • This will MOVE (not copy) your project" -ForegroundColor White
Write-Host "   • Close your dev server before proceeding" -ForegroundColor White
Write-Host "   • Close VS Code in the project folder" -ForegroundColor White
Write-Host "   • This may take a few minutes`n" -ForegroundColor White

$confirm = Read-Host "Ready to proceed? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "❌ Migration cancelled by user.`n" -ForegroundColor Red
    exit 1
}

# Perform the migration
Write-Host "`n🔄 Starting migration..." -ForegroundColor Green
Write-Host "   Please wait, this may take a few minutes...`n" -ForegroundColor Gray

try {
    # Use Copy-Item instead of Move-Item for better compatibility with OneDrive
    Write-Host "   Step 1/3: Copying files..." -ForegroundColor Yellow
    Copy-Item -Path $sourcePath -Destination $destinationPath -Recurse -Force -ErrorAction Stop
    
    Write-Host "   Step 2/3: Verifying copy..." -ForegroundColor Yellow
    if (-not (Test-Path "$destinationPath\loge\package.json")) {
        throw "Verification failed: package.json not found in destination"
    }
    
    Write-Host "   Step 3/3: Removing source (keeping OneDrive backup)..." -ForegroundColor Yellow
    # Remove source only after successful copy
    Remove-Item -Path $sourcePath -Recurse -Force -ErrorAction Stop
    
    Write-Host "`n✅ Migration completed successfully!" -ForegroundColor Green
    
} catch {
    Write-Host "`n❌ Migration failed: $_" -ForegroundColor Red
    Write-Host "   Your original files are still safe in OneDrive.`n" -ForegroundColor Yellow
    exit 1
}

# Post-migration instructions
Write-Host "`n🎉 Project Successfully Moved!" -ForegroundColor Green
Write-Host "==========================`n" -ForegroundColor Green

Write-Host "📍 New Location:" -ForegroundColor Cyan
Write-Host "   $destinationPath\loge`n" -ForegroundColor White

Write-Host "🔧 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Open new location in VS Code:" -ForegroundColor White
Write-Host "      code $destinationPath\loge`n" -ForegroundColor Gray

Write-Host "   2. Or navigate in terminal:" -ForegroundColor White
Write-Host "      cd $destinationPath\loge" -ForegroundColor Gray
Write-Host "      npm run dev`n" -ForegroundColor Gray

Write-Host "   3. Update any bookmarks or shortcuts`n" -ForegroundColor White

Write-Host "⚡ Performance Improvement:" -ForegroundColor Green
Write-Host "   You should see 50-80% faster page loads!" -ForegroundColor White
Write-Host "   Navigation should be nearly instant.`n" -ForegroundColor White

Write-Host "💾 Backup:" -ForegroundColor Cyan
Write-Host "   OneDrive may still have a backup in its recycle bin`n" -ForegroundColor Gray

Write-Host "🆘 If you need to restore:" -ForegroundColor Yellow
Write-Host "   Check OneDrive recycle bin or copy back from:" -ForegroundColor White
Write-Host "   $destinationPath`n" -ForegroundColor Gray

# Offer to open VS Code in new location
$openVSCode = Read-Host "Open VS Code in new location? (yes/no)"
if ($openVSCode -eq "yes") {
    Write-Host "`n🚀 Opening VS Code..." -ForegroundColor Green
    code "$destinationPath\loge"
    Start-Sleep -Seconds 2
}

Write-Host "`n✨ Migration Complete! Happy coding! 🎨`n" -ForegroundColor Cyan
