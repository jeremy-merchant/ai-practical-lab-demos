'use strict';
(function () {
  const MAX_JSON_PARSE = 20 * 1024 * 1024;
  const PREFIX = 128 * 1024;
  const $ = (id) => document.getElementById(id);
  const asSize = (n) => n >= 1024*1024 ? (n/(1024*1024)).toFixed(1)+'MB' : (n/1024).toFixed(1)+'KB';
  const result = (id,status,title,lines) => {
    const node=$(id);
    node.className='result '+status;
    node.replaceChildren();
    const h=document.createElement('h3');h.textContent=title;node.appendChild(h);
    if(lines.length){
      const ul=document.createElement('ul');
      lines.forEach(line=>{const li=document.createElement('li');li.textContent=line;ul.appendChild(li)});
      node.appendChild(ul);
    }
  };
  function looksLikeConversation(c) {
    return !!c && typeof c === 'object' && (c.mapping && typeof c.mapping === 'object' || Array.isArray(c.messages));
  }
  async function checkJson(file) {
    if(!file)return;
    if(!/\.json$/i.test(file.name)) {result('json-result','fail','JSON 파일을 선택해 주세요.',['.json 확장자만 기본 검사합니다.']);return}
    result('json-result','','브라우저에서 검사 중…',['파일은 서버로 전송하지 않습니다.']);
    try {
      if(file.size===0) throw new Error('파일 내용이 없습니다.');
      if(file.size>MAX_JSON_PARSE){
        const prefix=(await file.slice(0,PREFIX).text()).replace(/^\uFEFF/,'').trimStart();
        const startsAsArray=prefix.startsWith('[');
        const hasPattern=/"mapping"\s*:|"messages"\s*:/.test(prefix);
        result('json-result','warn','대용량 파일 · 제한적 확인',[
          '크기: '+asSize(file.size)+' (20MB 초과)',
          startsAsArray?'첫 부분에서 JSON 배열 형식을 확인했습니다.':'첫 부분에서 JSON 배열 형식을 확인하지 못했습니다.',
          hasPattern?'첫 부분에서 대화 관련 키워드를 찾았습니다.':'시작 부분에 대화 관련 키워드가 보이지 않지만, 뒤쪽에 있을 수 있습니다.',
          '전체 내용을 파싱하지 않았습니다. 이 결과로 호환 여부를 확정할 수 없습니다.'
        ]);
        return;
      }
      const raw=(await file.text()).replace(/^\uFEFF/,'');
      const parsed=JSON.parse(raw);
      const rows=Array.isArray(parsed)?parsed:Array.isArray(parsed?.conversations)?parsed.conversations:null;
      if(!rows) {result('json-result','fail','알려진 대화 목록 형태가 아닙니다.',['JSON 자체는 읽혔지만 최상위 배열이나 conversations 배열을 찾지 못했습니다.']);return}
      const n=rows.length;
      let mapping=0,messages=0,unrecognized=0;
      for(const c of rows){
        if(c&&typeof c==='object'&&c.mapping&&typeof c.mapping==='object'&&!Array.isArray(c.mapping))mapping++;
        else if(c&&Array.isArray(c.messages))messages++;
        else unrecognized++;
      }
      const lines=[
        '검사한 파일 크기: '+asSize(file.size),
        '대화로 보이는 항목: '+(mapping+messages).toLocaleString('ko-KR')+' / '+n.toLocaleString('ko-KR')+'개',
        'mapping 형식: '+mapping.toLocaleString('ko-KR')+'개 · messages 형식: '+messages.toLocaleString('ko-KR')+'개'
      ];
      if(unrecognized)lines.push('알 수 없는 형식의 항목: '+unrecognized.toLocaleString('ko-KR')+'개');
      lines.push('이 검사는 구조만 확인했습니다. 첨부 파일·분기 복원·전체 호환성을 보장하지 않습니다.');
      result('json-result',n>0 && unrecognized===0?'success':'warn',n>0&&unrecognized===0?'기본 대화 목록 형식 확인':'추가 확인이 필요한 JSON',lines);
    } catch(e) {
      result('json-result','fail','JSON을 해석하지 못했습니다.',[e instanceof SyntaxError?'JSON 문법이 올바르지 않거나 파일이 손상됐을 수 있습니다.':'파일을 읽을 수 없습니다.', '개인정보가 담긴 파일을 이 페이지에 공개하지 마세요.']);
    }
  }
  function parseCsvFirstRecord(text,sep){
    let rows=[],field='',inside=false,first=true;
    for(let i=0;i<text.length;i++){
      const c=text[i];
      if(c==='"'){
        if(inside && text[i+1]==='"') {field+='"';i++}
        else inside=!inside;
        continue;
      }
      if(!inside && c===sep){rows.push(field.trim());field='';continue}
      if(!inside && (c==='\n'||c==='\r')){rows.push(field.trim());return rows}
      field+=c;
    }
    rows.push(field.trim());
    return rows;
  }
  function separatorOf(text) {
    const candidates=[',','\t',';'];
    let first=text.split(/\r?\n/,1)[0]||'';
    let best=',',count=-1;
    for(const c of candidates){
      const number=parseCsvFirstRecord(first,c).length;
      if(number>count){count=number;best=c}
    }
    return best;
  }
  const aliases={
    date:['date','day','날짜','일자','reporting starts','reporting start','reporting date'],
    spend:['spend','amount spent','cost','spend krw','media cost','광고비','비용','지출 금액','지출금액'],
    campaign:['campaign','campaign name','campaign id','캠페인','캠페인 이름'],
    adId:['ad id','ad_id','광고 id','광고id','creative id','ad name','광고 이름'],
    impressions:['impressions','imps','노출','노출수','노출 횟수','노출수량'],
    clicks:['clicks','link clicks','click','클릭','링크 클릭'],
    installs:['installs','app installs','mobile app installs','install','설치','앱 설치'],
    currency:['currency','통화']
  };
  const labels={date:'날짜',spend:'광고비',campaign:'캠페인',adId:'광고 ID/소재',impressions:'노출',clicks:'클릭',installs:'설치',currency:'통화'};
  function normalized(s) {return String(s).toLocaleLowerCase().replace(/[_-]+/g,' ').replace(/\s+/g,' ').replace(/[()]/g,'').trim()}
  async function checkCsv(file) {
    if(!file)return;
    if(!/\.(csv|tsv)$/i.test(file.name)){result('csv-result','fail','CSV 또는 TSV 파일을 선택해 주세요.',['.csv 또는 .tsv 확장자만 확인합니다.']);return}
    result('csv-result','','헤더만 읽는 중…',['CSV 내용 전체는 검사하지 않습니다.']);
    try {
      if(file.size===0)throw new Error('내용 없음');
      const buffer=await file.slice(0,PREFIX).arrayBuffer();
      let txt=new TextDecoder('utf-8',{fatal:false}).decode(buffer).replace(/^\uFEFF/,'');
      if(txt.startsWith('sep='))txt=txt.slice((txt.indexOf('\n')+1)||0);
      const sep=file.name.toLowerCase().endsWith('.tsv')?'\t':separatorOf(txt);
      const fields=parseCsvFirstRecord(txt,sep).filter(Boolean).slice(0,120);
      if(fields.length<2){result('csv-result','warn','헤더 구분이 어렵습니다.',['파일에서 2개 이상의 컬럼을 확인하지 못했습니다. Excel 저장 형식, 인코딩 및 구분자를 점검하세요.']);return}
      const hits={};
      for(const key of Object.keys(aliases)){
        hits[key]=fields.some(f=>aliases[key].some(alias=>{const a=normalized(alias),n=normalized(f);return n===a || (a.length>4 && n.includes(a))}));
      }
      const found=Object.keys(hits).filter(k=>hits[k]).map(k=>labels[k]);
      const missing=Object.keys(hits).filter(k=>!hits[k]).map(k=>labels[k]);
      const status=hits.date&&hits.spend?'success':'warn';
      const lines=[
        '컬럼 총 '+fields.length+'개 · 구분자 '+(sep==='\t'?'탭':sep===';'?'세미콜론':'쉼표')+' 추정',
        '주요 열 후보: '+(found.join(', ')||'확인되지 않음'),
        '확인이 필요한 열: '+(missing.join(', ')||'없음'),
        '광고비·날짜가 있어도 실제 CSV의 파싱·지표 정의·어트리뷰션 호환성을 보장하지 않습니다.'
      ];
      if(file.size>15*1024*1024)lines.push('파일이 15MB를 초과합니다. 유료판의 파일 크기 제한을 먼저 확인하세요.');
      if((txt.match(/\uFFFD/g)||[]).length>4)lines.push('문자 깨짐이 감지됐습니다. UTF-8 인코딩으로 다시 내보내 보세요.');
      result('csv-result',status,status==='success'?'기본 필수 열 후보 확인':'필수 열 점검이 필요합니다.',lines);
    } catch(e) {
      result('csv-result','fail','헤더를 읽지 못했습니다.',['파일 형식, 인코딩, 구분자를 확인해 주세요.']);
    }
  }
  $('json-file').addEventListener('change',(e)=>{const f=e.target.files?.[0];if(f)checkJson(f)});
  $('csv-file').addEventListener('change',(e)=>{const f=e.target.files?.[0];if(f)checkCsv(f)});
  if(typeof window!=='undefined')window.__localPrecheck={parseCsvFirstRecord,separatorOf,normalized,looksLikeConversation,aliases};
})();
