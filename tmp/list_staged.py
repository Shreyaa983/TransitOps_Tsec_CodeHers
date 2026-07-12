import subprocess
res = subprocess.run(['git', 'diff', '--cached', '--name-only'], capture_output=True, text=True)
for line in res.stdout.splitlines():
    print(line)
