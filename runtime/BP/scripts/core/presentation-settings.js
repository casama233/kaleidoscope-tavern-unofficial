/** Tavern-owned presentation preferences. No world effects or gameplay state. */
export const GUIDE_LANGUAGE_KEY='kt:standalone_guide_locale';
export const GUIDE_LANGUAGES=Object.freeze(['zh_TW','zh_CN','en_US']);
export const SHAKER_SOUND_KEY='kaleidoscope_tavern:shaker_sound_level';
export const SHAKER_SOUND_LEVELS=Object.freeze(['less','normal','more']);
const SHAKER_SOUND_SCALES=Object.freeze({less:0.5,normal:1,more:1.5});

export const guideLocale=value=>GUIDE_LANGUAGES.includes(value)?value:'zh_TW';
export const shakerSoundLevel=value=>SHAKER_SOUND_LEVELS.includes(value)?value:'normal';
export function getGuideLocale(player){
 try{return guideLocale(player.getDynamicProperty(GUIDE_LANGUAGE_KEY));}catch{return guideLocale();}
}
export function getShakerSoundLevel(player){
 try{return shakerSoundLevel(player.getDynamicProperty(SHAKER_SOUND_KEY));}catch{return 'normal';}
}
export const getShakerSoundMultiplier=player=>SHAKER_SOUND_SCALES[getShakerSoundLevel(player)];

function sameProperty(a,b){
 if(Object.is(a,b))return true;
 // Preserve even a legacy Vector3 value exactly when rolling back a failed save.
 return !!a&&!!b&&typeof a==='object'&&typeof b==='object'&&
  ['x','y','z'].every(axis=>typeof a[axis]==='number'&&Object.is(a[axis],b[axis]));
}

export function savePresentationSettings(player,{locale,shakerSound}){
 if(!GUIDE_LANGUAGES.includes(locale)||!SHAKER_SOUND_LEVELS.includes(shakerSound))
  throw new RangeError('Invalid Tavern presentation preferences');
 const changes=[[GUIDE_LANGUAGE_KEY,locale],[SHAKER_SOUND_KEY,shakerSound]];
 // Snapshot both raw values before any write. Unknown/absent values are restored
 // as received, rather than silently migrating them to the displayed fallback.
 const before=changes.map(([key])=>[key,player.getDynamicProperty(key)]);
 try{
  for(let i=0;i<changes.length;i++){
   const [key,value]=changes[i];
   if(!sameProperty(before[i][1],value))player.setDynamicProperty(key,value);
  }
  for(const [key,value] of changes)
   if(!sameProperty(player.getDynamicProperty(key),value))throw Error('Preference write not acknowledged: '+key);
 }catch(cause){
  const rollbackErrors=[];
  // Try both restores even when one fails. A throwing setter may have written,
  // so read-back, rather than the setter's return, decides whether recovery held.
  for(const [key,value] of before.slice().reverse()){
   let writeError;
   try{player.setDynamicProperty(key,value);}catch(error){writeError=error;}
   try{
    if(!sameProperty(player.getDynamicProperty(key),value))throw Error('Preference rollback not acknowledged: '+key);
   }catch(error){rollbackErrors.push({key,error:String(writeError??error)});}
  }
  const error=new Error('Could not save Tavern presentation preferences: '+cause);
  error.rollbackFailed=rollbackErrors.length>0;error.rollbackErrors=rollbackErrors;
  throw error;
 }
 return {locale,shakerSound};
}
