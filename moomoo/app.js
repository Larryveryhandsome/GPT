if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
location.replace('https://moo.zengzhisui.com/'+location.hash);
