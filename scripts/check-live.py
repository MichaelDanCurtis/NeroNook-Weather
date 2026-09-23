import subprocess,json,selectors,time
p=subprocess.Popen(['Runtime/node','Resources/worker.mjs'],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,text=True)
place={'name':'Honolulu','region':'Oahu','country':'United States','countryCode':'US','lat':21.3069,'lon':-157.8583,'timezone':'Pacific/Honolulu'}
feeds=['weather','marine','air','alerts','radar','satellite','cyclones','tides']
for feed in feeds:p.stdin.write(json.dumps({'id':feed,'action':'feed','feed':feed,'place':place})+'\n')
p.stdin.flush();s=selectors.DefaultSelector();s.register(p.stdout,selectors.EVENT_READ);results={};end=time.time()+90
while len(results)<len(feeds) and time.time()<end:
 if not s.select(1):continue
 line=p.stdout.readline()
 if not line:break
 r=json.loads(line);results[r['id']]=r
 for k in ['id','ok']:pass
 d=r.get('data',{});print(json.dumps({'feed':r['id'],'ok':r['ok'],'provider':d.get('provider'),'hourly':len(d.get('hourly',{}).get('time',[])),'error':d.get('error'),'fetchedAt':d.get('fetchedAt')}),flush=True)
p.stdin.close();p.wait(timeout=5)
with open('/tmp/weather-live-results.json','w') as f:json.dump(results,f)
if set(results)!=set(feeds):raise SystemExit('Some feeds timed out')
