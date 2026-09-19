import {STORAGE_KEY,createResident,validateState,validNickname,powerOf,recordDaily,recordMission,taiwanDate} from './state.js';
const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
const stories={
 rice:{number:'001',name:'稻田哞',paragraphs:['哞哞坐在田埂邊，看了很久。稻子沒有一下子變高，風倒是來了好幾趟。','「今天好像什麼都沒發生。」牠想。低頭一看，昨天的小芽又長出了一片葉子。','有些事情，不是沒在往前。只是它長大的聲音很小。'],question:'如果小芽還沒有長高，哞哞會怎麼做？',options:['拔起來看看，催它快一點。','照顧它，再給它一點時間。','跟隔壁的稻子比一比。'],answer:1,reply:'給它時間，也給自己時間。稻田哞已加入你的圖鑑。'},
 rain:{number:'002',name:'雨天哞',paragraphs:['宜蘭的雨，又把午後留下來了。哞哞坐在騎樓邊，幫剛進來的人挪出一個位置。','「雨還沒停。」那個人說。「嗯，」哞哞把熱茶推過去，「那就多坐一下。」','有時候，暫停不是耽誤。是讓你帶著一點力氣，繼續往前。'],question:'在這場雨裡，哞哞做了什麼？',options:['陪對方休息，等雨小一點。','催大家冒雨趕路。','責怪自己今天走得太慢。'],answer:0,reply:'雨天也可以是一段好日子。雨天哞已加入你的圖鑑。'},
 help:{number:'003',name:'日常哞',paragraphs:['小店準備收工，門口還有兩箱東西沒搬。哞哞正好路過。','牠沒有說什麼很厲害的話，只把紅領巾拉好，彎下腰：「這個我來扛。」','世界沒有立刻改變。但那個人的今天，確實輕了一點。哞力就是這樣，一點一點長出來。'],question:'哞力，從哪一件小事長出來？',options:['每天都要贏過其他人。','把自己累壞也不能停。','在能力範圍內，幫眼前的人一個忙。'],answer:2,reply:'今天的你，也讓世界輕了一點。日常哞已加入你的圖鑑。'}
};
let state=null, storageAvailable=true, corrupted=false, currentStory=null, confirmAction=null, toastTimer;
function load(){
  if(!storageAvailable)return state;
  try{const raw=localStorage.getItem(STORAGE_KEY);state=raw?validateState(JSON.parse(raw)):null;corrupted=false;}
  catch(error){if(error instanceof SyntaxError || !['SecurityError','QuotaExceededError'].includes(error.name)){corrupted=true;state=null;}else{storageAvailable=false;}}
  return state;
}
function save(next){state=next;corrupted=false;try{if(storageAvailable)localStorage.setItem(STORAGE_KEY,JSON.stringify(next));}catch{storageAvailable=false;}render();}
function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,6000);}
function render(){
  $('#profile-empty').hidden=!!state;$('#profile-active').hidden=!state;
  if(state){$('#resident-name').textContent=state.nickname;$('#resident-id').textContent=state.id;$('#power-value').textContent=powerOf(state);$('#collection-summary').textContent=`已收藏 ${state.missions.length} 則土地故事`;
    const done=state.daily.includes(taiwanDate());$('#daily-button').disabled=done;$('#daily-button').textContent=done?'今天的哞力，已經記下來了':'今天有好好照顧自己 +5';$('#daily-status').textContent=done?'好好休息，明天再一起往前。':'吃飽、喝水、休息後，再替今天留個記號。';
  }
  $('#story-count').textContent=state?.missions.length||0;
  $$('[data-story-card]').forEach(card=>{const done=state?.missions.includes(card.dataset.storyCard);card.classList.toggle('completed',!!done);card.querySelector('.story-state').textContent=done?'已收藏 +10':'未收藏';});
  $('#storage-warning').hidden=storageAvailable&&!corrupted;
  $('#storage-warning').textContent=corrupted?'舊手帳無法讀取，原始資料仍保留。請先匯出原始檔，或在管理中匯入備份。':!storageAvailable?'瀏覽器無法保存資料，目前僅保留在這次開啟的頁面。離開前請匯出備份。':'';
}
function openDialog(id){const dialog=document.getElementById(id);if(!dialog.open)dialog.showModal();}
function closeDialog(button){button.closest('dialog').close();}
function profile(){load();render();$('#nickname').value=state?.nickname||'';$('#profile-error').textContent='';$('#backup-status').textContent='';$('#profile-submit').textContent=state?'更新手帳名字':'建立手帳';$('#export-button').disabled=!state&&!corrupted;$('#reset-button').hidden=!state&&!corrupted;openDialog('profile-dialog');}
function download(data,name,type){const blob=new Blob([data],{type}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function confirm(title,copy,action){$('#confirm-title').textContent=title;$('#confirm-copy').textContent=copy;confirmAction=action;openDialog('confirm-dialog');}
$$('[data-profile]').forEach(b=>b.addEventListener('click',profile));
$$('[data-open]').forEach(b=>b.addEventListener('click',()=>openDialog(b.dataset.open)));
$$('[data-close]').forEach(b=>b.addEventListener('click',()=>closeDialog(b)));
$('#confirm-action').addEventListener('click',()=>{const action=confirmAction;confirmAction=null;$('#confirm-dialog').close();action?.();});
$('#confirm-dialog').addEventListener('close',()=>{confirmAction=null;});
$('#profile-form').addEventListener('submit',event=>{
  event.preventDefault();load();const nickname=$('#nickname').value.trim();
  if(!validNickname(nickname)){$('#profile-error').textContent='請輸入 1–16 個字，不使用 < 或 >。';return;}
  if(corrupted){$('#profile-error').textContent='請先匯出原始檔或匯入備份，再清除無法讀取的手帳。';return;}
  try{save(state?{...state,nickname}:createResident(nickname));$('#profile-dialog').close();toast(`歡迎，${nickname}。慢慢來，哞問題。`);}catch(error){$('#profile-error').textContent=error.message;}
});
$('#daily-button').addEventListener('click',()=>{load();if(!state)return profile();const result=recordDaily(state);if(result.added){save(result.state);toast('今天有照顧好自己。哞力 +5。');}else{render();toast('今天已經記錄過了，休息不用重複證明。');}});
$$('[data-story]').forEach(button=>button.addEventListener('click',()=>{
  load();currentStory=button.dataset.story;const story=stories[currentStory];$('#story-kicker').textContent=`FIELD NOTE / ${story.number} · 線上序章`;$('#story-title').textContent=story.name;$('#story-body').replaceChildren(...story.paragraphs.map(text=>{const p=document.createElement('p');p.textContent=text;return p;}));$('#story-question').textContent=story.question;
  $('#story-options').replaceChildren(...story.options.map((text,i)=>{const label=document.createElement('label'),radio=document.createElement('input'),span=document.createElement('span');radio.type='radio';radio.name='answer';radio.value=String(i);radio.required=true;span.textContent=text;label.append(radio,span);return label;}));
  const done=state?.missions.includes(currentStory);$('#story-feedback').textContent=done?'這則故事已經在你的圖鑑裡，隨時可以回來讀。':'';$('#story-submit').disabled=!!done;$('#story-submit').formNoValidate=!state;$('#story-submit').textContent=done?'已收藏，哞問題。':state?'收藏這段故事 +10':'先建立我的 MOO ID';openDialog('story-dialog');
}));
$('#story-form').addEventListener('submit',event=>{
  event.preventDefault();load();if(!state){$('#story-dialog').close();profile();return;}
  if(!event.currentTarget.reportValidity())return;
  const story=stories[currentStory],answer=new FormData(event.currentTarget).get('answer');if(Number(answer)!==story.answer){$('#story-feedback').textContent='再讀一次故事。哞哞會選一件讓自己與別人都能慢慢往前的小事。';return;}
  const result=recordMission(state,currentStory);if(result.added)save(result.state);$('#story-submit').disabled=true;$('#story-submit').textContent='已收藏，哞問題。';$('#story-feedback').textContent=result.added?story.reply:'這則故事已經收藏過了。';toast(result.added?'故事已收藏。哞力 +10。':'故事已在圖鑑裡。');
});
$('#export-button').addEventListener('click',()=>{load();if(corrupted){try{download(localStorage.getItem(STORAGE_KEY),'moomoo-recovery.json','application/json');$('#backup-status').textContent='已匯出原始資料；這個檔案可能需要修復。';}catch{$('#backup-status').textContent='目前無法讀取原始資料。';}return;}if(!state)return;download(JSON.stringify(state,null,2),`${state.id}-backup.json`,'application/json');$('#backup-status').textContent='已送出下載。請保管好備份檔，不要公開分享。';});
$('#import-file').addEventListener('change',async event=>{
  const file=event.target.files[0];event.target.value='';if(!file)return;
  try{if(file.size>200000)throw new Error('檔案太大，請選擇 200 KB 以內的手帳備份。');const imported=validateState(JSON.parse(await file.text()));
    confirm('用這份備份繼續？',`將載入「${imported.nickname}」的手帳，包含 ${imported.missions.length} 則故事與 ${imported.daily.length} 天的日常紀錄。會取代此裝置目前的手帳，建議先匯出目前資料。`,()=>{save(imported);$('#nickname').value=imported.nickname;$('#profile-submit').textContent='更新手帳名字';$('#export-button').disabled=false;$('#reset-button').hidden=false;$('#backup-status').textContent='匯入完成。已依紀錄重新計算哞力。';toast('手帳回來了。歡迎繼續慢慢走。');});
  }catch(error){$('#backup-status').textContent=error instanceof SyntaxError?'讀不到備份內容，請選擇原本匯出的 JSON 檔。':error.message;}
});
$('#reset-button').addEventListener('click',()=>{confirm('清除這台裝置的手帳？','暱稱、MOO ID、哞力與圖鑑紀錄都會移除。請先匯出備份；清除後無法由網站替你找回。',()=>{try{localStorage.removeItem(STORAGE_KEY);}catch{}state=null;corrupted=false;render();$('#profile-dialog').close();toast('這台裝置的手帳已清除。');});});
window.addEventListener('storage',event=>{if(event.key===STORAGE_KEY){load();render();}});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){load();render();}});
let displayedDay=taiwanDate();
setInterval(()=>{const day=taiwanDate();if(day!==displayedDay){displayedDay=day;load();render();}},15000);
load();render();
if('serviceWorker' in navigator && location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
