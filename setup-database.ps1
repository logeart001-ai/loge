# PowerShell script to set up the database
# Run this script to create tables and add sample data

Write-Host "Setting up L'oge Arts database..." -ForegroundColor Green

# Read environment variables
$env:SUPABASE_URL = "https://enbkluhgrpsngfoxidny.supabase.co"
$env:SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuYmtsdWhncnBzbmdmb3hpZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzOTExNDMsImV4cCI6MjA2OTk2NzE0M30.GvyT7VjQBwmOqy0b8_rEMCuPghkXePDHouoNilGJrkM"

Write-Host "Step 1: Creating essential tables..." -ForegroundColor Yellow

# Try to link the project first
try {
    supabase link --project-ref enbkluhgrpsngfoxidny
    Write-Host "Project linked successfully" -ForegroundColor Green
} catch {
    Write-Host "Project linking failed, but continuing..." -ForegroundColor Yellow
}

# Execute the essential tables script
Write-Host "Creating tables..." -ForegroundColor Yellow
$essentialTablesContent = Get-Content -Path "scripts/03-essential-tables-only.sql" -Raw
$essentialTablesContent | supabase db reset --db-url $env:POSTGRES_URL

Write-Host "Step 2: Adding sample data..." -ForegroundColor Yellow
$sampleDataContent = Get-Content -Path "scripts/04-sample-data.sql" -Raw
$sampleDataContent | supabase db reset --db-url $env:POSTGRES_URL

Write-Host "Database setup complete!" -ForegroundColor Green
Write-Host "You can now restart your development server." -ForegroundColor Cyan