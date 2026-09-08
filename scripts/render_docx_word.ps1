param([Parameter(Mandatory=$true)][string]$InputPath, [Parameter(Mandatory=$true)][string]$OutputPath)
$ErrorActionPreference = 'Stop'
if (Get-Process WINWORD -ErrorAction SilentlyContinue) { throw 'Close Word before this isolated read-only rendering check.' }
$careerInput = (Resolve-Path -LiteralPath $InputPath).Path
$careerOutput = [System.IO.Path]::GetFullPath($OutputPath)
$careerWord = New-Object -ComObject Word.Application
$careerWord.Visible = $false
$careerWord.DisplayAlerts = 0
$careerWord.AutomationSecurity = 3
try {
    $careerDocument = $careerWord.Documents.Open($careerInput, $false, $true, $false)
    $careerDocument.ExportAsFixedFormat($careerOutput, 17)
    $careerDocument.Close(0)
} finally {
    $careerWord.Quit(0)
    [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($careerWord)
}
