const assert=require('node:assert/strict');
const test=require('node:test');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('homepage includes exact domain ownership proof in HTML head',()=>{
  const home=read('index.html'),head=home.split('</head>')[0];
  assert.match(head,/<meta name="saaskr-verification" content="saaskr-verify-f0cc5ba8aaca8bbabbcdd9dc">/);
  assert.match(head,/<link rel="alternate" type="text\/plain" href="\/llms\.txt"/);
});
test('support explains both paid products are offline HTML, not Python',()=>{
  const contact=read('contact/index.html');
  assert.match(contact,/Archive Lens와 AdPilot Lite는 HTML 도구/);
  assert.match(contact,/Python 설치가 필요하지 않습니다/);
  assert.doesNotMatch(contact,/브라우저 또는 Python 버전/);
  assert.doesNotMatch(contact,/Python 스크립트는 해당 상품/);
});
test('llms.txt discloses real product prices, sample-only demo and material limits',()=>{
  const t=read('llms.txt');
  for(const s of ['19,000원','29,000원','가상','파일을 업로드하지','보증하지','https://www.latpeed.com/products/tej54','https://www.latpeed.com/products/sb5ge','개인정보','2026-11-15'])assert.ok(t.includes(s),s);
  assert.ok(t.length<12000);
});
test('public llms.txt never contains passwords, API keys or customer payloads',()=>{
  const t=read('llms.txt');
  for(const s of ['sk_live_','ghp_','AKIA','Bearer ','-----BEGIN PRIVATE KEY-----','saaskr-verify-'])assert.ok(!t.includes(s),s);
});
test('independent Dreamboat introduction is linked without implying official certification',()=>{
  const home=read('index.html'),repo=read('README.md');
  const article='https://dreamboat.kr/discover/ai-practical-lab-chatgpt-archive-ad-csv';
  assert.ok(home.includes(article));
  assert.ok(repo.includes(article));
  assert.ok(home.includes('드림보트의 외부 소개 글'));
  assert.ok(repo.includes('not a product certification'));
});