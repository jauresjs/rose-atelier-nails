import fr from './locales/fr.json';
export type Language='en'|'fr';
export function chooseLanguage(cookie:string|undefined,header:string|null):Language{
 if(cookie==='fr'||cookie==='en')return cookie;
 const choices=(header||'').split(',').map((part,index)=>{const [tag,...parameters]=part.trim().split(';');const weight=parameters.find(p=>p.trim().startsWith('q='));const q=weight?Number(weight.trim().slice(2)):1;return {tag:tag.toLowerCase().split('-')[0],q,index};}).filter(c=>Number.isFinite(c.q)&&c.q>0&&c.q<=1).sort((a,b)=>b.q-a.q||a.index-b.index);
 for(const c of choices)if(c.tag==='fr'||c.tag==='en')return c.tag;
 return 'en';
}
export function translate(language:Language|undefined,text:string):string{
 if(language!=='fr')return text;
 const translated=Object.hasOwn(fr,text)?(fr as Record<string,string>)[text]:undefined;if(translated)return translated;
 if(text.startsWith('Open this address in '))return 'Ouvre cette adresse dans '+text.slice(21).replace('Chrome or Edge:','Chrome ou Edge :');
 const quota=text.match(/^You’ve used your (\d+) designs today\. (.*)$/);if(quota)return `Tu as utilisé tes ${quota[1]} créations du jour. ${translate(language,quota[2])}`;
 const limit=text.match(/^Your (free|premium) plan includes (\d+) designs per day\. Your allowance resets at midnight UTC\.$/);if(limit)return `Ton offre ${limit[1]==='free'?'gratuite':'Premium'} comprend ${limit[2]} créations par jour. Le compteur repart à zéro à minuit UTC.`;
 return text;
}
export const dateLocale=(language:Language|undefined)=>language==='fr'?'fr-FR':'en-US';
