Write-Host "===== نظام سفراء المحاسبي =====" -ForegroundColor Cyan
Write-Host "جاري تشغيل الخادم والواجهة..." -ForegroundColor Yellow
Write-Host ""

$serverJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    node server/server.js
}

$clientJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npm run dev --prefix client
}

Start-Sleep -Seconds 4

Write-Host "✅ الخادم: http://localhost:3001" -ForegroundColor Green
Write-Host "✅ الواجهة: http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "اضغط Ctrl+C لإيقاف النظام" -ForegroundColor Gray

try {
    while ($true) {
        Start-Sleep -Seconds 1
        if ($serverJob.State -eq 'Failed') {
            Receive-Job $serverJob
            throw "الخادم توقف"
        }
        if ($clientJob.State -eq 'Failed') {
            Receive-Job $clientJob
            throw "الواجهة توقفت"
        }
    }
} finally {
    Stop-Job $serverJob -ErrorAction SilentlyContinue
    Stop-Job $clientJob -ErrorAction SilentlyContinue
    Remove-Job $serverJob -ErrorAction SilentlyContinue
    Remove-Job $clientJob -ErrorAction SilentlyContinue
}
