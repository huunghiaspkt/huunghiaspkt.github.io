#!/usr/bin/env python3
"""Turn the Environment Setup page into a runnable test script.

Reads docs/zephyr-training/01_how-to-start/environment.md and emits, in page
order, every code block a reader on OS would type:

- linux / macos: `bash` blocks in that OS's tab or outside any OS tab.
- windows: `powershell` blocks in the Windows tab, plus the untabbed `bash`
  blocks (west commands), which a Windows reader types into PowerShell.

Every <BoardTab> is included, so all boards are tested. All blocks run in ONE
shell session, like a student's terminal, so `cd` and venv activation carry
over. Each block reports PASS/FAIL, the run continues, and a summary table is
printed (and appended to $GITHUB_STEP_SUMMARY when set).

Usage: extract.py OS WORKSPACE_PATH > script     (OS: linux | macos | windows)
"""
import base64
import re
import sys
from pathlib import Path

PAGE = Path(__file__).resolve().parent.parent / "docs/zephyr-training/01_how-to-start/environment.md"
PLACEHOLDERS = ("/your/workspace/path", r"D:\your\workspace\path")

BASH_HEADER = r'''#!/usr/bin/env bash
# Generated from environment.md by docs-test/extract.py - do not edit.
RESULTS=()
FAILED=0
run_block() {                     # $1 = label, $2 = code
    echo
    echo "================================================================"
    echo "== $1"
    echo "================================================================"
    echo "$2" | sed 's/^/  $ /'
    echo "----------------------------------------------------------------"
    local rc=0
    trap 'rc=1' ERR
    eval "$2"
    trap - ERR
    if [ $rc -eq 0 ]; then RESULTS+=("PASS|$1"); else RESULTS+=("FAIL|$1"); FAILED=$((FAILED + 1)); fi
}
'''

BASH_FOOTER = r'''
echo
echo "================================ SUMMARY ================================"
for r in "${RESULTS[@]}"; do echo "${r%%|*}  ${r#*|}"; done
echo "$FAILED of ${#RESULTS[@]} blocks failed"
if [ -n "$GITHUB_STEP_SUMMARY" ]; then
    {
        echo "### Environment Setup — $RUNNER_OS"
        echo
        echo "| Result | Block |"
        echo "|---|---|"
        for r in "${RESULTS[@]}"; do
            [ "${r%%|*}" = PASS ] && icon="✅ PASS" || icon="❌ FAIL"
            echo "| $icon | ${r#*|} |"
        done
        echo
        echo "**$FAILED of ${#RESULTS[@]} blocks failed**"
    } >> "$GITHUB_STEP_SUMMARY"
fi
exit $FAILED
'''

PS_HEADER = r'''# Generated from environment.md by docs-test/extract.py - do not edit.
$ErrorActionPreference = 'Continue'
function D([string]$b64) { [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($b64)) }
$Results = @()
$Failed = 0

# "Close and reopen PowerShell": pick up PATH changes from installers,
# keeping entries already on PATH (such as an activated .venv).
function Update-SessionPath {
    $fresh = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' +
             [Environment]::GetEnvironmentVariable('Path', 'User')
    $env:Path = (($env:Path -split ';') + ($fresh -split ';') |
                 Where-Object { $_ } | Select-Object -Unique) -join ';'
}

function Invoke-Block([string]$Label, [string]$Code) {
    Write-Host ''
    Write-Host ('=' * 64)
    Write-Host "== $Label"
    Write-Host ('=' * 64)
    $Code -split "`n" | ForEach-Object { Write-Host "  PS> $_" }
    Write-Host ('-' * 64)
    # One statement per line; a trailing backtick continues the statement.
    $statements = @()
    $current = ''
    foreach ($line in ($Code -split "`n")) {
        if ($line.TrimEnd().EndsWith('`')) { $current += $line.TrimEnd().TrimEnd('`') + ' '; continue }
        $current += $line
        if ($current.Trim()) { $statements += $current }
        $current = ''
    }
    $ok = $true
    foreach ($s in $statements) {
        $global:LASTEXITCODE = 0
        try { Invoke-Expression $s } catch { Write-Host "ERROR: $_"; $ok = $false }
        if ($LASTEXITCODE -ne 0) { Write-Host "exit code $LASTEXITCODE"; $ok = $false }
    }
    Update-SessionPath
    if ($ok) { $script:Results += "PASS|$Label" } else { $script:Results += "FAIL|$Label"; $script:Failed++ }
}
'''

PS_FOOTER = r'''
Write-Host ''
Write-Host '================================ SUMMARY ================================'
foreach ($r in $Results) { $p = $r -split '\|', 2; Write-Host "$($p[0])  $($p[1])" }
Write-Host "$Failed of $($Results.Count) blocks failed"
if ($env:GITHUB_STEP_SUMMARY) {
    $md = @("### Environment Setup — Windows", '', '| Result | Block |', '|---|---|')
    foreach ($r in $Results) {
        $p = $r -split '\|', 2
        $icon = if ($p[0] -eq 'PASS') { '✅ PASS' } else { '❌ FAIL' }
        $md += "| $icon | $($p[1]) |"
    }
    $md += '', "**$Failed of $($Results.Count) blocks failed**"
    $md | Out-File -FilePath $env:GITHUB_STEP_SUMMARY -Append -Encoding utf8
}
exit $Failed
'''


def blocks(os_name: str):
    """Yield (label, code) for every block an OS_NAME reader runs, in page order."""
    step, tab, board, n = "Intro", None, None, 0
    lines = PAGE.read_text().splitlines()
    i = 0
    while i < len(lines):
        line = lines[i]
        if line.startswith("## "):
            step, n = line[3:].strip(), 0
        if m := re.match(r'\s*<TabItem value="(\w+)"', line):
            tab = m.group(1)
        if re.match(r"\s*</Tabs>", line):
            tab = None
        if m := re.match(r'\s*<BoardTab value="([\w-]+)"', line):
            board = m.group(1)
        if re.match(r"\s*</BoardTabs>", line):
            board = None
        if m := re.match(r"\s*```(\w+)", line):
            lang, body = m.group(1), []
            i += 1
            while not re.match(r"\s*```\s*$", lines[i]):
                body.append(lines[i])
                i += 1
            if os_name == "windows":
                wanted = (lang == "powershell" and tab == "windows") or (lang == "bash" and tab is None)
            else:
                wanted = lang == "bash" and tab in (None, os_name)
            if wanted:
                n += 1
                yield f"{step} [{n}]" + (f" ({board})" if board else ""), "\n".join(body)
        i += 1


def bash_quote(s: str) -> str:
    return "'" + s.replace("'", "'\"'\"'") + "'"


def ps_quote(s: str) -> str:
    """Base64 keeps quotes, backticks, $ and non-ASCII safe in the generated script."""
    return "(D '" + base64.b64encode(s.encode()).decode() + "')"


def main():
    os_name, ws = sys.argv[1], sys.argv[2]
    windows = os_name == "windows"
    out = ["\ufeff" + PS_HEADER if windows else BASH_HEADER]   # BOM: PowerShell 5.1 reads UTF-8
    for label, code in blocks(os_name):
        for placeholder in PLACEHOLDERS:
            code = code.replace(placeholder, ws)
        if windows:
            out.append(f"Invoke-Block {ps_quote(label)} {ps_quote(code)}\n")
        else:
            out.append(f"run_block {bash_quote(label)} {bash_quote(code)}\n")
    out.append(PS_FOOTER if windows else BASH_FOOTER)
    sys.stdout.write("".join(out))


if __name__ == "__main__":
    main()
