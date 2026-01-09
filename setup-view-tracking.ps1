# View Tracking Setup Script for Windows PowerShell
# Run this script to set up the view tracking system

Write-Host "🚀 Setting up View Tracking System..." -ForegroundColor Cyan
Write-Host ""

# Check if npm is installed
Write-Host "📦 Checking dependencies..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✅ npm is installed (version $npmVersion)" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Install required packages
Write-Host ""
Write-Host "📦 Installing required packages..." -ForegroundColor Yellow
npm install uuid
npm install --save-dev @types/uuid

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Packages installed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install packages" -ForegroundColor Red
    exit 1
}

# Display next steps
Write-Host ""
Write-Host "✅ View Tracking System files are ready!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Open Supabase Dashboard (https://app.supabase.com)" -ForegroundColor White
Write-Host "2. Go to SQL Editor" -ForegroundColor White
Write-Host "3. Run the following SQL files in order:" -ForegroundColor White
Write-Host "   a. create-views-table.sql" -ForegroundColor Yellow
Write-Host "   b. create-view-functions.sql" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. Test the system:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Yellow
Write-Host "   Visit any artwork page and check browser console" -ForegroundColor Yellow
Write-Host ""
Write-Host "📖 For detailed instructions, see: VIEW_TRACKING_SETUP.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎉 Setup complete! Happy tracking!" -ForegroundColor Green
