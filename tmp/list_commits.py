import subprocess
res = subprocess.run(['git', 'log', 'origin/main..HEAD', '--format=%h %s'], capture_output=True, text=True)
for line in res.stdout.splitlines():
    print(line)
