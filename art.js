/* ============================================================
 * 猫格档案馆 · 猫咪插画
 * ------------------------------------------------------------
 * 每只猫都用同一套 SVG 骨架，靠毛色、花纹、眼睛和配饰区分。
 * 页面和结果海报共用这份插画，保证保存下来的图和网页一致。
 * ============================================================ */
(function (root) {
  'use strict';

  const INK = '#2D2723';
  const PINK = '#D77C74';

  function ear(id, type) {
    const dark = type.ear || type.deep;
    return `
      <path d="M62 102 L50 45 Q48 34 59 39 L104 64 Z" fill="${type.color}" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/>
      <path d="M198 102 L210 45 Q212 34 201 39 L156 64 Z" fill="${type.color}" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/>
      <path d="M66 89 L60 55 Q59 50 64 53 L92 68 Z" fill="${type.inner || PINK}" opacity=".78"/>
      <path d="M194 89 L200 55 Q201 50 196 53 L168 68 Z" fill="${type.inner || PINK}" opacity=".78"/>
      ${
        type.id === 'cow'
          ? `<path d="M62 102 L50 45 Q48 34 59 39 L82 51 Q70 80 62 102 Z" fill="${INK}"/>`
          : ''
      }
      ${
        type.id === 'calico'
          ? `<path d="M198 102 L210 45 Q212 34 201 39 L166 59 Q186 82 198 102 Z" fill="#5B4036"/>
             <path d="M62 102 L50 45 Q48 34 59 39 L91 56 Q73 80 62 102 Z" fill="#E39A4B"/>`
          : ''
      }
      <path d="M62 102 Q72 94 78 91" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" opacity=".25"/>
      <path d="M198 102 Q188 94 182 91" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" opacity=".25"/>
      <path d="M${type.id === 'siamese' ? '62' : '64'} 92 L60 56" stroke="${INK}" stroke-width="2.5" opacity=".18"/>
      <path d="M${type.id === 'siamese' ? '198' : '196'} 92 L200 56" stroke="${INK}" stroke-width="2.5" opacity=".18"/>
    `;
  }

  function faceExtras(type) {
    switch (type.id) {
      case 'orange':
        return `
          <g stroke="${type.deep}" stroke-width="4" stroke-linecap="round" opacity=".72" fill="none">
            <path d="M112 73 q6 12 0 24"/><path d="M130 69 q3 12 0 23"/><path d="M148 73 q-6 12 0 24"/>
          </g>
          <g stroke="${type.deep}" stroke-width="3.5" stroke-linecap="round" opacity=".55" fill="none">
            <path d="M57 130 q13 -4 25 2"/><path d="M59 143 q14 0 24 5"/>
            <path d="M203 130 q-13 -4 -25 2"/><path d="M201 143 q-14 0 -24 5"/>
          </g>
          <circle cx="211" cy="79" r="4" fill="${type.deep}" opacity=".55"/>
        `;
      case 'black':
        return `
          <ellipse cx="130" cy="162" rx="31" ry="19" fill="#5D5968" opacity=".34"/>
          <ellipse cx="82" cy="153" rx="13" ry="8" fill="#6D6977" opacity=".2"/>
          <ellipse cx="178" cy="153" rx="13" ry="8" fill="#6D6977" opacity=".2"/>
          <g fill="#F6D477">
            <path d="M54 155 l2.7 7.3 7.3 2.7 -7.3 2.7 -2.7 7.3 -2.7 -7.3 -7.3 -2.7 7.3 -2.7z" opacity=".9"/>
            <path d="M208 105 l2 5.5 5.5 2 -5.5 2 -2 5.5 -2 -5.5 -5.5 -2 5.5 -2z" opacity=".75"/>
            <path d="M48 87 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5z" opacity=".6"/>
          </g>
          <path d="M188 72 q11 -13 22 -2 q-13 2 -22 2z" fill="#F6D477" opacity=".65"/>
        `;
      case 'ragdoll':
        return `
          <g fill="${type.color}" stroke="${INK}" stroke-width="3" stroke-linejoin="round">
            <path d="M58 154 q-15 2 -18 16 q14 0 22 -8z"/>
            <path d="M202 154 q15 2 18 16 q-14 0 -22 -8z"/>
          </g>
          <path d="M91 72 q10 -9 20 -1 q-10 5 -20 1z" fill="${type.soft}" opacity=".8"/>
          <path d="M169 72 q-10 -9 -20 -1 q10 5 20 1z" fill="${type.soft}" opacity=".8"/>
          <path d="M84 194 q46 12 92 0" fill="none" stroke="${type.deep}" stroke-width="3" stroke-linecap="round" opacity=".2"/>
        `;
      case 'tabby':
        return `
          <g stroke="${type.deep}" stroke-width="4.5" stroke-linecap="round" fill="none" opacity=".72">
            <path d="M105 74 q8 14 3 27"/><path d="M128 70 q4 13 2 26"/><path d="M151 74 q-8 14 -3 27"/>
            <path d="M57 130 q15 -4 27 3"/><path d="M59 144 q15 0 25 5"/>
            <path d="M203 130 q-15 -4 -27 3"/><path d="M201 144 q-15 0 -25 5"/>
          </g>
          <path d="M105 77 q10 8 22 7 q12 0 21 -7" fill="none" stroke="${type.deep}" stroke-width="3.5" stroke-linecap="round" opacity=".45"/>
        `;
      case 'siamese':
        return `
          <path d="M86 120 q44 -31 88 0 q13 25 0 48 q-16 27 4 29 q-48 22 -96 0 q20 -2 4 -29 q-13 -23 0 -48z" fill="${type.deep}" opacity=".9"/>
          <path d="M93 124 q8 -17 20 -18 q-4 16 -11 27z" fill="${type.soft}" opacity=".25"/>
          <path d="M167 124 q-8 -17 -20 -18 q4 16 11 27z" fill="${type.soft}" opacity=".25"/>
        `;
      case 'british':
        return `
          <g fill="${type.color}" stroke="${INK}" stroke-width="3">
            <path d="M54 130 q-12 8 -8 21 q9 5 16 -8z"/>
            <path d="M206 130 q12 8 8 21 q-9 5 -16 -8z"/>
          </g>
          <path d="M103 77 q27 -9 54 0" fill="none" stroke="${type.deep}" stroke-width="3" stroke-linecap="round" opacity=".22"/>
          <path d="M79 165 q51 12 102 0" fill="none" stroke="${type.deep}" stroke-width="3" stroke-linecap="round" opacity=".16"/>
        `;
      case 'cow':
        return `
          <path d="M57 119 q-6 -46 31 -58 q33 -11 48 15 q-19 13 -30 38 q-8 19 -6 43 q-30 -9 -43 -38z" fill="${INK}"/>
          <path d="M164 171 q23 -8 33 -27 q9 20 -5 38 q-14 15 -36 8z" fill="${INK}" opacity=".92"/>
          <path d="M74 122 q8 -24 24 -31" fill="none" stroke="#F5F0E6" stroke-width="3" stroke-linecap="round" opacity=".25"/>
        `;
      case 'calico':
        return `
          <path d="M59 120 q-5 -38 29 -53 q18 -8 31 5 q-22 19 -29 47 q-5 21 0 44 q-22 -12 -31 -43z" fill="#4E3C35"/>
          <path d="M166 70 q25 5 37 29 q9 19 0 40 q-12 -23 -42 -34 q-10 -20 5 -35z" fill="#E39A4B"/>
          <path d="M147 178 q24 2 39 -3 q-3 22 -20 29 q-15 5 -28 -6z" fill="#4E3C35" opacity=".9"/>
        `;
      default:
        return '';
    }
  }

  function eyes(type) {
    if (type.id === 'british') {
      return `
        <g>
          <path d="M82 130 q16 -9 32 0" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/>
          <path d="M146 130 q16 -9 32 0" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/>
          <ellipse cx="98" cy="134" rx="8" ry="7" fill="${type.eye}"/>
          <ellipse cx="162" cy="134" rx="8" ry="7" fill="${type.eye}"/>
          <ellipse cx="98" cy="134" rx="2.7" ry="6" fill="${INK}"/>
          <ellipse cx="162" cy="134" rx="2.7" ry="6" fill="${INK}"/>
          <circle cx="95.6" cy="131" r="1.8" fill="#FFFDF6"/>
          <circle cx="159.6" cy="131" r="1.8" fill="#FFFDF6"/>
        </g>
      `;
    }
    if (type.id === 'cow' || type.id === 'calico') {
      return `
        <g>
          <ellipse cx="98" cy="129" rx="12" ry="14" fill="${type.id === 'cow' ? '#73A8B2' : '#E0A24B'}"/>
          <ellipse cx="162" cy="129" rx="12" ry="14" fill="${type.id === 'cow' ? '#E0A24B' : '#73A8B2'}"/>
          <ellipse cx="98" cy="129" rx="4" ry="11" fill="${INK}"/>
          <ellipse cx="162" cy="129" rx="4" ry="11" fill="${INK}"/>
          <circle cx="94.5" cy="124" r="2.5" fill="#FFFDF6"/>
          <circle cx="158.5" cy="124" r="2.5" fill="#FFFDF6"/>
        </g>
      `;
    }
    return `
      <g>
        <ellipse cx="98" cy="129" rx="12.5" ry="14.5" fill="${type.eye}"/>
        <ellipse cx="162" cy="129" rx="12.5" ry="14.5" fill="${type.eye}"/>
        <ellipse cx="98" cy="129" rx="4.3" ry="12.5" fill="${INK}"/>
        <ellipse cx="162" cy="129" rx="4.3" ry="12.5" fill="${INK}"/>
        <circle cx="94.2" cy="123.5" r="2.8" fill="#FFFDF6"/>
        <circle cx="158.2" cy="123.5" r="2.8" fill="#FFFDF6"/>
        <circle cx="101.5" cy="134" r="1.4" fill="#FFFDF6" opacity=".75"/>
        <circle cx="165.5" cy="134" r="1.4" fill="#FFFDF6" opacity=".75"/>
      </g>
    `;
  }

  function catSvg(type, opts) {
    const options = opts || {};
    const size = options.size || 260;
    const decorate = options.decorate !== false;
    const clipId = `cat-clip-${type.id}${options.uid ? `-${options.uid}` : ''}`;
    return `
      <svg viewBox="0 0 260 260" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${type.name}插画">
        <defs>
          <clipPath id="${clipId}">
            <circle cx="130" cy="132" r="108"/>
          </clipPath>
        </defs>
        <circle cx="130" cy="132" r="108" fill="${type.soft}" stroke="${INK}" stroke-width="4"/>
        ${
          decorate
            ? `<g opacity=".55">
                <path d="M36 74 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z" fill="${type.deep}"/>
                <path d="M222 170 l2.2 6 6 2.2 -6 2.2 -2.2 6 -2.2 -6 -6 -2.2 6 -2.2z" fill="${type.deep}"/>
                <circle cx="211" cy="57" r="4" fill="none" stroke="${type.deep}" stroke-width="2.5"/>
                <path d="M42 187 q10 -8 20 0" fill="none" stroke="${type.deep}" stroke-width="2.5" stroke-linecap="round"/>
              </g>`
            : ''
        }
        <g clip-path="url(#${clipId})">
          <path d="M-12 207 Q57 183 126 205 Q196 227 272 203 L272 272 L-12 272 Z" fill="${type.color}" opacity=".22"/>
          <circle cx="52" cy="57" r="3" fill="${type.deep}" opacity=".35"/>
          <circle cx="205" cy="216" r="5" fill="${type.deep}" opacity=".22"/>
        </g>
        <g transform="translate(0, 6)">
          ${ear({}, type)}
          <path d="M130 57 C175 57 204 84 205 126 C206 169 179 202 130 202 C81 202 54 169 55 126 C56 84 85 57 130 57 Z" fill="${type.color}" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/>
          ${faceExtras(type)}
          ${eyes(type)}
          <ellipse cx="82" cy="155" rx="12" ry="6.5" fill="${type.blush}" opacity=".4"/>
          <ellipse cx="178" cy="155" rx="12" ry="6.5" fill="${type.blush}" opacity=".4"/>
          <path d="M123 151 Q130 146 137 151 L130 158 Z" fill="${PINK}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
          <path d="M130 158 L130 164 M130 164 Q122 170 115 164 M130 164 Q138 170 145 164" fill="none" stroke="${type.id === 'black' ? '#E7D9CB' : INK}" stroke-width="2.8" stroke-linecap="round"/>
          <g stroke="${type.id === 'black' ? '#F4EBDD' : INK}" stroke-width="2.3" stroke-linecap="round" opacity="${type.id === 'black' ? '.52' : '.72'}">
            <path d="M88 158 L52 151"/><path d="M88 165 L54 168"/>
            <path d="M172 158 L208 151"/><path d="M172 165 L206 168"/>
          </g>
          <path d="M83 188 Q130 204 177 188" fill="none" stroke="${type.deep}" stroke-width="13" stroke-linecap="round" opacity=".28"/>
          <path d="M83 188 Q130 204 177 188" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
          <circle cx="130" cy="198" r="12" fill="${type.deep}" stroke="${INK}" stroke-width="3"/>
          <path d="M126 193 q4 -4 8 0 q-2 7 -4 8 q-2 -1 -4 -8z" fill="#F6D477" opacity=".88"/>
        </g>
        ${
          options.paws !== false
            ? `<g>
                <ellipse cx="83" cy="235" rx="26" ry="13" fill="${type.color}" stroke="${INK}" stroke-width="4"/>
                <ellipse cx="177" cy="235" rx="26" ry="13" fill="${type.color}" stroke="${INK}" stroke-width="4"/>
                <g stroke="${INK}" stroke-width="2" stroke-linecap="round" opacity=".35">
                  <path d="M75 231 v7"/><path d="M83 229 v10"/><path d="M91 231 v7"/>
                  <path d="M169 231 v7"/><path d="M177 229 v10"/><path d="M185 231 v7"/>
                </g>
              </g>`
            : ''
        }
      </svg>
    `;
  }

  const api = { catSvg };
  root.CatArt = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
