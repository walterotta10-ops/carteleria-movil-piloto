# Carteleria - Puente Carta Automatico v22
# Receptor remoto por local + seleccion de impresora por IP.
# Mantener esta ventana abierta. La app movil envia el trabajo a Cloudflare;
# este puente lo recibe, identifica la impresora instalada por su IP y lo imprime.

$ErrorActionPreference = "Stop"

$BaseUrl = "https://carteleria-puente-carta.walterotta10.workers.dev"
$IntervaloSegundos = 5
$ConfigPath = Join-Path $PSScriptRoot "puente-carta-config.json"

function Escribir-Estado([string]$Mensaje) {
    $hora = Get-Date -Format "HH:mm:ss"
    Write-Host "[$hora] $Mensaje"
}

function Cargar-Configuracion {
    if (Test-Path $ConfigPath) {
        try {
            $cfg = Get-Content $ConfigPath -Raw -Encoding UTF8 | ConvertFrom-Json
            if ($cfg.local -and [string]$cfg.local -match '^\d{1,6}$') {
                return $cfg
            }
        } catch {}
    }

    Write-Host ""
    Write-Host "Primera configuracion del Puente Carta"
    do {
        $local = (Read-Host "Numero de local").Trim()
    } while ($local -notmatch '^\d{1,6}$')

    $cfg = [pscustomobject]@{ local = $local }
    $cfg | ConvertTo-Json | Set-Content $ConfigPath -Encoding UTF8
    Write-Host "Configuracion guardada en: $ConfigPath"
    return $cfg
}

function Buscar-ImpresoraPorIp([string]$Ip) {
    $printers = @(Get-Printer -ErrorAction Stop)
    $portNames = New-Object System.Collections.Generic.List[string]

    try {
        foreach ($port in @(Get-PrinterPort -ErrorAction Stop)) {
            $hostAddress = ""
            try { $hostAddress = [string]$port.PrinterHostAddress } catch {}
            if ($hostAddress -eq $Ip -or [string]$port.Name -eq $Ip -or [string]$port.Name -like "*$Ip*") {
                if ($port.Name) { $portNames.Add([string]$port.Name) }
            }
        }
    } catch {}

    try {
        foreach ($port in @(Get-CimInstance Win32_TCPIPPrinterPort -ErrorAction Stop)) {
            if ([string]$port.HostAddress -eq $Ip -or [string]$port.Name -eq $Ip -or [string]$port.Name -like "*$Ip*") {
                if ($port.Name -and -not $portNames.Contains([string]$port.Name)) {
                    $portNames.Add([string]$port.Name)
                }
            }
        }
    } catch {}

    foreach ($portName in $portNames) {
        $match = $printers | Where-Object { [string]$_.PortName -eq $portName } | Select-Object -First 1
        if ($match) { return $match }
    }

    # Ultimo respaldo: algunos drivers dejan la IP dentro del nombre del puerto.
    $match = $printers | Where-Object { [string]$_.PortName -like "*$Ip*" } | Select-Object -First 1
    return $match
}

function Buscar-Navegador {
    $candidates = @(
        "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
        "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
        "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe",
        "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
        "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
    )

    foreach ($path in $candidates) {
        if ($path -and (Test-Path $path)) { return $path }
    }
    return $null
}

function Obtener-ImpresoraPredeterminada {
    try {
        return (Get-CimInstance Win32_Printer | Where-Object { $_.Default } | Select-Object -First 1).Name
    } catch {
        return $null
    }
}

function Establecer-ImpresoraPredeterminada([string]$Nombre) {
    $printer = Get-CimInstance Win32_Printer | Where-Object { [string]$_.Name -eq $Nombre } | Select-Object -First 1
    if (-not $printer) { throw "No se encontro la impresora '$Nombre'." }
    $null = Invoke-CimMethod -InputObject $printer -MethodName SetDefaultPrinter
}

function Imprimir-Html([string]$Html, [string]$PrinterName, [int]$JobId) {
    $browser = Buscar-Navegador
    if (-not $browser) {
        throw "No se encontro Google Chrome ni Microsoft Edge en este PC."
    }

    $tempRoot = Join-Path $env:TEMP "carteleria-carta-$JobId"
    $profile = Join-Path $tempRoot "browser-profile"
    $htmlPath = Join-Path $tempRoot "cartel.html"
    New-Item -ItemType Directory -Path $profile -Force | Out-Null
    $Html | Set-Content $htmlPath -Encoding UTF8
    $fileUri = ([System.Uri]$htmlPath).AbsoluteUri

    $defaultAnterior = Obtener-ImpresoraPredeterminada
    try {
        Establecer-ImpresoraPredeterminada $PrinterName
        Start-Sleep -Milliseconds 600

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

        # El HTML ejecuta window.print() al terminar de cargar la hoja de estilos.
        # Se deja margen suficiente para que el trabajo entre al spooler de Windows.
        Start-Sleep -Seconds 10
    }
    finally {
        if ($defaultAnterior) {
            try { Establecer-ImpresoraPredeterminada $defaultAnterior } catch {}
        }

        # Cerrar solo los procesos lanzados con el perfil temporal de este trabajo.
        try {
            Get-CimInstance Win32_Process | Where-Object {
                $_.CommandLine -and $_.CommandLine -like "*$profile*"
            } | ForEach-Object {
                try { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue } catch {}
            }
        } catch {}

        Start-Sleep -Milliseconds 400
        try { Remove-Item $tempRoot -Recurse -Force -ErrorAction SilentlyContinue } catch {}
    }
}

function Confirmar-Impreso([int]$Id) {
    $body = @{ id = $Id } | ConvertTo-Json
    return Invoke-RestMethod `
        -Uri "$BaseUrl/impreso" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -TimeoutSec 20
}

$config = Cargar-Configuracion
$Local = [string]$config.local

Write-Host ""
Write-Host "====================================================="
Write-Host " Carteleria - Puente Carta Automatico v22"
Write-Host " Local: $Local"
Write-Host " Destino: impresora indicada por IP desde el movil"
Write-Host "====================================================="
Write-Host ""
Escribir-Estado "Puente activo. Esperando trabajos del local $Local..."

while ($true) {
    try {
        $respuesta = Invoke-RestMethod `
            -Uri "$BaseUrl/siguiente?local=$Local" `
            -Method GET `
            -TimeoutSec 20

        if ($respuesta.ok -and $null -ne $respuesta.trabajo) {
            $trabajo = $respuesta.trabajo
            $id = [int]$trabajo.id
            $printerIp = [string]$trabajo.printer_ip
            $contenido = [string]$trabajo.contenido

            Escribir-Estado "Trabajo recibido. ID $id · IP $printerIp"

            if (-not $printerIp) {
                throw "El trabajo $id no trae IP de impresora."
            }

            $printer = Buscar-ImpresoraPorIp $printerIp
            if (-not $printer) {
                throw "No hay una impresora instalada en este PC asociada a la IP $printerIp."
            }

            Escribir-Estado "Impresora encontrada: $($printer.Name)"

            $payload = $null
            try { $payload = $contenido | ConvertFrom-Json -ErrorAction Stop } catch {}

            if ($payload -and [string]$payload.kind -eq "carta_html" -and $payload.html) {
                Escribir-Estado "Imprimiendo cartelera Tamaño Carta..."
                Imprimir-Html -Html ([string]$payload.html) -PrinterName ([string]$printer.Name) -JobId $id
            }
            else {
                # Compatibilidad con pruebas antiguas de texto.
                Escribir-Estado "Trabajo de texto detectado. Enviando a impresora..."
                $contenido | Out-Printer -Name ([string]$printer.Name)
                Start-Sleep -Seconds 2
            }

            $confirmacion = Confirmar-Impreso -Id $id
            if ($confirmacion.ok) {
                Escribir-Estado "Trabajo ID $id confirmado. Cloudflare lo eliminara despues de 20 minutos."
            } else {
                Escribir-Estado "ADVERTENCIA: la impresion fue enviada, pero no se pudo confirmar el estado."
            }
        }
    }
    catch {
        Escribir-Estado "Sin impresion: $($_.Exception.Message)"
    }

    Start-Sleep -Seconds $IntervaloSegundos
}
