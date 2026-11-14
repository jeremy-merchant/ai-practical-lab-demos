
'use strict';
(function(){
const chats=[
{title:'광고 보고서 기획',date:'2026.11.09',messages:[['사용자','광고 보고서에 어떤 지표가 필요해?'],['어시스턴트','기간, 매체, 광고비, 설치 수, 전환 이벤트 정의를 먼저 정리해 보세요.']]},
{title:'영상 제작 워크플로',date:'2026.11.08',messages:[['사용자','여러 짧은 영상 클립을 조립하려면?'],['어시스턴트','클립 해상도와 프레임 속도를 먼저 확인하고, 순서를 고정한 후 출력 영상을 재생해 검수합니다.']]},
{title:'자동화 인수인계',date:'2026.11.07',messages:[['사용자','자동화 프로젝트를 다른 담당자에게 넘기려면?'],['어시스턴트','실행 환경, 입력 데이터, 완료 기준, 검증 결과, 남은 위험을 기록하세요.']]}]
let selected=0;
const list=document.getElementById('chatList'),body=document.getElementById('chatBody'),query=document.getElementById('query'),count=document.getElementById('archiveCount');
function render(){
 const q=query.value.trim().toLocaleLowerCase(),matches=chats.map((v,i)=>({v,i})).filter(o=>(o.v.title+' '+o.v.messages.map(m=>m[1]).join(' ')).toLocaleLowerCase().includes(q));
 count.textContent=matches.length+'개 가상 대화 검색 결과 · 실데이터 없음';
 if(!matches.find(o=>o.i===selected)) selected=matches.length?matches[0].i:-1;
 list.replaceChildren();
 matches.forEach(o=>{const btn=document.createElement('button');btn.type='button';btn.className=o.i===selected?'active':'';btn.textContent=o.v.title;const small=document.createElement('small');small.textContent=o.v.date;btn.appendChild(small);btn.onclick=function(){selected=o.i;render()};list.appendChild(btn)});
 body.replaceChildren();
 if(selected===-1){const d=document.createElement('p');d.textContent='해당 단어를 포함한 가상 대화가 없습니다.';body.appendChild(d);return}
 const c=chats[selected],h=document.createElement('h4');h.textContent=c.title;body.appendChild(h);
 c.messages.forEach(m=>{const bubble=document.createElement('div');bubble.className='bubble'+(m[0]==='어시스턴트'?' ai':'');const label=document.createElement('strong');label.textContent=m[0];const content=document.createElement('span');content.textContent=m[1];bubble.append(label,content);body.appendChild(bubble)})
}
query.addEventListener('input',render);render();
const data={
a:{name:'릴스 광고 A',prev:[{s:35500,i:11},{s:38000,i:12},{s:38500,i:11},{s:41500,i:11},{s:41200,i:11},{s:42500,i:10},{s:43000,i:10}],now:[{s:44000,i:10},{s:45800,i:9},{s:47600,i:11},{s:49000,i:10},{s:50500,i:8},{s:52100,i:9},{s:53900,i:9}]},
b:{name:'피드 광고 B',prev:[{s:44000,i:14},{s:42000,i:15},{s:42500,i:14},{s:42000,i:15},{s:41800,i:17},{s:40500,i:17},{s:40000,i:18}],now:[{s:39800,i:19},{s:39400,i:19},{s:39000,i:19},{s:38900,i:20},{s:38400,i:21},{s:38000,i:23},{s:37800,i:24}]}}
const won=n=>'₩'+Math.round(n).toLocaleString('ko-KR'),sum=(a,k)=>a.reduce((n,o)=>n+o[k],0);
function showAd(key){
 const item=data[key],total=sum(item.now,'s'),installs=sum(item.now,'i'),prevCpi=sum(item.prev,'s')/sum(item.prev,'i'),cpi=total/installs,delta=(cpi/prevCpi-1)*100;
 document.getElementById('spend').textContent=won(total);document.getElementById('installs').textContent=installs.toLocaleString('ko-KR');document.getElementById('cpi').textContent=won(cpi);
 document.getElementById('delta').textContent='전주 대비 '+(delta>0?'+':'')+delta.toFixed(1)+'%';
 const chart=document.getElementById('adBars');chart.replaceChildren();const max=Math.max(...item.now.map(v=>v.s));
 item.now.forEach(v=>{const col=document.createElement('div');col.className='bar-col';const bar=document.createElement('div');bar.style.height=Math.round(v.s/max*100)+'%';col.append(bar);chart.append(col)});
 document.getElementById('adTip').textContent=delta>0?'가상 샘플: CPI가 증가했습니다. 전환 이벤트·표본·소재 변경 이력을 확인하세요. 원인을 단정하지 않습니다.':'가상 샘플: CPI가 낮아졌습니다. 귀속·이벤트 정의와 표본 조건이 동일한지 확인하세요.';
 document.querySelectorAll('[data-ad]').forEach(b=>b.classList.toggle('active',b.dataset.ad===key))
}
document.querySelectorAll('[data-ad]').forEach(b=>b.addEventListener('click',()=>showAd(b.dataset.ad)));showAd('a');
})();
