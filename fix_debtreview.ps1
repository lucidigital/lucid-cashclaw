$f = "src/pages/DebtReview.tsx"
$c = Get-Content $f -Raw -Encoding UTF8

# Add partners to TYPE_FILTERS (after supplier line)
$c = $c -replace "(\{ code: 'supplier', label: '.. Supplier' \},)", "`$1`n    { code: 'partners', label: '`u{1F91D} Partners' },"

# Update typeIcon map to include partners
$c = $c -replace "const typeIcon = \{ leader: '..', staff: '..', freelance: '..', supplier: '..', org: '..' \}", "const typeIcon = { leader: '`u{1F451}', staff: '`u{1F465}', freelance: '`u{1F464}', partners: '`u{1F91D}', supplier: '`u{1F3E2}', org: '`u{1F3E6}' }"

Set-Content $f -Value $c -Encoding UTF8 -NoNewline
Write-Host "Done"
