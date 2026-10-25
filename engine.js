/* Pure, deterministic draft builder. It does not infer incident facts. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GuideEngine=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const VERSION='2026.10.25-r1';
  const FIELDS=['incidentType','orgType','phase','keywords','confirmed','factSource','factTime','action','nextUpdate','channel','unknown'];
  const MAX={confirmed:5000,action:2000,unknown:1500,factSource:1000,keywords:500,channel:500,factTime:150,nextUpdate:150};
  function clean(input){const s={};FIELDS.forEach(k=>s[k]=typeof input[k]==='string'?input[k].trim().slice(0,MAX[k]||100):'');s.sample=input.sample===true;return s;}
  function assess(input){const s=clean(input),missing=[];[['confirmed','확인한 사실'],['factSource','사실 출처'],['factTime','확인 기준 시각'],['action','행동 안내'],['nextUpdate','다음 안내 시각'],['channel','안내 채널']].forEach(([k,label])=>{if(!s[k])missing.push(k==='confirmed'?'확인한 사실':label);});const warnings=[];if(/확실합니다|문제 없습니다|책임이 없습니다|무조건|별일 아닙니다/.test(s.confirmed+' '+s.action))warnings.push('단정하거나 축소하는 표현을 직접 검토하세요.');if(/[<][^>]+[>]/.test(s.confirmed+s.action+s.unknown))warnings.push('태그처럼 보이는 입력이 있습니다. 글자로만 처리합니다.');return {missing,warnings,complete:!missing.length&&!warnings.length};}
  function block(value,placeholder){return value||`[확인 필요: ${placeholder}]`;}
  function build(input){
    const s=clean(input),audit=assess(s),refs=['cdc-cerc-intro','cdc-cerc-messages'];
    const fact=block(s.confirmed,'공개 가능한 사실'),action=block(s.action,'승인한 행동 안내'),next=block(s.nextUpdate,'확정한 다음 안내 시각'),channel=block(s.channel,'공식 안내 채널');
    const uncertainty=s.unknown?`아직 확인하지 못한 항목: ${s.unknown}`:'[확인 필요: 미확인 항목이 있는지 점검]';
    const common=`${fact}\n\n지금 필요한 행동: ${action}\n다음 안내: ${next}\n안내 채널: ${channel}`;
    const cards=[
      {id:'first',title:'지금 전할 핵심 안내',kind:'검토용 초안',body:common,note:'한 줄에 한 정보씩 전하세요. 빈칸을 채우고 직접 검토한 뒤 사용하세요.',refs},
      {id:'family',title:'피해자·가족에게',kind:'상황별 응대 틀',body:`지금 가장 필요한 도움이나 궁금한 점을 말씀해 주세요.\n\n${fact}\n\n[확인 필요: 안내할 수 있는 지원 절차·담당 창구]\n${uncertainty}`,note:'피해 발생·구조 진행·지원 약속을 앱이 추정하지 않습니다. 상황에 맞춰 공감 표현을 직접 덧붙이세요.',refs:['cdc-cerc-intro','cdc-cerc-spokesperson']},
      {id:'media',title:'언론 브리핑·질의 응답',kind:'검토용 초안',body:`${fact}\n\n${uncertainty}\n다음 안내: ${next}\n안내 채널: ${channel}`,note:'초기 구조 안내와 정식 기자회견은 다릅니다. 원인·책임·피해 수치·보상은 확인 전 단정하지 마세요.',refs:['cdc-cerc-spokesperson','fema-jis']},
      {id:'pressure',title:'아직 답하기 어려운 질문',kind:'상황별 응대 틀',body:`현재 확보한 자료만으로는 그 질문에 답하기 어렵습니다.\n[확인 필요: 질문 요지·확인 담당자·확인 방법]\n다음 안내: ${next}`,note:'질문 접수·조사 착수·내부 보고를 마쳤다고 꾸며 넣지 않습니다.',refs:['cdc-cerc-spokesperson']},
      {id:'correction',title:'정정 안내',kind:'빈칸을 채우는 틀',body:'[확인 필요: 이전 안내 중 바뀐 내용]\n최신 안내: [출처로 확인한 내용]\n변경 사유: [확인한 사유]\n적용 기준 시각: [날짜·시각·시간대]\n지금 필요한 행동: [승인한 안내]\n문안 버전: [새 버전]',note:'미확인 정보와 거짓 정보는 다릅니다. 이전 안내를 지우지 말고 변경 기록을 남기세요.',refs:['cdc-cerc-intro','cdc-cerc-spokesperson']}
    ];
    const messages=[
      {id:'sms',title:'주민 문자',kind:'검토용 초안',body:common,note:'발송 서비스에 맞춰 길이를 직접 조정하세요. 숫자나 행동 정보를 임의로 줄이지 마세요.',refs},
      {id:'reply',title:'짧은 언론 회신',kind:'검토용 초안',body:`${fact}\n다음 안내: ${next}\n안내 채널: ${channel}`,note:'실제로 접수하지 않은 문의를 “접수했습니다”라고 쓰지 않습니다.',refs:['cdc-cerc-spokesperson']},
      {id:'internal',title:'내부 공지',kind:'검토용 초안',body:`공통 안내 문안을 확인해 주세요.\n${fact}\n\n${uncertainty}\n안내 채널: ${channel}`,note:'비공개 메모는 이 문안에 포함하지 않습니다.',refs:['fema-jis']}
    ];
    return {version:VERSION,state:s,audit,cards,messages};
  }
  function provenance(result){const s=result.state;return `사실 출처: ${s.factSource||'미입력'}\n확인 기준 시각: ${s.factTime||'미입력'}\n출처와 사실은 사용자 입력입니다. 앱이 원문을 읽거나 사실을 검증하지 않았습니다.`;}
  function cardText(result,card,sources=[]){return [result.state.sample?'[교육용 가상 상황 · 실제 배포 금지]':'[검토용 초안 · 자동 사실 검증 아님]',card.title,card.body,'',card.note,'',provenance(result),'',...card.refs.map(id=>{const src=sources.find(x=>x.id===id);return src?`작성 원칙: ${src.title} (${src.date||'발행일 미표기'})\n${src.url}`:'';}).filter(Boolean),`앱 버전: ${VERSION}`].join('\n');}
  function exportText(result,sources=[]){return result.cards.concat(result.messages).map(c=>cardText(result,c,sources)).join('\n\n━━━━━━━━━━━━━━━━━━━━\n\n');}
  return {VERSION,FIELDS,clean,assess,build,provenance,cardText,exportText};
});
