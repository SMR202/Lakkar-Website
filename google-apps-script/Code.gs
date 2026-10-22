// Private gateway: deploy as owner; callers must provide the server secret.

function setup() {

 const s=SpreadsheetApp.getActive();

 const tables={Products:['id','name','category','price','stock','image','description','dimensions','care','active'],Delivery:['id','name','fee','city'],Settings:['key','value'],Orders:['record','orderId','created','name','phone','city','total','status','emailStatus']};

 Object.keys(tables).forEach(n=>{if(!s.getSheetByName(n)){const sh=s.insertSheet(n);sh.appendRow(tables[n]);sh.setFrozenRows(1);}});

 PropertiesService.getScriptProperties().setProperty('SHEET_ID',s.getId());

 if(!ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='sendPendingEmails'))ScriptApp.newTrigger('sendPendingEmails').timeBased().everyMinutes(5).create();

}

function sheet_(n){return SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SHEET_ID')).getSheetByName(n);}

function rows_(n){const a=sheet_(n).getDataRange().getValues();const h=a.shift();return a.filter(r=>r[0]!=='').map(r=>Object.fromEntries(h.map((k,i)=>[k,r[i]])));}

function settings_(){return Object.fromEntries(rows_('Settings').map(r=>[r.key,String(r.value)]));}

function records_(){return rows_('Orders').map(r=>{const o=JSON.parse(r.record);return {...o,status:r.status||o.status,emailStatus:r.emailStatus||o.emailStatus};});}

function catalog_(){

 const settings=settings_(), orders=records_().filter(o=>o.status!=='cancelled');

 return {ordersOpen:settings.ordersEnabled==='true',currency:settings.currency||'PKR',site:Object.fromEntries(Object.entries(settings).filter(([k])=>['heroTitle','heroText','heroImage','logo','instagram','announcement','collectionTitle','collectionText','storyTitle','storyText','storyImage','tagline','contactEmail','contactTitle','contactText'].includes(k))),whatsapp:settings.whatsapp,policies:{delivery:settings.delivery,returns:settings.returns,privacy:settings.privacy},zones:rows_('Delivery').map(z=>({...z,fee:Number(z.fee)})),products:rows_('Products').filter(p=>p.active===true||String(p.active).toLowerCase()==='true').map(p=>({id:String(p.id),name:String(p.name),category:String(p.category),price:Number(p.price),stock:Math.max(0,Number(p.stock)-orders.reduce((s,o)=>s+o.lines.filter(i=>i.id===String(p.id)).reduce((v,i)=>v+i.quantity,0),0)),image:String(p.image),description:String(p.description),dimensions:String(p.dimensions),care:String(p.care)}))};

}

function doPost(e){

 try{

 const r=JSON.parse(e.postData.contents), secret=PropertiesService.getScriptProperties().getProperty('GATEWAY_SECRET');

 if(!secret||r.secret!==secret)throw Error('Unauthorized');

 let data;

 if(r.action==='catalog')data=catalog_();

 else if(r.action==='order'){const lock=LockService.getScriptLock();lock.waitLock(25000);try{data=createOrder_(r.payload);}finally{lock.releaseLock();}}

 else throw Error('Unknown action');

 return json_({ok:true,data});

 }catch(err){return json_({ok:false,error:err.message==='Unauthorized'?'Unavailable':err.message});}

}

function createOrder_(p){

 if(!p||!/^[-0-9a-f]{36}$/i.test(p.key)||!Array.isArray(p.items)||!p.items.length||p.items.length>30)throw Error('Invalid order');

 const customer=p.customer;

 if(!customer||typeof customer.name!=='string'||customer.name.trim().length<2||customer.name.length>80||! /^(?:\+92|0)3\d{9}$/.test(customer.phone)||typeof customer.address!=='string'||customer.address.length<12||customer.address.length>400||typeof customer.city!=='string'||customer.city.length<2||customer.city.length>80||String(customer.notes||'').length>500||String(customer.email||'').length>150)throw Error('Invalid delivery details');

 const fingerprint=JSON.stringify({customer:p.customer,items:p.items,expectedTotal:p.expectedTotal}),existing=records_().find(o=>o.key===p.key);

 if(existing){if(existing.fingerprint!==fingerprint)throw Error('Order key already used. Start a new checkout.');return {id:existing.id,total:existing.total,delivery:existing.delivery};}

 const c=catalog_();if(!c.ordersOpen)throw Error('Orders unavailable');const zone=c.zones.find(z=>z.id===customer.zone);if(!zone)throw Error('Choose an available delivery area.');if(String(customer.city).trim().toLowerCase()!==String(zone.city||zone.name).trim().toLowerCase())throw Error('Delivery area does not match your city.');const settings=settings_();if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(settings.ownerEmail||'')||!/^\d{10,15}$/.test(settings.whatsapp||''))throw Error('Store contact setup unavailable');

 const count={};p.items.forEach(i=>{if(typeof i.id!=='string'||!Number.isInteger(i.quantity)||i.quantity<1||i.quantity>20)throw Error('Invalid quantity');count[i.id]=(count[i.id]||0)+i.quantity;});

 const cache=CacheService.getScriptCache(),rateKey='phone:'+customer.phone.replace(/^0/,'92').replace(/^\+/,'');const attempts=Number(cache.get(rateKey)||0);if(attempts>=5)throw Error('Too many attempts. Try again in 15 minutes.');

 const lines=Object.keys(count).map(id=>{const product=c.products.find(x=>x.id===id),quantity=count[id];if(!product||quantity>20||quantity>product.stock)throw Error('Requested stock unavailable. Review your bag.');if(!Number.isSafeInteger(product.price)||product.price<0)throw Error('Price unavailable');return {id,name:product.name,quantity,price:product.price};});

 if(!Number.isSafeInteger(zone.fee)||zone.fee<0)throw Error('Delivery unavailable');

 const subtotal=lines.reduce((s,i)=>s+i.price*i.quantity,0);

 if(p.expectedTotal!==subtotal+zone.fee)throw Error('Prices changed. Review your updated bag before ordering.');
 const o={id:'LH-'+Utilities.getUuid().slice(0,8).toUpperCase(),key:p.key,fingerprint,created:new Date().toISOString(),customer,lines,subtotal,delivery:zone.fee,total:subtotal+zone.fee,status:'pending',emailStatus:'pending'};

 // One ledger row atomically commits reservation, order and notification outbox.

 cache.put(rateKey,String(attempts+1),900);sheet_('Orders').appendRow([JSON.stringify(o),o.id,o.created,safeCell_(customer.name),safeCell_(customer.phone),safeCell_(customer.city),o.total,o.status,o.emailStatus]);SpreadsheetApp.flush();

 return {id:o.id,total:o.total,delivery:o.delivery};

}

function sendPendingEmails(){

 const lock=LockService.getScriptLock();if(!lock.tryLock(1000))return;

 try{const settings=settings_();if(!settings.ownerEmail)return;

 records_().forEach((o,i)=>{if(o.emailStatus!=='pending')return;

 const phone=o.customer.phone.replace(/^0/,'92').replace(/^\+/,'');

 const message='Hello '+o.customer.name+', your Lakkar Home order '+o.id+' is confirmed. Total PKR '+o.total+'.';

 const body=['New COD order '+o.id,'Name: '+o.customer.name,'Phone: '+o.customer.phone,'Email: '+(o.customer.email||''),'Address: '+o.customer.address+', '+o.customer.city,'Notes: '+(o.customer.notes||''),...o.lines.map(l=>l.name+' x '+l.quantity+' — PKR '+l.price*l.quantity),'Delivery: '+(settings.currency||'PKR')+' '+o.delivery,'Total: '+(settings.currency||'PKR')+' '+o.total,'Confirm with customer: https://wa.me/'+phone+'?text='+encodeURIComponent(message)].join('\n');

 try{MailApp.sendEmail({to:settings.ownerEmail,subject:'Lakkar Home COD order '+o.id,body});o.emailStatus='sent';sheet_('Orders').getRange(i+2,9).setValue('sent');}catch(err){console.error('Notification pending for '+o.id);}

 });}finally{lock.releaseLock();}

}

function json_(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);}


function safeCell_(value){const text=String(value);return /^[=+@\-]/.test(text)?"'"+text:text;}
