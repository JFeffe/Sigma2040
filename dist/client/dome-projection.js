// A continuous atlas on a shallow spherical cap. Pacific margins and ocean
// gaps are compressed; the same invertible transform drives terrain and SVG.
const RAD=Math.PI/180,LY=.7;
const GEO=[-180,-130,-80,-35,35,100,155,180].map(x=>x*RAD);
const CAP=[-68.4,-61,-30,-17,25,48,64,68.4].map(x=>x*RAD);
function interpolate(x,from,to){let i=1;while(i<from.length-1&&x>from[i])i++;return to[i-1]+(x-from[i-1])/(from[i]-from[i-1])*(to[i]-to[i-1]);}
export function domeRaw(yaw=0,pitch=0){
 const a=yaw*RAD,b=pitch*RAD,cb=Math.cos(b),sb=Math.sin(b);
 function forward(lon,lat){const u=interpolate(lon,GEO,CAP)+a,v=lat*LY,x=Math.cos(v)*Math.sin(u),y=Math.sin(v),z=Math.cos(v)*Math.cos(u);return [x*1.22,(y*cb-z*sb)*(1-.22*x*x)];}
 forward.invert=(x,y)=>{x/=1.22;y/=1-.22*x*x;const r=x*x+y*y;if(r>1)return null;const z=Math.sqrt(1-r),wy=y*cb+z*sb,wz=z*cb-y*sb;const lon=interpolate(Math.atan2(x,wz)-a,CAP,GEO),lat=Math.asin(Math.max(-1,Math.min(1,wy)))/LY;return Math.abs(lon)<=Math.PI+1e-8&&Math.abs(lat)<=Math.PI/2+1e-8?[lon,lat]:null;};
 return forward;
}
export function limitDome(c){c.yaw=Math.max(-10,Math.min(10,c.yaw||0));c.pitch=Math.max(-4,Math.min(4,c.pitch||0));c.panX=Math.max(-1.5,Math.min(1.5,c.panX||0));c.panY=Math.max(-1.2,Math.min(1.2,c.panY||0));return c;}
