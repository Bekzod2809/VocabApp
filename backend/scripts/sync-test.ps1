# Sinx API'ning to'liq sinovi: auth, ikki qurilma, to'qnashuv, o'chirish, xatolar.
#
# DIQQAT: skript yangi foydalanuvchi yaratadi (setup), shuning uchun uni faqat BO'SH test bazasida ishlating:
#   $env:ConnectionStrings__DatabaseConnection='Host=localhost;Port=5432;Database=vocabapp_test;Username=postgres;Password=...'
#   $env:ASPNETCORE_URLS='http://localhost:5081'; dotnet run --no-launch-profile
#   powershell -ExecutionPolicy Bypass -File scripts/sync-test.ps1 -Api http://localhost:5081
param([string]$Api = 'http://localhost:5081')

$ErrorActionPreference = 'Stop'
$pass = 0; $fail = 0

function Check($name, $cond) {
    if ($cond) { Write-Host "[OK]   $name"; $script:pass++ } else { Write-Host "[FAIL] $name"; $script:fail++ }
}

function Call($method, $path, $body = $null, $token = $null) {
    $headers = @{}
    if ($token) { $headers['Authorization'] = "Bearer $token" }
    $json = if ($null -ne $body) { $body | ConvertTo-Json -Depth 10 } else { $null }
    try {
        $r = Invoke-WebRequest -Method $method -Uri "$Api$path" -Body $json -ContentType 'application/json' -Headers $headers -UseBasicParsing
        return @{ Status = [int]$r.StatusCode; Body = ($r.Content | ConvertFrom-Json) }
    } catch {
        $resp = $_.Exception.Response
        $content = $null
        if ($resp) {
            $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
            $text = $reader.ReadToEnd()
            if ($text) { try { $content = $text | ConvertFrom-Json } catch { $content = $text } }
        }
        return @{ Status = [int]$resp.StatusCode; Body = $content }
    }
}

function Iso($dt) { $dt.ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ') }

$user = 'tester'
$testPass = 'test-pass-' + [guid]::NewGuid().ToString('N').Substring(0, 8)

# --- Auth ---
$r = Call GET '/api/auth/setup-status'
Check 'setup-status: hali foydalanuvchi yo''q' ($r.Body.isSetupDone -eq $false)

$r = Call POST '/api/auth/setup' @{ userName = $user; password = $testPass }
Check 'setup: token qaytdi' ($r.Status -eq 200 -and $r.Body.accessToken)
$token = $r.Body.accessToken

$r = Call POST '/api/auth/setup' @{ userName = 'other'; password = 'another-pass' }
Check 'setup ikkinchi marta: 409' ($r.Status -eq 409)

$r = Call POST '/api/auth/login' @{ userName = $user; password = 'wrong-pass' }
Check 'login noto''g''ri parol: 401' ($r.Status -eq 401)

$r = Call POST '/api/auth/login' @{ userName = $user; password = $testPass }
Check 'login to''g''ri parol: token' ($r.Status -eq 200 -and $r.Body.accessToken)

$r = Call POST '/api/sync' @{ lastVersion = 0 }
Check 'sync tokensiz: 401' ($r.Status -eq 401)

# --- A qurilma: guruh + 2 so'z + progress ---
$t0 = (Get-Date).AddMinutes(-10)
$g = [guid]::NewGuid().ToString(); $w1 = [guid]::NewGuid().ToString(); $w2 = [guid]::NewGuid().ToString()

$r = Call POST '/api/sync' @{
    lastVersion = 0
    groups = @(@{ id = $g; name = 'Animals'; createdAt = Iso $t0; updatedAt = Iso $t0; isDeleted = $false })
    words = @(
        @{ id = $w1; groupId = $g; term = 'cat'; translation = 'mushuk'; example = 'The cat is sleeping.'; createdAt = Iso $t0; updatedAt = Iso $t0; isDeleted = $false },
        @{ id = $w2; groupId = $g; term = 'dog'; translation = 'it'; createdAt = Iso $t0; updatedAt = Iso $t0; isDeleted = $false })
    progress = @(@{ wordId = $w1; box = 2; nextReviewAt = Iso $t0.AddDays(1); correctCount = 1; wrongCount = 0; updatedAt = Iso $t0 })
} $token
Check 'A push: versiya 1' ($r.Status -eq 200 -and $r.Body.currentVersion -eq 1)
Check 'A push: o''zi yuborganlari qaytib kelmaydi' ($r.Body.groups.Count -eq 0 -and $r.Body.words.Count -eq 0 -and $r.Body.progress.Count -eq 0)
$vA = $r.Body.currentVersion

# --- B qurilma: birinchi sinx, hammasini oladi ---
$r = Call POST '/api/sync' @{ lastVersion = 0 } $token
Check 'B birinchi sinx: 1 guruh, 2 so''z, 1 progress' ($r.Body.groups.Count -eq 1 -and $r.Body.words.Count -eq 2 -and $r.Body.progress.Count -eq 1)
Check 'B: misol gap saqlangan' (($r.Body.words | Where-Object id -eq $w1).example -eq 'The cat is sleeping.')
$vB = $r.Body.currentVersion

# --- Hech narsa o'zgarmasa versiya oshmaydi ---
$r = Call POST '/api/sync' @{ lastVersion = $vB } $token
Check 'Bo''sh sinx: versiya o''zgarmaydi, hech narsa qaytmaydi' ($r.Body.currentVersion -eq $vB -and $r.Body.words.Count -eq 0)

# --- B so'zni o'zgartiradi (yangiroq vaqt) ---
$tB = (Get-Date).AddMinutes(-2)
$r = Call POST '/api/sync' @{
    lastVersion = $vB
    words = @(@{ id = $w1; groupId = $g; term = 'cat'; translation = 'mushuk (B)'; createdAt = Iso $t0; updatedAt = Iso $tB; isDeleted = $false })
} $token
Check 'B tahrir: versiya 2' ($r.Body.currentVersion -eq 2)
Check 'B tahrir: o''zi yuborgan so''z qaytib kelmaydi' ($r.Body.words.Count -eq 0)
$vB = $r.Body.currentVersion

# --- A eski vaqt bilan o'sha so'zni o'zgartiradi: yutqazadi ---
$tA = (Get-Date).AddMinutes(-5)
$r = Call POST '/api/sync' @{
    lastVersion = $vA
    words = @(@{ id = $w1; groupId = $g; term = 'cat'; translation = 'mushuk (A eski)'; createdAt = Iso $t0; updatedAt = Iso $tA; isDeleted = $false })
} $token
$back = $r.Body.words | Where-Object id -eq $w1
Check 'To''qnashuv: yangiroq (B) yutdi, A ga to''g''ri holat qaytdi' ($back.translation -eq 'mushuk (B)')
$vA = $r.Body.currentVersion

# --- A guruhni o'chiradi: so'zlar ham o'chadi ---
$tDel = Get-Date
$r = Call POST '/api/sync' @{
    lastVersion = $vA
    groups = @(@{ id = $g; name = 'Animals'; createdAt = Iso $t0; updatedAt = Iso $tDel; isDeleted = $true })
} $token
Check 'Guruh o''chirildi: versiya 3' ($r.Body.currentVersion -eq 3)
Check 'A: guruh qaytmaydi, so''zlari o''chirilgan holda qaytadi' ($r.Body.groups.Count -eq 0 -and @($r.Body.words | Where-Object { $_.isDeleted }).Count -eq 2)

$r = Call POST '/api/sync' @{ lastVersion = $vB } $token
$deletedWords = @($r.Body.words | Where-Object { $_.isDeleted })
Check 'B: guruh va 2 so''z o''chirilgan holda keldi' (($r.Body.groups | Where-Object id -eq $g).isDeleted -and $deletedWords.Count -eq 2)

# --- Yangi qurilma: o'chirilganlar umuman kelmaydi ---
$r = Call POST '/api/sync' @{ lastVersion = 0 } $token
Check 'Yangi qurilma: o''chirilgan yozuvlar kelmaydi' ($r.Body.groups.Count -eq 0 -and $r.Body.words.Count -eq 0 -and $r.Body.progress.Count -eq 0)

# --- Xatolar ---
$r = Call POST '/api/sync' @{ lastVersion = 0; words = @(@{ id = [guid]::NewGuid().ToString(); groupId = [guid]::NewGuid().ToString(); term = 'x'; translation = 'y'; createdAt = Iso $t0; updatedAt = Iso $t0 }) } $token
Check 'Mavjud bo''lmagan guruhga so''z: 400' ($r.Status -eq 400)

$r = Call POST '/api/sync' @{ lastVersion = 0; words = @(@{ id = [guid]::NewGuid().ToString(); groupId = $g; term = ''; translation = 'y'; createdAt = Iso $t0; updatedAt = Iso $t0 }) } $token
Check 'Bo''sh Term: 4xx validatsiya xatosi' ($r.Status -ge 400 -and $r.Status -lt 500)

$r = Call POST '/api/sync' @{ lastVersion = 999 } $token
Check 'LastVersion serverdan oldinda: 400' ($r.Status -eq 400)

Write-Host ""
Write-Host "Natija: $pass OK, $fail FAIL"

