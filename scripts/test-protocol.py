#!/usr/bin/env python3
"""Legacy/modern handshakes and invalid resource/action rejection, without changing saved preferences."""
import json, subprocess, pathlib, queue, threading, uuid
root=pathlib.Path(__file__).resolve().parents[1]
plugin='cafe.nero.plugin.weather'
def check(modern):
 p=subprocess.Popen([str(root/'build/Weather Observatory.app/Contents/MacOS/WeatherPlugin'),'--neronook-plugin','--protocol-test'],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,text=True,bufsize=1)
 session=str(uuid.uuid4()); output=queue.Queue()
 def collect():
  for line in p.stdout:
   try:output.put(json.loads(line))
   except ValueError:pass
 threading.Thread(target=collect,daemon=True).start()
 def send(kind,**kwargs):
  p.stdin.write(json.dumps(dict(apiVersion=1,type=kind,pluginID=plugin,session=session,sequence=0,**kwargs))+'\n');p.stdin.flush()
 def wait_for(predicate):
  for _ in range(100):
   m=output.get(timeout=12)
   assert m['pluginID']==plugin and m['session'].lower()==session.lower()
   if predicate(m):return m
  raise AssertionError('response limit')
 try:
  features=['actions-v1','panels-v1','dashboard-v1','diagrams-v1']+(['custom-views-v1','view-resources-v1'] if modern else [])
  send('hello',features=features);ready=wait_for(lambda m:m['type']=='ready');assert 'actions-v1' in ready['features']
  snap=wait_for(lambda m:m['type']=='snapshot')['snapshot'];assert len(snap['activity'])<=100
  if modern:
   view=snap['panels'][0]['customView'];assert view['resourceNamespaces']==['tiles'];assert len(json.dumps(view['state']).encode())<32768
   assert json.loads(view['state']['data']).get('ready') in (True,False)
   request=str(uuid.uuid4());send('viewResource',viewResource=dict(id=request,panelID='observatory',revision='observatory2',path='tiles/../secret'))
   result=wait_for(lambda m:m['type']=='viewResourceResult' and m['viewResourceResult']['id'].lower()==request.lower())['viewResourceResult'];assert result.get('error') and not result.get('data')
   request=str(uuid.uuid4());send('viewResource',viewResource=dict(id=request,panelID='other',revision='old',path='tiles/base/0/0/0/0'))
   result=wait_for(lambda m:m['type']=='viewResourceResult' and m['viewResourceResult']['id'].lower()==request.lower())['viewResourceResult'];assert result.get('error')
  else:
   diagram=snap['panels'][0]['diagrams'][0];assert diagram['width']/diagram['height']==16/9
   assert 'custom-views-v1' not in ready['features']
  request=str(uuid.uuid4());send('bus',bus=dict(operation='execute',requestID=request,address=dict(plugin=plugin,name='unsupported'),values={}))
  result=wait_for(lambda m:m['type']=='bus' and m.get('bus',{}).get('requestID','').lower()==request.lower());assert result['bus']['update']['phase']=='failed'
  print('PASS:', 'modern custom view, bounded state, invalid resources' if modern else 'legacy 16:9 fallback', 'and unsupported action rejection')
 finally:
  p.stdin.close()
  try:p.wait(timeout=3)
  except subprocess.TimeoutExpired:p.terminate();p.wait(timeout=3)
check(False);check(True)
