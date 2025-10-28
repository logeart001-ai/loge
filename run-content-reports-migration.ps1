# PowerShell script to run content_reports table migration
Write-Host "Running content_reports table migration..." -ForegroundColor Cyan

# Read the SQL file
$sqlContent = Get-Content "scripts\09-create-content-reports-table.sql" -Raw

# Check if SUPABASE_URL and SUPABASE_ANON_KEY are set
if (-not $env:NEXT_PUBLIC_SUPABASE_URL -or -not $env:NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    Write-Host "Error: Supabase environment variables not found in .env.local" -ForegroundColor Red
    Write-Host "Please ensure .env.local contains:" -ForegroundColor Yellow
    Write-Host "  NEXT_PUBLIC_SUPABASE_URL" -ForegroundColor Yellow
    Write-Host "  NEXT_PUBLIC_SUPABASE_ANON_KEY" -ForegroundColor Yellow
    exit 1
}

Write-Host "`nPlease run this SQL in your Supabase Dashboard:" -ForegroundColor Yellow
Write-Host "1. Go to: https://supabase.com/dashboard" -ForegroundColor White
Write-Host "2. Select your project" -ForegroundColor White
Write-Host "3. Click 'SQL Editor' in the sidebar" -ForegroundColor White
Write-Host "4. Click 'New Query'" -ForegroundColor White
Write-Host "5. Copy the content from: scripts\09-create-content-reports-table.sql" -ForegroundColor White
Write-Host "6. Paste and click 'Run'" -ForegroundColor White
Write-Host "`nAlternatively, you can use the Supabase CLI if linked to your project." -ForegroundColor Gray

Write-Host "`nSQL file is ready at: scripts\09-create-content-reports-table.sql" -ForegroundColor Green
