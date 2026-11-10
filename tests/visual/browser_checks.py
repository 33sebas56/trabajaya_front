"""Offline UI contract tests. Uses a controlled API double, NOT the Spring server."""
import asyncio,json,re,copy,os,subprocess,time,urllib.request
from pathlib import Path
from urllib.parse import urlparse,parse_qs
from datetime import datetime,timedelta,timezone
from playwright.async_api import async_playwright
F=Path(__file__).resolve().parents[2];Q=Path(__file__).resolve().parent/'artifacts';Q.mkdir(parents=True,exist_ok=True)
NOW=datetime.now(timezone.utc);FUTURE=(NOW+timedelta(days=3)).isoformat()
CATEGORIES=[{'id':i+1,'name':s,'active':True} for i,s in enumerate(['Electricidad','Plomeria','Pintura','Cerrajeria','Cargue y descargue','Mudanzas','Limpieza','Soporte tecnico','Jardineria','Reparaciones generales'])]
class MockAPI:
 def __init__(self):
  self.users={}; self.jobs={};self.messages={};self.calls=[];self.reports=[]
  for i,(role,name,email) in enumerate([('CLIENTE','Laura Martinez','cliente@trabajaya.demo'),('TRABAJADOR','Carlos Ruiz','trabajador@trabajaya.demo'),('ADMIN','Admin Demo','admin@trabajaya.demo')],1):
   self.users[role]={'id':i,'role':role,'name':name,'email':email,'phone':'3000000000','city':'Pasto','skills':[1,2,5,6,10] if role=='TRABAJADOR' else [],'experience':5,'bio':'','available':True,'radius_km':25,'latitude':None,'longitude':None,'avatar_id':None,'active':True,'reputation':{'average':None,'total':0},'reviews':[],'created_at':NOW.isoformat()}
  for i,(title,cat,price,zone) in enumerate([('Instalar dos lamparas de techo',1,70000,'Centro'),('Ayuda para descargar un camion',5,65000,'Torobajo'),('Revisar fuga del lavaplatos',2,40000,'Las Cuadras')],1):
   self.jobs[i]=self.job(i,title,cat,price,zone)
 def job(self,i,title,cat,price,zone):
  return {'id':i,'client_id':1,'client_name':'Laura Martinez','category_id':cat,'category_name':CATEGORIES[cat-1]['name'],'title':title,'description':'Necesito ayuda con este trabajo. Los materiales estan disponibles y acordaremos los detalles antes de comenzar.','city':'Pasto','zone':zone,'address':'Direccion de prueba no real','latitude':None,'longitude':None,'scheduled_at':FUTURE,'duration_hours':2,'workers_needed':1,'current_price':price,'initial_price':price,'max_price':price+50000,'increment_amount':10000,'interval_minutes':10,'auto_increase':False,'next_increase_at':FUTURE,'status':'PUBLICADO','hidden':False,'occupied':0,'images':[],'distance_km':None,'assignments':[],'price_history':[{'amount':price,'origin':'PUBLICACION','created_at':NOW.isoformat()}],'timeline':[],'client_reputation':{'total':0,'average':None},'created_at':NOW.isoformat()}
 async def request(self,r):
  parsed=urlparse(r['url']);path=parsed.path.removeprefix('/api');q=parse_qs(parsed.query);method=r.get('method','GET');token=r.get('token','');u=self.users.get(token);body=r.get('body') or {};self.calls.append([method,path,token]);out=None;status=200
  if isinstance(body,str):
   try: body=json.loads(body)
   except: body={}
  if path=='/health':out={'status':'UP','name':'TrabajaYA','storage':'local','demo':True}
  elif path=='/categories':out=CATEGORIES
  elif path=='/auth/login':
   role=next((role for role,user in self.users.items() if user['email']==body['email']),None)
   if role:out={'token':role,'user':self.users[role]}
   else: status=401;out={'message':'Datos incorrectos'}
  elif path=='/auth/register':
   role=body['role'];new=copy.deepcopy(self.users[role]);new.update({k:v for k,v in body.items() if k not in ['password','acceptedTerms']});new['radius_km']=body.get('radiusKm',15);self.users[role]=new;out={'token':role,'user':new};self.last_registration=body
  elif path=='/auth/logout':out={'message':'Sesion cerrada'}
  elif not u:status=401;out={'message':'Inicia sesion'}
  elif path=='/me':
   if method=='PUT':u.update({{'radiusKm':'radius_km','avatarId':'avatar_id'}.get(k,k):v for k,v in body.items()})
   out=u
  elif re.fullmatch('/users/\\d+',path):out=next(x for x in self.users.values() if x['id']==int(path.rsplit('/',1)[1]))
  elif path=='/dashboard':out={'active':len([j for j in self.jobs.values() if j['status']!='COMPLETADO']),'completed':len([j for j in self.jobs.values() if j['status']=='COMPLETADO']),'rating':None,'reviews':0}
  elif path=='/notifications':out={'items':[],'unread':0}
  elif path.startswith('/notifications/'):out={'message':'OK'}
  elif path=='/jobs' and method=='POST':
   jid=max(self.jobs,default=0)+1;j=self.job(jid,body['title'],body['categoryId'],body['initialPrice'],body['zone']);mapping={'categoryId':'category_id','scheduledAt':'scheduled_at','durationHours':'duration_hours','workersNeeded':'workers_needed','initialPrice':'initial_price','maxPrice':'max_price','incrementAmount':'increment_amount','intervalMinutes':'interval_minutes','autoIncrease':'auto_increase','mediaIds':'images'}
   j.update({mapping.get(k,k):v for k,v in body.items()});self.jobs[jid]=j;out=j
  elif path=='/jobs':
   items=list(self.jobs.values());mine=q.get('mine',['false'])[0]=='true'
   if not mine:items=[j for j in items if j['status']=='PUBLICADO']
   elif u['role']=='TRABAJADOR':items=[j for j in items if any(a['worker_id']==u['id'] for a in j['assignments'])]
   if q.get('category'):items=[j for j in items if j['category_id']==int(q['category'][0])]
   if q.get('minimum'):items=[j for j in items if j['current_price']>=int(q['minimum'][0])]
   out={'items':list(reversed(items)),'total':len(items),'page':0,'size':12}
  elif re.match(r'^/jobs/\d+',path):
   parts=path.split('/');j=self.jobs[int(parts[2])];action=parts[3] if len(parts)>3 else ''
   if action=='increase':j['current_price']=min(j['max_price'],j['current_price']+body['amount']);j['price_history'].append({'amount':j['current_price'],'origin':'MANUAL','created_at':NOW.isoformat()})
   elif action=='accept':
    a={'id':j['id']*10,'job_id':j['id'],'worker_id':u['id'],'worker_name':u['name'],'agreed_price':j['current_price'],'status':'ACEPTADO','accepted_at':NOW.isoformat(),'reviews':[]};j['assignments'].append(a);j['occupied']=1;j['status']='ASIGNADO';self.messages[a['id']]=[]
   elif action=='cancel':j['status']='CANCELADO'
   out=copy.deepcopy(j)
   if u['role']=='TRABAJADOR' and not j['assignments']:
    for key in ['address','latitude','longitude','max_price','initial_price','auto_increase','increment_amount','interval_minutes','next_increase_at']:out.pop(key,None)
  elif path.startswith('/assignments/'):
   parts=path.split('/');aid=int(parts[2]);action='/'.join(parts[3:]);j=next(j for j in self.jobs.values() if any(a['id']==aid for a in j['assignments']));a=next(a for a in j['assignments'] if a['id']==aid)
   if action=='status':
    a['status']=body['status'];j['status']={'INICIADO':'EN_CURSO','TERMINADO':'POR_CONFIRMAR','CONFIRMADO':'COMPLETADO'}.get(a['status'],'ASIGNADO');out=j
   elif action=='review':a['reviews'].append({'id':len(a['reviews'])+1,'author_id':u['id'],'target_id':a['worker_id'] if u['role']=='CLIENTE' else 1,**body});out={'message':'Calificacion guardada'}
   elif action=='messages' and method=='POST':
    m={'id':len(self.messages[aid])+1,'sender_id':u['id'],'sender_name':u['name'],'body':body['body'],'media_id':None,'read_at':None,'created_at':NOW.isoformat()};self.messages[aid].append(m);out=m
   elif action=='messages':out=[m for m in self.messages[aid] if m['id']>int(q.get('after',['0'])[0])]
   elif action=='messages/read':out={'message':'OK'}
   elif action=='messages/read-status':out={'last_read_id':0}
  elif path=='/reports':
   if method=='POST':self.reports.append({'id':len(self.reports)+1,'job_title':self.jobs[body['jobId']]['title'],'status':'ABIERTO','updated_at':NOW.isoformat(),**body})
   out=self.reports
  elif path=='/admin/summary':out={'users':3,'jobs':len(self.jobs),'reports':0,'completed':0}
  elif path=='/admin/users':out=list(self.users.values())
  elif path=='/admin/jobs':out=list(self.jobs.values())
  elif path=='/admin/reports':out=[]
  elif path=='/admin/categories':out=CATEGORIES
  elif path=='/admin/audit':out=[]
  else:status=404;out={'message':'Unimplemented test double route: '+path};print('MOCK MISS',method,path)
  return {'status':status,'body':out}
async def boot_page(browser,mock,role=None,width=1440):
 page=await browser.new_page(viewport={'width':width,'height':1000},device_scale_factor=1)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 await page.expose_function('offlineAPI',mock.request)
 html=(F/'index.html').read_text();html=re.sub(r'<script.*?</script>','',html,flags=re.S);html=re.sub(r'<link[^>]+>','',html)
 await page.set_content(html)
 await page.add_style_tag(content=(F/'styles.css').read_text())
 await page.add_script_tag(content='''const store={};Object.defineProperty(window,'sessionStorage',{value:{getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v,removeItem:k=>delete store[k]}});window.fetch=async(url,opt={})=>{const h=opt.headers||{};const result=await window.offlineAPI({url,method:opt.method||'GET',body:opt.body||null,token:(h.Authorization||'').replace('Bearer ','')});return new Response(JSON.stringify(result.body),{status:result.status,headers:{'Content-Type':'application/json'}})};''')
 if role:await page.evaluate('(role)=>{sessionStorage.setItem("trabajaya.session",role);location.hash="/inicio";}',role)
 await page.add_script_tag(content=(Q/'browser-bundle.js').read_text())
 await page.wait_for_timeout(500)
 return page,errors
async def nav(page,path):
 await page.evaluate('(path)=>{location.hash=path}',path);await page.wait_for_timeout(400)
async def main():
 mock=MockAPI();outcomes=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path=__import__('os').environ.get('CHROMIUM_PATH') or __import__('shutil').which('chromium') or __import__('shutil').which('google-chrome'),args=['--no-sandbox'])
  landing,err=await boot_page(browser,mock)
  await landing.screenshot(path=str(Q/'landing-desktop.png'),full_page=True)
  await landing.set_viewport_size({'width':390,'height':844});await landing.screenshot(path=str(Q/'landing-mobile.png'),full_page=True)
  assert not await landing.evaluate('document.documentElement.scrollWidth>innerWidth'), 'Mobile landing overflow'
  outcomes.append('Landing desktop/mobile without horizontal overflow')
  client,cerr=await boot_page(browser,mock,'CLIENTE')
  await client.locator('h1').filter(has_text='Hola').wait_for();await client.screenshot(path=str(Q/'cliente.png'),full_page=True)
  await nav(client,'/publicar');await client.locator('[name=title]').fill('Instalar una lampara en la sala');await client.locator('textarea[name=description]').fill('Necesito instalar una lampara. Tengo los materiales y el acceso al tablero disponible.');await client.locator('[name=categoryId]').select_option('1');await client.locator('[name=zone]').fill('Centro');await client.locator('[name=address]').fill('Direccion privada de prueba');await client.locator('[name=initialPrice]').fill('60000');await client.locator('[name=maxPrice]').fill('100000');await client.screenshot(path=str(Q/'publicar.png'),full_page=True)
  await client.locator('#job-form button[type=submit]').click();await client.locator('#increase').wait_for(timeout=4000);jid=max(mock.jobs)
  await client.locator('#increase').click();await client.locator('dialog [name=amount]').fill('10000');await client.locator('dialog button[type=submit]').click();await client.wait_for_timeout(400);assert mock.jobs[jid]['current_price']==70000
  outcomes.append('Client publishes and increases offer using API requests')
  worker,werr=await boot_page(browser,mock,'TRABAJADOR');await worker.screenshot(path=str(Q/'trabajador.png'),full_page=True)
  await nav(worker,'/trabajo/'+str(jid));assert await worker.locator('#accept').count()==1
  await worker.locator('#accept').click();await worker.locator('dialog button[type=submit]').click();await worker.locator('#chat-form').wait_for(timeout=4000);aid=jid*10
  assert mock.jobs[jid]['occupied']==1
  await worker.locator('#chat-form [name=body]').fill('Hola, voy con las herramientas.');await worker.locator('#chat-form button[type=submit]').click();await worker.wait_for_timeout(400);assert len(mock.messages[aid])==1
  await worker.evaluate('window.scrollTo(0,0);document.querySelector("#toasts").innerHTML=""');await worker.screenshot(path=str(Q/'seguimiento.png'),full_page=True)
  outcomes.append('Worker accepts and sends message; assignment has frozen price')
  for status in ['EN_CAMINO','EN_LUGAR','INICIADO','TERMINADO']:
   await worker.locator('[data-state="'+status+'"]').click();await worker.locator('dialog button[type=submit]').click();await worker.wait_for_timeout(400)
  await nav(client,'/inicio');await nav(client,'/trabajo/'+str(jid));await client.locator('[data-state=CONFIRMADO]').click();await client.locator('dialog button[type=submit]').click();await client.wait_for_timeout(400)
  await client.locator('[data-review]').click();await client.locator('dialog [name=comment]').fill('Buen trabajo y comunicacion.');await client.locator('dialog button[type=submit]').click();await client.wait_for_timeout(400)
  assert mock.jobs[jid]['status']=='COMPLETADO' and len(mock.jobs[jid]['assignments'][0]['reviews'])==1
  outcomes.append('Ordered progress, client confirmation, final review')
  await nav(client,'/perfil');assert await client.locator('form').count()>0
  await nav(client,'/avisos');await nav(client,'/reportes');await nav(client,'/trabajos')
  await client.set_viewport_size({'width':390,'height':844});await client.wait_for_timeout(800);await client.evaluate('document.querySelector("#toasts").innerHTML=""');await client.screenshot(path=str(Q/'cliente-mobile.png'),full_page=True);assert not await client.evaluate('document.documentElement.scrollWidth>innerWidth'),'Mobile workspace overflow'
  outcomes.append('Profile, notifications, reports and mobile workspace render')
  admin,aerr=await boot_page(browser,mock,'ADMIN');await admin.locator('table').wait_for();await admin.screenshot(path=str(Q/'admin.png'),full_page=True)
  for tab in ['jobs','reports','categories','audit','users']:
   await admin.locator('[data-tab='+tab+']').click();await admin.wait_for_timeout(100);assert await admin.locator('#admin-content .alert.error').count()==0
  access,access_errors=await boot_page(browser,MockAPI())
  await nav(access,'/publicar')
  await access.locator('#auth-form').wait_for()
  assert 'next=' in access.url
  assert await access.locator('[name=email]').input_value()==''
  assert await access.locator('[name=password]').input_value()==''
  assert await access.locator('[data-demo],.demo-accounts').count()==0
  await access.locator('[name=email]').fill('missing@example.test')
  await access.locator('[name=password]').fill('WrongPassword1!')
  await access.locator('#auth-form button[type=submit]').click()
  await access.locator('.form-errors .alert.error').wait_for()
  await access.locator('[name=email]').fill('cliente@trabajaya.demo')
  await access.locator('[name=password]').fill('FixturePassword1!')
  await access.locator('#auth-form button[type=submit]').click()
  await access.locator('#job-form').wait_for()
  assert await access.locator('[name=initialPrice]').input_value()==''
  assert await access.locator('[name=maxPrice]').input_value()==''
  await nav(access,'/admin');await access.locator('h1').filter(has_text='Hola').wait_for()
  assert await access.locator('[data-tab]').count()==0
  await nav(access,'/registro');await access.locator('h1').filter(has_text='Hola').wait_for()
  outcomes.append('Normal blank login, error handling, return destination and role navigation')
  registration_mock=MockAPI();registration,reg_errors=await boot_page(browser,registration_mock)
  await nav(registration,'/registro?role=TRABAJADOR')
  await registration.locator('[name=name]').fill('Nueva Trabajadora')
  await registration.locator('[name=email]').fill('nueva@example.test')
  await registration.locator('[name=password]').fill('ExamplePassword1!')
  await registration.locator('[name=passwordConfirmation]').fill('DoesNotMatch1!')
  await registration.locator('[name=phone]').fill('3001234567')
  await registration.locator('[name=city]').fill('Pasto')
  await registration.locator('label.skill').filter(has_text='Electricidad').click()
  await registration.locator('[name=terms]').check()
  await registration.locator('#auth-form button[type=submit]').click()
  await registration.locator('.form-errors').filter(has_text='no coinciden').wait_for()
  assert not any(c[1]=='/auth/register' for c in registration_mock.calls)
  await registration.locator('[name=passwordConfirmation]').fill('ExamplePassword1!')
  await registration.locator('#auth-form button[type=submit]').click()
  await registration.locator('h1').filter(has_text='Hola').wait_for()
  assert registration_mock.last_registration['role']=='TRABAJADOR'
  assert registration_mock.last_registration['skills']==[1]
  assert 'passwordConfirmation' not in registration_mock.last_registration
  outcomes.append('Worker registration, password confirmation and unchanged API payload')
  login,login_errors=await boot_page(browser,MockAPI())
  await nav(login,'/acceso');await login.screenshot(path=str(Q/'acceso-desktop.png'),full_page=True)
  await login.set_viewport_size({'width':390,'height':844});await login.screenshot(path=str(Q/'acceso-mobile.png'),full_page=True)
  assert not await login.evaluate('document.documentElement.scrollWidth>innerWidth')
  await nav(login,'/ayuda');await login.locator('.help-grid').wait_for()
  assert not await login.evaluate('document.documentElement.scrollWidth>innerWidth')
  outcomes.append('Access and help mobile layout without horizontal overflow')
  for page,errors in [(landing,err),(client,cerr),(worker,werr),(admin,aerr),(access,access_errors),(registration,reg_errors),(login,login_errors)]:
   assert not errors,errors
  outcomes.append('No uncaught browser JavaScript exceptions')
  (Q/'browser-report.json').write_text(json.dumps({'kind':'OFFLINE_UI_WITH_CONTROLLED_API_DOUBLE','passed':outcomes,'api_calls':len(mock.calls),'not_tested':'Real Spring Boot API, PostgreSQL, Supabase and SMTP are not exercised by this frontend test.'},indent=2))
  print(json.dumps(outcomes,indent=2));print('API calls:',len(mock.calls))
  await browser.close()
if __name__=='__main__':
 asyncio.run(main())
