/* Numbered reference scenes. Uploaded product photos remain in this browser. */
function makeAnglePrompt(ref, product) {
  const packaging = ref.kind === 'package';
  return `REFERENCE-MATCH PRODUCT PHOTOGRAPHY | PRESET ${ref.id}
${ref.title}

INPUT IMAGES AND PRIORITY
Image A = the supplied numbered composition reference (${ref.id}). Use it ONLY for camera viewpoint, orientation, framing, object placement, background, floor, lighting, cast shadows and reflection geometry.
Image B = ${packaging ? 'the replacement packaging reference' : 'the replacement smartphone reference(s)'}. Use it as the ONLY source of product identity: actual silhouette, proportions, materials, colors, camera count and layout, buttons, branding and decoration.
${product.trim() ? 'REPLACEMENT PRODUCT: ' + product.trim() : packaging ? 'REPLACEMENT PRODUCT: [Attach the packaging to be used, or explicitly keep the Caviar packaging shown in A.]' : 'REPLACEMENT PRODUCT: [Attach photo(s) of the smartphone to be substituted.]'}
Do not copy the original phone design from A onto B. In particular, do not add its Om symbol, lotus engraving, red enamel, gold panels, gemstones, anniversary marks or serial numbers unless those details actually exist on B. Do not recolor B to match the gold/silver reference. Preserve B faithfully.

FIXED COMPOSITION ${ref.id}
Output aspect ratio ${ref.aspect}; ${ref.id === '10' ? 'portrait catalog cutout' : 'vertical 9:16-like portrait canvas, ideally 1143 × 2048'}.
${ref.scene}

MATCHING RULES
Image A is the visual authority. The percentages above are approximate guides to observed framing, not measured camera calibration. Follow A's actual corner positions, silhouette orientation, negative space, camera azimuth/elevation, perspective compression and floor light pattern. Never mirror or reverse the composition. Preserve B's native proportions; match relative height and placement without stretching, cutting off new camera modules or distorting the hardware. Re-light B consistently with the fixed scene. Background must remain the same neutral color family and brightness pattern even when B has a different material/color. Do not adapt the background palette to the new phone.
${ref.kind === 'fold' ? 'HARDWARE REQUIREMENT: B must show a compatible book-style foldable smartphone, preferably with references of both halves. Reproduce A’s hinge and opening posture using B’s real mechanism. If B is a rigid slab phone, STOP and request a compatible foldable reference or a different numbered preset. Never invent a hinge or a second phone.' : packaging ? 'PACKAGE REQUIREMENT: this preset contains packaging only. A smartphone-only B does not specify a replacement box; keep the original packaging only when explicitly requested, otherwise request its packaging reference. Do not place a smartphone into the flat lay.' : 'If B does not show an essential side or rear detail required by this view, request another product photo rather than inventing hardware or artwork.'}

RENDERING
Photoreal commercial product photograph. Accurate hard-surface geometry, fine material texture, readable true engravings, controlled specular highlights, neutral white balance and realistic contact physics. No added graphic titles, captions, watermarks or logos. ${ref.id === '10' ? 'PNG alpha cutout; no external shadow or reflected floor.' : 'Keep the original reference scene clean and empty.'}

NEGATIVE CONSTRAINTS
wrong viewpoint, mirrored image, reversed diagonal, different phone posture, wrong scale, arbitrary zoom, changed crop, warped rectangle, stretched device, invented cameras, missing camera, invented hinge, duplicate smartphone, transferred source-phone artwork, copied Om symbol, altered target design, recolored target, extra props, pedestal, hands, people, scenery, background hue adapted to product, dramatic new light setup, excessive glow, blown metallic highlights, unreadable invented text, watermark${ref.id === '10' ? ', floor, cast shadow, floor reflection, baked checkerboard, opaque background' : ', floating unsupported object, unrequested transparent background'}.

Use BOTH images with this prompt. Text alone cannot guarantee an exact spatial match; retain A as the composition reference during generation/editing.`;
}

function zipStored(files) {
  const enc = new TextEncoder(), table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1; table[n] = c; }
  const crc = bytes => { let c = 0xffffffff; for (const b of bytes) c = table[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const locals = [], central = []; let offset = 0, centralLength = 0;
  for (const f of files) {
    const name = enc.encode(f.name), bytes = typeof f.data === 'string' ? enc.encode(f.data) : f.data, sum = crc(bytes);
    const local = new Uint8Array(30 + name.length), v = new DataView(local.buffer);
    v.setUint32(0, 0x04034b50, true); v.setUint16(4, 20, true); v.setUint16(6, 0x800, true); v.setUint16(12, 33, true);
    v.setUint32(14, sum, true); v.setUint32(18, bytes.length, true); v.setUint32(22, bytes.length, true); v.setUint16(26, name.length, true); local.set(name, 30);
    const head = new Uint8Array(46 + name.length), h = new DataView(head.buffer);
    h.setUint32(0, 0x02014b50, true); h.setUint16(4, 20, true); h.setUint16(6, 20, true); h.setUint16(8, 0x800, true); h.setUint16(14, 33, true);
    h.setUint32(16, sum, true); h.setUint32(20, bytes.length, true); h.setUint32(24, bytes.length, true); h.setUint16(28, name.length, true); h.setUint32(42, offset, true); head.set(name, 46);
    locals.push(local, bytes); central.push(head); offset += local.length + bytes.length; centralLength += head.length;
  }
  const end = new Uint8Array(22), e = new DataView(end.buffer);
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, centralLength, true); e.setUint32(16, offset, true);
  return new Blob([...locals, ...central, end], {type:'application/zip'});
}

(async function initAngles() {
  const host = document.querySelector('#anglesGrid'), status = document.querySelector('#angleStatus');
  let refs;
  try { const r = await fetch('angles-data.json'); if (!r.ok) throw new Error(r.status); refs = await r.json(); }
  catch (err) { status.textContent = 'Не удалось загрузить шаблоны. Обновите страницу.'; return; }
  const byId = id => document.getElementById(id), object = byId('angleProduct'), output = byId('angleOutput');
  let current = refs[0], productFile = null, productURL = null;
  function save(key, value) { try { localStorage.setItem(key, value); } catch (_) {} }
  function saved(key) { try { return localStorage.getItem(key) || ''; } catch (_) { return ''; } }
  object.value = saved('caviar-angle-product');
  function update() {
    output.value = makeAnglePrompt(current, object.value);
    byId('angleDownloadPrompt').download = current.id + '-prompt.txt';
    if (byId('angleDownloadPrompt').dataset.blob) URL.revokeObjectURL(byId('angleDownloadPrompt').dataset.blob);
    const url = URL.createObjectURL(new Blob([output.value], {type:'text/plain;charset=utf-8'}));
    byId('angleDownloadPrompt').href = url; byId('angleDownloadPrompt').dataset.blob = url;
    save('caviar-angle-product', object.value);
  }
  function select(id, navigate, scroll) {
    current = refs.find(r => r.id === id) || refs[0];
    host.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.id === current.id)));
    byId('angleNumber').textContent = 'ШАБЛОН №' + current.id;
    byId('angleTitle').textContent = current.title;
    byId('angleDescription').textContent = current.pose + '. ' + current.background + '.';
    byId('angleReferenceImage').src = current.src; byId('angleReferenceImage').alt = 'Референс №' + current.id + ': ' + current.title;
    byId('angleReferenceLink').href = current.src; byId('angleReferenceLink').download = current.id + '-reference.' + (current.id === '10' ? 'png' : 'jpg');
    byId('angleSource').textContent = 'Исходный файл: ' + current.source;
    byId('angleTargetLabel').textContent = current.kind === 'package' ? 'B · Ваша упаковка' : 'B · Ваш смартфон';
    byId('angleProductLabel').textContent = current.kind === 'package' ? 'Какая упаковка должна быть в кадре' : 'Какой смартфон должен быть в кадре';
    byId('angleRequirement').textContent = current.kind === 'fold' ? 'Этот ракурс требует складного смартфона с совместимым шарниром. Для обычного моноблока выберите другой номер: промпт запрещает придумывать сгиб.' : current.kind === 'package' ? 'В №02 показана только упаковка. Загрузите фото нужной коробки или напишите «Оставить упаковку Caviar с референса». Смартфон в этот кадр не добавляется.' : current.id === '10' ? '№10 рассчитан на PNG с настоящей прозрачностью. Если генератор не поддерживает альфа-канал, потребуется отдельно удалить фон.' : 'Меняется устройство. Фон, свет и композиция задаются референсом A. Камеры и оформление берутся только с вашего смартфона B.';
    status.textContent = ''; save('caviar-angle-selected', current.id); update();
    if (navigate) { mode('angles'); history.replaceState(null, '', '#angles/' + current.id); }
    if (scroll) byId('angleEditor').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',block:'start'});
  }
  refs.forEach(ref => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'angle-card'; b.dataset.id = ref.id; b.setAttribute('aria-pressed', 'false');
    const image = document.createElement('img'); image.src = ref.src; image.alt = 'Ракурс №' + ref.id; image.loading = 'lazy';
    const body = document.createElement('div'); body.className = 'angle-card__body';
    const n = document.createElement('span'); n.className = 'angle-number'; n.textContent = '№' + ref.id;
    const title = document.createElement('h3'); title.textContent = ref.title;
    const desc = document.createElement('small'); desc.textContent = ref.pose;
    body.append(n,title,desc); b.append(image,body); b.addEventListener('click', () => select(ref.id,true,true)); host.appendChild(b);
  });
  object.addEventListener('input', update);
  byId('angleCopy').addEventListener('click', () => copyText(output.value, byId('angleCopy'), 'Скопировано'));
  byId('angleFile').addEventListener('change', () => {
    const file = byId('angleFile').files[0];
    if (!file) return;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 25 * 1024 * 1024) { status.textContent = 'Выберите JPG, PNG или WebP размером до 25 МБ.'; byId('angleFile').value = ''; return; }
    if (productURL) URL.revokeObjectURL(productURL);
    productFile = file; productURL = URL.createObjectURL(file); byId('angleTargetImage').src = productURL; byId('angleUpload').classList.add('has-image');
    byId('angleTargetImage').alt = 'Выбранный новый смартфон или упаковка'; status.textContent = 'Фото добавлено в комплект. Оно остаётся в вашем браузере.';
  });
  function download(blob, name) { const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 10000); }
  byId('angleBundle').addEventListener('click', async () => {
    const button = byId('angleBundle'); button.disabled = true; status.textContent = 'Собираю комплект…';
    const selected = current, text = output.value, target = productFile;
    try {
      const r = await fetch(selected.src); if (!r.ok) throw new Error('reference');
      const files = [{name:'A-reference-' + selected.id + (selected.id === '10' ? '.png' : '.jpg'),data:new Uint8Array(await r.arrayBuffer())},{name:selected.id + '-prompt.txt',data:text}];
      if (target) files.push({name:'B-product.' + ({'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[target.type]),data:new Uint8Array(await target.arrayBuffer())});
      files.push({name:'README.txt',data:'Шаблон №' + selected.id + '\n\n1. Откройте генератор с поддержкой нескольких изображений.\n2. Прикрепите A-reference как образец композиции.\n3. Прикрепите B-product как исходник нового устройства/упаковки.' + (target ? '' : ' Фото B не было загружено на сайте, добавьте его самостоятельно.') + '\n4. Вставьте текст из ' + selected.id + '-prompt.txt.\n5. Сохраните соотношение сторон ' + selected.aspect + '.\n\nРеференс A отвечает за сцену и ракурс, B за дизайн устройства. Текст без референса не гарантирует точного совпадения. Для №03/04 нужен складной смартфон. №02 показывает упаковку. №10 требует прозрачного PNG.\n'});
      download(zipStored(files), selected.id + '-generation-kit.zip'); status.textContent = 'Комплект №' + selected.id + ' скачан.';
    } catch (_) { status.textContent = 'Не удалось собрать комплект. Попробуйте ещё раз или скачайте референс и промпт отдельно.'; }
    finally { button.disabled = false; }
  });
  byId('tabAngles').addEventListener('click', () => select(current.id,true,false));
  function fromHash() { const match = location.hash.match(/^#angles\/(\d{2})$/); if (match) select(match[1],true,false); }
  select(saved('caviar-angle-selected') || '01',false,false); fromHash(); window.addEventListener('hashchange',fromHash);
})();
