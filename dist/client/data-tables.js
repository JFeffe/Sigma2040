import {esc} from './ui.js?v=199';
export function dataTable(headers,rows,label='Tableau comparatif'){
 return `<div class="data-table-wrap"><table class="data-table" aria-label="${esc(label)}"><thead><tr>${headers.map((h,i)=>`<th scope="col" aria-sort="none"><button type="button" data-sort-column="${i}">${esc(h)} <span aria-hidden="true">↕</span></button></th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map((c,i)=>{const o=c&&typeof c==='object'?c:{text:c};return `<td data-label="${esc(headers[i])}" data-sort-value="${esc(o.value??o.text??'')}"${i===0?' class="row-title"':''}>${o.html??esc(o.text)}</td>`;}).join('')}</tr>`).join('')||`<tr><td colspan="${headers.length}">Aucun résultat.</td></tr>`}</tbody></table></div>`;
}
export function compareValues(a,b,direction=1){const an=Number(a),bn=Number(b);return direction*(a!==''&&b!==''&&Number.isFinite(an)&&Number.isFinite(bn)?an-bn:String(a).localeCompare(String(b),'fr',{numeric:true,sensitivity:'base'}));}
export function sortTable(button){const table=button.closest('table'),th=button.closest('th'),col=Number(button.dataset.sortColumn),direction=th.getAttribute('aria-sort')==='ascending'?-1:1,body=table.tBodies[0];
 [...body.rows].sort((a,b)=>compareValues(a.cells[col]?.dataset.sortValue??a.cells[col]?.textContent??'',b.cells[col]?.dataset.sortValue??b.cells[col]?.textContent??'',direction)).forEach(row=>body.append(row));
 table.querySelectorAll('th').forEach(t=>{t.setAttribute('aria-sort','none');const span=t.querySelector('button span');if(span)span.textContent='↕';});th.setAttribute('aria-sort',direction===1?'ascending':'descending');button.querySelector('span').textContent=direction===1?'↑':'↓';
}
