export function inInstalledApp(){return matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: minimal-ui)').matches||!!(navigator as Navigator&{standalone?:boolean}).standalone;}
export function appHeaders(){return {'Content-Type':'application/json','X-Rose-App':inInstalledApp()?'standalone':'browser'};}
export function requestInstall(){window.dispatchEvent(new Event('rose-install'));}
