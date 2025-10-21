# Performance Optimization Script for Development
# Run this script before starting your dev server

Write-Host "🚀 Next.js Performance Optimization Script" -ForegroundColor Cyan
Write-Host "=========================================`n" -ForegroundColor Cyan

# Check if running from OneDrive
$currentPath = Get-Location
if ($currentPath -like "*OneDrive*") {
    Write-Host "⚠️  WARNING: Project is in OneDrive folder!" -ForegroundColor Yellow
    Write-Host "   This can cause 50-80% slower performance." -ForegroundColor Yellow
    Write-Host "   Consider moving to: C:\Projects\loge`n" -ForegroundColor Yellow
}

# Clear Next.js cache
Write-Host "🧹 Clearing Next.js cache..." -ForegroundColor Green
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "   ✅ .next folder deleted`n" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  No .next folder found`n" -ForegroundColor Gray
}

# Check if .env.development.local exists
Write-Host "📝 Checking environment configuration..." -ForegroundColor Green
if (Test-Path ".env.development.local") {
    Write-Host "   ✅ .env.development.local exists`n" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  .env.development.local not found!" -ForegroundColor Yellow
    Write-Host "   Creating from example...`n" -ForegroundColor Yellow
    Copy-Item ".env.development.local.example" ".env.development.local" -ErrorAction SilentlyContinue
}

# Check Node.js memory
Write-Host "💾 Checking Node.js configuration..." -ForegroundColor Green
$nodeVersion = node --version
Write-Host "   Node.js version: $nodeVersion" -ForegroundColor Gray

# Recommend next steps
Write-Host "`n✨ Optimization Complete!" -ForegroundColor Cyan
Write-Host "========================`n" -ForegroundColor Cyan

Write-Host "🎯 Next Steps:" -ForegroundColor Green
Write-Host "   1. Start dev server: npm run dev (uses Turbopack)" -ForegroundColor White
Write-Host "   2. Open browser: http://localhost:3000" -ForegroundColor White
Write-Host "   3. Test navigation speed`n" -ForegroundColor White

Write-Host "💡 For Maximum Performance:" -ForegroundColor Yellow
Write-Host "   • Move project out of OneDrive to C:\Projects\" -ForegroundColor White
Write-Host "   • Pause OneDrive sync when developing" -ForegroundColor White
Write-Host "   • Close unnecessary programs`n" -ForegroundColor White

Write-Host "📚 Read PERFORMANCE_OPTIMIZATION.md for more tips`n" -ForegroundColor Cyan
