/* Replace these sample beats after writing your storyboard. Text is escaped. */
const content=[
 {id:'opening',title:'把复杂的内容，讲清楚。',eyebrow:'PRESENTATION STARTER',body:'先写每页目标，再选择视觉表达。',theme:'',transition:'soft-fade'},
 {id:'structure',title:'建立关系，再添加动效。',eyebrow:'CONTENT → COMPOSITION',body:'这是起始样例。正式作品应根据内容使用多种布局，并保留技术细节。',theme:'theme-dark',transition:'scene-reset'}
];
document.querySelector('.stage').innerHTML=content.map(s=>`<section class="scene ${s.theme}" data-title="${Keynote.escape(s.title)}" data-transition="${s.transition}"><div class="eyebrow">${Keynote.escape(s.eyebrow)}</div><h2>${Keynote.escape(s.title)}</h2><p class="lead">${Keynote.escape(s.body)}</p></section>`).join('');
globalThis.deck=new Keynote.Presentation({notes:globalThis.speakerNotes});
