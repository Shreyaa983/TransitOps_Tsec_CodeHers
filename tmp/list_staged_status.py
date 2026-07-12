import subprocess
res = subprocess.run(['git', 'status', '-s'], capture_output=True, text=True)
for line in res.stdout.splitlines():
    # Only print line if it starts with space+other or is not D/R/etc.
    # We want to see if any file inside node_modules has status key starting with A or M
    status = line[:2].strip()
    path = line[3:].strip()
    if ('node_modules' in path) and ('D' not in status):
        print(f"TRACKED: {status} -> {path}")
