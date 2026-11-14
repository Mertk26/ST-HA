param(
    [switch]$Doctor,
    [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path -LiteralPath $ProjectRoot).Path
$localJdk = Join-Path (Split-Path -Parent $PSScriptRoot) '.tools\jdk-21.0.13+9'
if (-not $env:JAVA_HOME -and (Test-Path -LiteralPath $localJdk)) {
    $env:JAVA_HOME = $localJdk
}
if ($env:JAVA_HOME) {
    $env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
}
$compiler = Get-Command javac -ErrorAction SilentlyContinue
if (-not $compiler) {
    throw 'JDK 21 is required. Set JAVA_HOME to its installation directory; a Java 8 JRE is insufficient.'
}
$version = & $compiler.Source -version 2>&1
if ($LASTEXITCODE -ne 0 -or "$version" -notmatch '^javac 21\.') {
    throw "Select JDK 21 with JAVA_HOME. Found: $version"
}
Write-Output "Java compiler: $version"

$sdk = $env:ANDROID_HOME
if (-not $sdk) { $sdk = $env:ANDROID_SDK_ROOT }
if (-not $sdk) { $sdk = Join-Path $env:LOCALAPPDATA 'Android\Sdk' }
if (-not (Test-Path -LiteralPath (Join-Path $sdk 'platforms\android-36\android.jar'))) {
    throw 'Android SDK platform 36 is missing. Install it through Android Studio/SDK Manager and set ANDROID_HOME. Review and accept SDK licenses yourself; this script does not accept them.'
}
$env:ANDROID_HOME = $sdk
$env:GRADLE_USER_HOME = Join-Path $root '.tools\gradle-cache'
Write-Output "Android SDK: $sdk"

$adb = Join-Path $sdk 'platform-tools\adb.exe'
if (Test-Path -LiteralPath $adb) {
    & $adb devices
    if ($LASTEXITCODE -ne 0) { throw 'adb device discovery failed.' }
} else {
    Write-Warning 'Android platform-tools are missing; an APK build cannot establish device/watch delivery.'
}
if ($Doctor) { return }

Push-Location $root
try {
    & npm.cmd run android:sync
    if ($LASTEXITCODE -ne 0) { throw 'Android asset build/synchronization failed.' }
    Push-Location (Join-Path $root 'android')
    try {
        & .\gradlew.bat --no-daemon assembleDebug
        if ($LASTEXITCODE -ne 0) { throw 'Native Android build failed. Inspect the Gradle error above.' }
    } finally {
        Pop-Location
    }
    Write-Output "Debug APK: $(Join-Path $root 'android\app\build\outputs\apk\debug\app-debug.apk')"
} finally {
    Pop-Location
}
