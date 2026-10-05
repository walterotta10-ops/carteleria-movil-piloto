# Carteleria RF Bridge v18
# Puente local: navegador -> 127.0.0.1:8787 -> Zebra TCP/9100
# No modifica la configuracion de la impresora.

$ErrorActionPreference = "Stop"
$ListenPort = 8787
$AllowedOrigins = @(
    "https://carteleria-movil-piloto.onrender.com",
    "https://walterotta10-ops.github.io"
)

function Test-Origin([string]$Origin) {
    if ([string]::IsNullOrWhiteSpace($Origin)) { return $true }
    if ($AllowedOrigins -contains $Origin) { return $true }
    if ($Origin -match '^http://(127\.0\.0\.1|localhost)(:\d+)?$') { return $true }
    return $false
}

function Send-HttpResponse {
    param(
        [System.Net.Sockets.NetworkStream]$Stream,
        [int]$StatusCode,
        [string]$StatusText,
        [string]$JsonBody,
        [string]$Origin = ""
    )

    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($JsonBody)
    $cors = ""
    if (-not [string]::IsNullOrWhiteSpace($Origin) -and (Test-Origin $Origin)) {
        $cors += "Access-Control-Allow-Origin: $Origin`r`n"
        $cors += "Vary: Origin`r`n"
    }
    $cors += "Access-Control-Allow-Methods: GET, POST, OPTIONS`r`n"
    $cors += "Access-Control-Allow-Headers: Content-Type`r`n"
    $cors += "Access-Control-Allow-Private-Network: true`r`n"

    $header = "HTTP/1.1 $StatusCode $StatusText`r`n" +
              "Content-Type: application/json; charset=utf-8`r`n" +
              "Content-Length: $($bodyBytes.Length)`r`n" +
              "Connection: close`r`n" +
              $cors + "`r`n"

    $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
    $Stream.Write($headerBytes, 0, $headerBytes.Length)
    if ($bodyBytes.Length -gt 0) {
        $Stream.Write($bodyBytes, 0, $bodyBytes.Length)
    }
    $Stream.Flush()
}

function Send-ZplToPrinter {
    param([string]$Ip, [int]$Port, [string]$Zpl)

    $parsed = $null
    if (-not [System.Net.IPAddress]::TryParse($Ip, [ref]$parsed)) {
        throw "IP de impresora no valida"
    }
    if ($Port -ne 9100) {
        throw "Puerto no permitido. Este piloto usa TCP 9100"
    }
    if ([string]::IsNullOrWhiteSpace($Zpl) -or $Zpl.Length -gt 65535) {
        throw "Trabajo ZPL vacio o demasiado grande"
    }
    if (-not $Zpl.TrimStart().StartsWith("^XA") -or -not $Zpl.Contains("^XZ")) {
        throw "Trabajo ZPL invalido"
    }

    $printer = New-Object System.Net.Sockets.TcpClient
    try {
        $printer.ReceiveTimeout = 5000
        $printer.SendTimeout = 5000
        $printer.Connect($Ip, $Port)
        $out = $printer.GetStream()
        $bytes = [System.Text.Encoding]::ASCII.GetBytes($Zpl)
        $out.Write($bytes, 0, $bytes.Length)
        $out.Flush()
        $out.Close()
    }
    finally {
        $printer.Close()
    }
}

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $ListenPort)
$listener.Start()
Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " Carteleria - Puente RF v18 ACTIVO" -ForegroundColor Green
Write-Host " http://127.0.0.1:$ListenPort" -ForegroundColor White
Write-Host " Deja esta ventana abierta mientras imprimes." -ForegroundColor Yellow
Write-Host " Para detenerlo: Ctrl+C" -ForegroundColor DarkGray
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

try {
    while ($true) {
        $client = $listener.AcceptTcpClient()
        try {
            $stream = $client.GetStream()
            $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8, $false, 8192, $true)

            $requestLine = $reader.ReadLine()
            if ([string]::IsNullOrWhiteSpace($requestLine)) {
                $client.Close(); continue
            }

            $parts = $requestLine.Split(' ')
            $method = $parts[0].ToUpperInvariant()
            $path = $parts[1]
            $headers = @{}
            while ($true) {
                $line = $reader.ReadLine()
                if ($null -eq $line -or $line -eq "") { break }
                $idx = $line.IndexOf(':')
                if ($idx -gt 0) {
                    $name = $line.Substring(0, $idx).Trim().ToLowerInvariant()
                    $value = $line.Substring($idx + 1).Trim()
                    $headers[$name] = $value
                }
            }

            $origin = if ($headers.ContainsKey('origin')) { $headers['origin'] } else { "" }
            if (-not (Test-Origin $origin)) {
                Send-HttpResponse $stream 403 "Forbidden" '{"ok":false,"error":"Origen no autorizado"}' $origin
                continue
            }

            if ($method -eq "OPTIONS") {
                Send-HttpResponse $stream 204 "No Content" "" $origin
                continue
            }

            if ($method -eq "GET" -and $path -eq "/health") {
                Send-HttpResponse $stream 200 "OK" '{"ok":true,"bridge":"Carteleria RF Bridge","version":18}' $origin
                continue
            }

            if ($method -eq "POST" -and $path -eq "/print") {
                $length = 0
                if ($headers.ContainsKey('content-length')) { $length = [int]$headers['content-length'] }
                if ($length -le 0 -or $length -gt 100000) {
                    Send-HttpResponse $stream 400 "Bad Request" '{"ok":false,"error":"Body invalido"}' $origin
                    continue
                }

                $buffer = New-Object char[] $length
                $read = 0
                while ($read -lt $length) {
                    $n = $reader.Read($buffer, $read, $length - $read)
                    if ($n -le 0) { break }
                    $read += $n
                }
                $body = -join $buffer[0..($read-1)]
                $payload = $body | ConvertFrom-Json

                $ip = [string]$payload.ip
                $port = if ($payload.port) { [int]$payload.port } else { 9100 }
                $zpl = [string]$payload.zpl

                Send-ZplToPrinter -Ip $ip -Port $port -Zpl $zpl
                $safeIp = $ip.Replace('"','')
                Write-Host "$(Get-Date -Format HH:mm:ss)  Impreso -> $safeIp`:$port" -ForegroundColor Green
                Send-HttpResponse $stream 200 "OK" '{"ok":true,"message":"Trabajo enviado a la Zebra"}' $origin
                continue
            }

            Send-HttpResponse $stream 404 "Not Found" '{"ok":false,"error":"Ruta no encontrada"}' $origin
        }
        catch {
            try {
                if ($stream -and $stream.CanWrite) {
                    $msg = ($_.Exception.Message -replace '"','\"')
                    Send-HttpResponse $stream 500 "Internal Server Error" "{`"ok`":false,`"error`":`"$msg`"}" $origin
                }
            } catch {}
            Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        }
        finally {
            if ($reader) { $reader.Dispose() }
            if ($stream) { $stream.Dispose() }
            $client.Close()
        }
    }
}
finally {
    $listener.Stop()
}
