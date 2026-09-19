export const STORAGE_KEY = 'moomoo-verse-v1';
export const MISSION_IDS = ['rice','rain','help'];
export function taiwanDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  return ['year','month','day'].map(t=>parts.find(p=>p.type===t).value).join('-');
}
export function validNickname(value) {
  return typeof value==='string' && value.trim()===value && [...value].length>=1 && [...value].length<=16 && !/[\u0000-\u001f\u007f<>]/.test(value);
}
export function validateState(value, now = new Date()) {
  if (!value || typeof value!=='object' || Array.isArray(value) || value.version!==1) throw new Error('這不是支援的哞哞手帳備份。');
  if(!/^MOO-[0-9A-F]{12}$/.test(value.id) || !validNickname(value.nickname)) throw new Error('手帳的名字或編號格式不正確。');
  const created=new Date(value.createdAt);
  if(!Number.isFinite(created.valueOf()) || created>now || created.getUTCFullYear()<2026) throw new Error('手帳建立時間不正確。');
  if(!Array.isArray(value.daily) || value.daily.length>36525 || !Array.isArray(value.missions) || value.missions.length>3) throw new Error('手帳紀錄格式不正確。');
  const today=taiwanDate(now), first=taiwanDate(created);
  for(const date of value.daily){
    if(typeof date!=='string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date>today || date<first || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0,10)!==date) throw new Error('每日紀錄含有無效日期。');
  }
  if(new Set(value.daily).size!==value.daily.length || new Set(value.missions).size!==value.missions.length || value.missions.some(x=>!MISSION_IDS.includes(x))) throw new Error('手帳含有重複或不支援的紀錄。');
  return {version:1,id:value.id,nickname:value.nickname,createdAt:created.toISOString(),daily:[...value.daily].sort(),missions:[...value.missions]};
}
export function createResident(nickname, now = new Date(), random = globalThis.crypto) {
  if(!validNickname(nickname)) throw new Error('請輸入 1–16 個字，不含特殊控制字元。');
  const bytes=new Uint8Array(6);random.getRandomValues(bytes);
  return {version:1,id:'MOO-'+Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('').toUpperCase(),nickname,createdAt:now.toISOString(),daily:[],missions:[]};
}
export function powerOf(state) { return state ? state.daily.length*5+state.missions.length*10 : 0; }
export function recordDaily(state, now = new Date()) { const day=taiwanDate(now);return state.daily.includes(day)?{state,added:false}:{state:{...state,daily:[...state.daily,day]},added:true}; }
export function recordMission(state,id) { if(!MISSION_IDS.includes(id))throw new Error('找不到這則故事。');return state.missions.includes(id)?{state,added:false}:{state:{...state,missions:[...state.missions,id]},added:true}; }
