const E=require('../engine.js'),assert=require('node:assert/strict');let n=0;
function test(name,fn){fn();console.log('PASS',name);n++;}
function body(r){return r.cards.concat(r.messages).map(c=>c.body).join('\n');}
test('blank input never fills facts/action/deadline',()=>{const r=E.build({});assert.equal(r.audit.missing.length,6);assert(!body(r).match(/안전조치 진행 중|30분 이내|2시간 이내|접수했습니다|관계기관 공동/));});
test('one word does not infer incident details',()=>{const r=E.build({confirmed:'화재'});assert.equal(r.state.confirmed,'화재');assert(r.cards[0].body.startsWith('화재\n'));});
test('numbers without provenance remain incomplete',()=>assert(!E.build({confirmed:'부상자 2명'}).audit.complete));
test('withheld excluded from output and clean state',()=>{const r=E.build({withheld:'SECRET_PATIENT_NAME',confirmed:'사실'});assert(!JSON.stringify(r).includes('SECRET_PATIENT_NAME'));assert(!E.exportText(r).includes('SECRET_PATIENT_NAME'));});
test('all fictional outputs labeled',()=>{const r=E.build({sample:true});r.cards.concat(r.messages).forEach(c=>assert(E.cardText(r,c).startsWith('[교육용 가상 상황')));});
test('all phases preserve missing deadline',()=>['prevention','preparedness','0-2','2-6','6-24','24+'].forEach(phase=>assert(E.build({phase}).cards[0].body.includes('[확인 필요: 확정한 다음 안내 시각]'))));
test('payload preserved as literal text',()=>{const p='<img src=x onerror=alert(1)>';assert(E.build({confirmed:p}).cards[0].body.includes(p));});
test('risk phrase forces review',()=>assert(!E.assess({confirmed:'확실합니다',factSource:'출처',factTime:'시각',action:'행동',nextUpdate:'시각',channel:'채널'}).complete));
test('unverified claim not labeled false',()=>assert(!body(E.build({unknown:'온라인 주장'})).includes('거짓 정보입니다')));
test('entered next-update time preserved exactly',()=>assert(E.build({nextUpdate:'2026-10-26 14:00 KST'}).cards[0].body.includes('2026-10-26 14:00 KST')));
test('provenance clearly user-provided',()=>assert(E.provenance(E.build({factSource:'공지'})).includes('사용자 입력')));
test('empty source never creates source URL',()=>assert(!body(E.build({})).includes('http')));
console.log(n+' engine tests passed');
