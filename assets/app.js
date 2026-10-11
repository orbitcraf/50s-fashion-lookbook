'use strict';
(() => {
  const filters = ['すべて','春','夏','秋','冬','パンツ','スカート','ワンピース','カジュアル','きれいめ','ナチュラル','仕事','お出かけ','旅行'];
  const grid = document.getElementById('outfit-grid');
  const dialog = document.getElementById('outfit-dialog');
  const detailImage = document.getElementById('detail-image');
  const previous = document.getElementById('previous-outfit');
  const next = document.getElementById('next-outfit');
  let visible = window.OUTFITS.slice();
  let position = 0;
  let opener = null;
  const number = id => String(id).padStart(3, '0');
  const altFor = outfit => `架空の50代女性の全身コーデ。${[outfit.tops,outfit.bottoms,outfit.shoes,outfit.outer].filter(Boolean).join('、')}。`;
  function element(tag, className, content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
  }
  function tags(outfit, target) {
    target.replaceChildren(...[...outfit.season,...outfit.category].map(value => element('span','tag',value)));
  }
  function render(filter) {
    visible = window.OUTFITS.filter(outfit => filter === 'すべて' || outfit.season.includes(filter) || outfit.category.includes(filter));
    document.getElementById('result-count').textContent = `${visible.length} / ${window.OUTFITS.length} コーデ`;
    document.getElementById('selection-label').textContent = filter === 'すべて' ? 'すべてのコーデ' : `${filter}のコーデ`;
    document.getElementById('empty-state').hidden = visible.length > 0;
    const fragment = document.createDocumentFragment();
    visible.forEach((outfit, index) => {
      const article = element('article','outfit-card');
      const button = element('button','card-button');
      button.type = 'button';
      button.dataset.id = outfit.id;
      button.setAttribute('aria-label',`${outfit.title}の詳細を見る`);
      const photo = element('div','photo-wrap');
      const image = element('img');
      image.alt = altFor(outfit); image.width = 960; image.height = 1200; image.loading = 'lazy'; image.decoding = 'async';
      const placeholder = element('div','placeholder');
      placeholder.hidden = true;
      placeholder.append(element('span',null,'写真準備中'),element('small',null,`LOOK ${number(outfit.id)}`));
      image.addEventListener('error',() => { image.hidden = true; placeholder.hidden = false; },{once:true});
      image.src = outfit.image;
      photo.append(image,placeholder,element('span','outfit-number',number(outfit.id)));
      const content = element('div','card-content');
      const labels = element('div','tags'); tags(outfit,labels);
      const bottom = element('div','card-bottom');
      const arrow = element('span','card-arrow','↗'); arrow.setAttribute('aria-hidden','true');
      bottom.append(element('p','card-price',outfit.price),arrow);
      content.append(element('h3',null,outfit.title),labels,bottom);
      button.append(photo,content); article.append(button); fragment.append(article);
      button.addEventListener('click',() => { opener = button; position = index; showDetail(); dialog.showModal(); document.body.classList.add('modal-open'); document.getElementById('close-dialog').focus(); });
    });
    grid.replaceChildren(fragment);
  }
  function showDetail() {
    const outfit = visible[position];
    document.getElementById('detail-number').textContent = `LOOK ${number(outfit.id)}`;
    document.getElementById('detail-title').textContent = outfit.title;
    tags(outfit,document.getElementById('detail-tags'));
    detailImage.hidden = false; document.getElementById('detail-placeholder').hidden = true;
    detailImage.alt = altFor(outfit); detailImage.src = outfit.image;
    const info = document.getElementById('detail-info');
    const rows = [['季節',outfit.season.join('・')],['テイスト',outfit.category.filter(value => !['パンツ','スカート','ワンピース','仕事','お出かけ','旅行'].includes(value)).join('・')],['トップス',outfit.tops],['ボトムス',outfit.bottoms],['靴',outfit.shoes],['アウター',outfit.outer],['バッグ',outfit.bag],['色',outfit.colors.join('・')],['価格目安',outfit.price]];
    info.replaceChildren();
    rows.filter(([,value]) => value).forEach(([label,value]) => {
      const row = element('div','detail-row'); const dd = element('dd',null,value);
      if (label === '価格目安') {
        const list = element('ul','price-items');
        outfit.priceItems.forEach(item => list.append(element('li',null,`${item.label}${item.quantity ? `（${item.quantity}点・各）` : ''} 約${item.min.toLocaleString('ja-JP')}〜${item.max.toLocaleString('ja-JP')}円`)));
        dd.append(list);
      }
      row.append(element('dt',null,label),dd); info.append(row);
    });
    document.getElementById('detail-point').textContent = outfit.point;
    document.getElementById('detail-position').textContent = `${position + 1} / ${visible.length}`;
    previous.disabled = position === 0; next.disabled = position === visible.length - 1;
  }
  function move(delta) {
    const candidate = position + delta;
    if (candidate < 0 || candidate >= visible.length) return;
    position = candidate; showDetail(); dialog.scrollTop = 0;
  }
  detailImage.addEventListener('error',() => { detailImage.hidden = true; document.getElementById('detail-placeholder').hidden = false; });
  previous.addEventListener('click',() => move(-1)); next.addEventListener('click',() => move(1));
  document.getElementById('close-dialog').addEventListener('click',() => dialog.close());
  dialog.addEventListener('close',() => { document.body.classList.remove('modal-open'); if (opener?.isConnected) opener.focus({preventScroll:true}); });
  dialog.addEventListener('click',event => { if(event.target !== dialog) return; const rect=dialog.getBoundingClientRect(); if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom) dialog.close(); });
  let touchStart = null;
  const photo = document.querySelector('.detail-photo');
  photo.addEventListener('touchstart',event => { touchStart = event.touches.length === 1 ? {x:event.touches[0].clientX,y:event.touches[0].clientY} : null; },{passive:true});
  photo.addEventListener('touchend',event => { if(!touchStart) return; const dx=event.changedTouches[0].clientX-touchStart.x; const dy=event.changedTouches[0].clientY-touchStart.y; touchStart=null; if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5) move(dx<0?1:-1); },{passive:true});
  photo.addEventListener('touchcancel',() => { touchStart=null; },{passive:true});
  filters.forEach(label => {
    const button=element('button','filter-button',label); button.type='button'; button.setAttribute('aria-pressed',String(label==='すべて'));
    button.addEventListener('click',() => { document.querySelectorAll('.filter-button').forEach(other => other.setAttribute('aria-pressed',String(other===button))); render(label); });
    document.getElementById('filters').append(button);
  });
  render('すべて');
})();
