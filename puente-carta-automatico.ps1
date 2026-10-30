# Carteleria - Puente Carta Automatico V54 (maqueta Carta v23)
# Correccion: trabajo auto-contenido (CSS embebida), reclamo seguro de cola y NO imprime JSON/HTML como texto.
# La app movil envia local + IP de impresora + HTML listo a Cloudflare.

$ErrorActionPreference = "Stop"

$BaseUrl = "https://carteleria-puente-carta.walterotta10.workers.dev"
$IntervaloSegundos = 5
$ConfigPath = Join-Path $PSScriptRoot "puente-carta-config.json"
$script:CydSession = $null
$script:CydCsrf = ""

function Escribir-Estado([string]$Mensaje) {
    $hora = Get-Date -Format "HH:mm:ss"
    Write-Host "[$hora] $Mensaje"
}

function Cargar-Configuracion {
    if (Test-Path $ConfigPath) {
        try {
            $cfg = Get-Content $ConfigPath -Raw -Encoding UTF8 | ConvertFrom-Json
            if ($cfg.local -and [string]$cfg.local -match '^\d{1,6}$') { return $cfg }
        } catch {}
    }

    Write-Host ""
    Write-Host "Primera configuracion del Puente Carta"
    do { $local = (Read-Host "Numero de local").Trim() } while ($local -notmatch '^\d{1,6}$')
    $cfg = [pscustomobject]@{ local = $local }
    $cfg | ConvertTo-Json | Set-Content $ConfigPath -Encoding UTF8
    Write-Host "Configuracion guardada en: $ConfigPath"
    return $cfg
}

# La contraseña solo se usa en memoria. El archivo de configuración conserva únicamente el local.
function Iniciar-Sesion {
    while ($true) {
        $segura = Read-Host "Contraseña de 4 dígitos del local $Local" -AsSecureString
        $puntero = [IntPtr]::Zero
        $pin = $null
        $body = $null
        try {
            $puntero = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($segura)
            $pin = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($puntero)
            if ($pin -notmatch '^\d{4}$') { Escribir-Estado "La contraseña debe tener 4 dígitos."; continue }
            $body = @{ access = $Local; pin = $pin } | ConvertTo-Json -Compress
            $respuesta = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method POST -ContentType "application/json" -Body $body -SessionVariable nuevaSesion -TimeoutSec 20
            if (-not $respuesta.ok -or $respuesta.profile.role -ne "store") { throw "Este puente necesita el acceso de un local." }
            $script:CydSession = $nuevaSesion
            $script:CydCsrf = [string]$respuesta.csrf
            Escribir-Estado "Acceso confirmado para el local $Local."
            return
        } catch {
            $codigo = 0
            try { $codigo = [int]$_.Exception.Response.StatusCode } catch {}
            if ($codigo -eq 429) {
                Escribir-Estado "Demasiados intentos. Espera 15 minutos o pide al jefe de mercado cambiar la clave."
            } else {
                Escribir-Estado "No se pudo ingresar. Revisa la contraseña y la conexión."
            }
        } finally {
            if ($puntero -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($puntero) }
            if ($segura) { $segura.Dispose() }
            $pin = $null
            $body = $null
        }
    }
}

function Invoke-Cyd([string]$Ruta, [hashtable]$Datos) {
    for ($intento = 0; $intento -lt 2; $intento++) {
        try {
            $body = $Datos | ConvertTo-Json -Compress -Depth 6
            return Invoke-RestMethod -Uri "$BaseUrl$Ruta" -Method POST -ContentType "application/json" -Body $body -WebSession $script:CydSession -Headers @{ "X-CYD-CSRF" = $script:CydCsrf } -TimeoutSec 20
        } catch {
            $codigo = 0
            try { $codigo = [int]$_.Exception.Response.StatusCode } catch {}
            if ($codigo -eq 401 -and $intento -eq 0) {
                Escribir-Estado "La sesión terminó o cambió la clave. Ingresa nuevamente."
                Iniciar-Sesion
            } else { throw }
        }
    }
}

function Buscar-ImpresoraPorIp([string]$Ip) {
    $parsed = $null
    if (-not [System.Net.IPAddress]::TryParse($Ip, [ref]$parsed)) { return $null }

    $printers = @(Get-Printer -ErrorAction Stop)
    $portNames = New-Object System.Collections.Generic.List[string]

    try {
        foreach ($port in @(Get-PrinterPort -ErrorAction Stop)) {
            $hostAddress = ""
            try { $hostAddress = [string]$port.PrinterHostAddress } catch {}
            if ($hostAddress -eq $Ip -or [string]$port.Name -eq $Ip -or [string]$port.Name -like "*$Ip*") {
                if ($port.Name -and -not $portNames.Contains([string]$port.Name)) { $portNames.Add([string]$port.Name) }
            }
        }
    } catch {}

    try {
        foreach ($port in @(Get-CimInstance Win32_TCPIPPrinterPort -ErrorAction Stop)) {
            if ([string]$port.HostAddress -eq $Ip -or [string]$port.Name -eq $Ip -or [string]$port.Name -like "*$Ip*") {
                if ($port.Name -and -not $portNames.Contains([string]$port.Name)) { $portNames.Add([string]$port.Name) }
            }
        }
    } catch {}

    foreach ($portName in $portNames) {
        $match = $printers | Where-Object { [string]$_.PortName -eq $portName } | Select-Object -First 1
        if ($match) { return $match }
    }

    return ($printers | Where-Object { [string]$_.PortName -like "*$Ip*" } | Select-Object -First 1)
}

function Buscar-Navegador {
    $candidates = @(
        "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
        "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
        "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe",
        "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
        "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
    )
    foreach ($path in $candidates) { if ($path -and (Test-Path $path)) { return $path } }
    return $null
}

function Obtener-ImpresoraPredeterminada {
    try { return (Get-CimInstance Win32_Printer | Where-Object { $_.Default } | Select-Object -First 1).Name } catch { return $null }
}

function Establecer-ImpresoraPredeterminada([string]$Nombre) {
    $printer = Get-CimInstance Win32_Printer | Where-Object { [string]$_.Name -eq $Nombre } | Select-Object -First 1
    if (-not $printer) { throw "No se encontro la impresora '$Nombre'." }
    $null = Invoke-CimMethod -InputObject $printer -MethodName SetDefaultPrinter
}

function Preparar-PreferenciasChrome([string]$Profile) {
    $defaultDir = Join-Path $Profile "Default"
    New-Item -ItemType Directory -Path $defaultDir -Force | Out-Null
    $prefsPath = Join-Path $defaultDir "Preferences"

    # Chrome/Edge recuerda estas opciones para kiosk-printing: sin cabecera/pie, fondos activos.
    $appState = @{
        version = 2
        isHeaderFooterEnabled = $false
        isCssBackgroundEnabled = $true
        marginsType = 1
    } | ConvertTo-Json -Compress

    $prefs = @{
        printing = @{
            print_preview_sticky_settings = @{
                appState = $appState
            }
        }
    } | ConvertTo-Json -Depth 8

    $prefs | Set-Content $prefsPath -Encoding UTF8
}

function Imprimir-Html([string]$Html, [string]$PrinterName, [int]$JobId) {
    if ([string]::IsNullOrWhiteSpace($Html)) { throw "Trabajo HTML vacio." }
    if (-not $Html.TrimStart().StartsWith("<!doctype html", [System.StringComparison]::OrdinalIgnoreCase)) { throw "El trabajo no es HTML valido." }
    if (-not $Html.Contains("@media print") -or -not $Html.Contains(".print-cell")) { throw "El trabajo no contiene la maqueta Carta v23." }
    if ($Html -match '<link[^>]+stylesheet') { throw "Trabajo antiguo detectado: depende de una CSS externa. Reenvialo desde la app v23." }

    $browser = Buscar-Navegador
    if (-not $browser) { throw "No se encontro Google Chrome ni Microsoft Edge en este PC." }

    $tempRoot = Join-Path $env:TEMP "carteleria-carta-$JobId"
    $profile = Join-Path $tempRoot "browser-profile"
    $htmlPath = Join-Path $tempRoot "cartel.html"
    New-Item -ItemType Directory -Path $profile -Force | Out-Null
    Preparar-PreferenciasChrome -Profile $profile
    $Html | Set-Content $htmlPath -Encoding UTF8
    $fileUri = ([System.Uri]$htmlPath).AbsoluteUri

    $defaultAnterior = Obtener-ImpresoraPredeterminada
    try {
        Establecer-ImpresoraPredeterminada $PrinterName
        Start-Sleep -Milliseconds 700

        $args = @(
            "--kiosk-printing",
            "--no-first-run",
            "--disable-extensions",
            "--disable-features=Translate",
            "--user-data-dir=`"$profile`"",
            "--new-window",
            $fileUri
        )
        Start-Process -FilePath $browser -ArgumentList $args | Out-Null
        Start-Sleep -Seconds 9
    }
    finally {
        if ($defaultAnterior) { try { Establecer-ImpresoraPredeterminada $defaultAnterior } catch {} }
        try {
            Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -and $_.CommandLine -like "*$profile*" } |
                ForEach-Object { try { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue } catch {} }
        } catch {}
        Start-Sleep -Milliseconds 400
        try { Remove-Item $tempRoot -Recurse -Force -ErrorAction SilentlyContinue } catch {}
    }
}

function Confirmar-Impreso([int]$Id) {
    return Invoke-Cyd -Ruta "/impreso" -Datos @{ id = $Id }
}

function Marcar-Fallo([int]$Id) {
    try {
        Invoke-Cyd -Ruta "/fallo" -Datos @{ id = $Id } | Out-Null
    } catch {}
}

$config = Cargar-Configuracion
$Local = [string]([int]$config.local)

Write-Host ""
Write-Host "====================================================="
Write-Host " Carteleria - Puente Carta Automatico V54"
Write-Host " Local: $Local"
Write-Host " Destino: impresora indicada por IP desde el movil"
Write-Host " Seguridad: nunca imprime JSON/HTML como texto"
Write-Host "====================================================="
Write-Host ""
Iniciar-Sesion
Escribir-Estado "Puente activo. Esperando trabajos del local $Local..."

while ($true) {
    $id = 0
    try {
        # /tomar reclama un trabajo de forma segura. /siguiente queda desactivado para puentes antiguos.
        $respuesta = Invoke-Cyd -Ruta "/tomar?local=$Local" -Datos @{}

        if ($respuesta.ok -and $null -ne $respuesta.trabajo) {
            $trabajo = $respuesta.trabajo
            $id = [int]$trabajo.id
            $printerIp = [string]$trabajo.printer_ip
            $contenido = [string]$trabajo.contenido
            Escribir-Estado "Trabajo tomado. ID $id · IP $printerIp"

            if (-not $printerIp) { throw "El trabajo $id no trae IP de impresora." }
            $printer = Buscar-ImpresoraPorIp $printerIp
            if (-not $printer) { throw "No hay una impresora instalada en este PC asociada a la IP $printerIp." }
            Escribir-Estado "Impresora encontrada: $($printer.Name)"

            $payload = $null
            try { $payload = $contenido | ConvertFrom-Json -ErrorAction Stop } catch { throw "Trabajo invalido. No se imprimira como texto." }

            if (-not $payload -or [string]$payload.kind -ne "carta_html" -or [string]$payload.version -ne "v23" -or -not $payload.html) {
                throw "Trabajo antiguo o invalido. Reenvialo desde Carteleria v23."
            }

            Escribir-Estado "Imprimiendo cartelera Tamaño Carta v23..."
            Imprimir-Html -Html ([string]$payload.html) -PrinterName ([string]$printer.Name) -JobId $id

            $confirmacion = Confirmar-Impreso -Id $id
            if ($confirmacion.ok) {
                Escribir-Estado "Trabajo ID $id confirmado. Cloudflare lo eliminara despues de 20 minutos."
            } else {
                throw "La impresion fue enviada, pero no se pudo confirmar el estado."
            }
        }
    }
    catch {
        Escribir-Estado "Sin impresion: $($_.Exception.Message)"
        if ($id -gt 0) { Marcar-Fallo -Id $id }
    }

    Start-Sleep -Seconds $IntervaloSegundos
}

