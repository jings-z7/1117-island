/*
 * NKUHT · Hospitality 旅館島：我的角色
 *
 * 原作者：readper
 * 上游：Three.js low-poly avatar rig module (MIT License, v0.8.0)
 *
 * 本模組依 MIT License 授權改編，並擴充 360° 浮動搖桿、RPG 尋路與禮賓互動功能；授權條款如下：
 *
 * MIT License
 *
 * Copyright (c) 2026 readper
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { track } from "./analytics.js?v=20261113-01";
import { uiIcon } from "./ui-icons.js?v=20261115-01";

(() => {
  'use strict';

  const LOG = (...a) => console.log('[heart-me]', ...a);
  const STORE_KEY = 'heart-me:v1';
  const CORAL = 0xdb6a41; // 站方 --coral
  const POSE_UP = 2.62; // 舉手（S.pose 的 l／r 是角色自己的左右手）：手臂往身體外側（z 軸）抬到水平以上 60°（從垂下算 150°），像在介紹東西，不是往前舉

  const cap = {}; // 從站方渲染流程攔到的 scene / camera / controls
  let T = null;   // 與站方同一份 three 實例
  let RoundedBox = null;
  let mergeGeometries = null; // 2026-10-23 官網優化：角色零件合併成少數幾個網格（共用一個材質），減少每幀繪製次數
  let FIG_MAT = null;          // 所有角色共用的頂點色材質；換裝時不再建立／編譯新材質
  let G = null;   // 共用幾何（同 people.js 的 G）

  const undo = []; // 清理函式，後進先出
  // 角色的合併網格自己擁有幾何；共用材質 FIG_MAT 不可釋放
  const disposeFigure = (root) => root.traverse((o) => {
    if (!o.isMesh) return;
    if (o.userData.hmOwned) o.geometry.dispose();
    if (o.material && o.material !== FIG_MAT && !o.userData.hmShared && !Array.isArray(o.material)) o.material.dispose();
  });
  let dead = false;
  function shutdown(reason) {
    if (dead) return;
    dead = true;
    while (undo.length) {
      try { undo.pop()(); } catch (e) { console.warn('[heart-me] 清理時發生錯誤：', e); }
    }
    LOG('已停用：' + reason);
  }

  // ───────────────────────── 外觀資料 ─────────────────────────

  // 身分與標籤取自站方 people.js 的 ROLE_LABEL（略過 puma 彩蛋角色）
  const ROLES = [
    ['citizen', '旅館系學生'], ['youth', '旅館接待競賽選手'], ['officeworker', '飯店儲備幹部'], ['cyclist', '企業參訪學生'],
    ['parent', '群賢會館實習幹部'], ['child', '旅館系大一新生'], ['elder', '星級飯店業師'], ['civil-servant', '系務與行政師長'],
    ['researcher', '智慧餐旅與PMS學員'], ['worker', '客房與房務實習生'], ['farmer', '餐飲與宴會實習生'], ['hiker', '渡假酒店實習生'],
    ['traveller', '海外實習與交換生'],
  ];
  const ROLE_LABEL = Object.fromEntries(ROLES);
  // ── 外觀選項（全數為旅館管理系師生與實習生合宜服飾配件，移除非旅館系道具）
  const HAIR_STYLES = [['short', '短髮'], ['long', '長髮'], ['bob', '鮑伯頭'], ['side', '側分'], ['curly', '捲髮'], ['bun', '包頭／丸子頭'], ['pony', '俐落馬尾'], ['puff', '造型盤髮'], ['bald', '平頭']];
  const OUTFITS = [['nkuht-teal', '高餐墨綠西裝'], ['nkuht-black', '高餐炭黑西裝'], ['nkuht-summer', '高餐夏季白衫'], ['nkuht-polo', '高餐休閒Polo'], ['plain', '校園休閒服'], ['vest', '禮賓背心'], ['cardigan', '商務西裝'], ['coat', '禮賓長大衣']];
  const HATS = [['none', '無'], ['hike', '禮賓帽'], ['beanie', '貝雷帽']];
  const BACKS = [['none', '無'], ['schoolbag', '學院書包'], ['hikepack', '差旅背包']];
  const HANDS = [['none', '無'], ['coffee', '咖啡／侍飲'], ['umbrella', '迎賓長傘'], ['flower', '迎賓花束'], ['balloon', '慶典氣球']];
  const SIDES = [['none', '無'], ['luggage', '登機行李箱']];
  const FACES = [['none', '無'], ['glasses', '斯文眼鏡'], ['sunglasses', '太陽眼鏡'], ['mask', '口罩']];
  const EYES = [['dot', '點點'], ['happy', '笑眼'], ['wide', '大眼'], ['sleepy', '瞇眼']];
  const MOUTHS = [['none', '無'], ['smile', '微笑'], ['o', '驚訝'], ['flat', '平靜']];

  const ACC_KEYS = ['outfit', 'hat', 'hatColor', 'back', 'hand', 'side', 'face'];
  const NO_ACC = { outfit: 'plain', hat: 'none', back: 'none', hand: 'none', side: 'none', face: 'none' };
  // 各身分的預設造型（對應旅館管理系師生與實習角色）
  const ROLE_PRESET = {
    citizen: { outfit: 'nkuht-teal', shirt: 0x115e59, pants: 0x18223c },
    youth: { outfit: 'cardigan' },
    officeworker: { outfit: 'cardigan', hand: 'coffee' },
    cyclist: { outfit: 'vest' },
    parent: { outfit: 'vest', side: 'luggage' },
    child: { back: 'schoolbag' },
    elder: { hair: 0x383434, outfit: 'cardigan', hand: 'coffee' },
    'civil-servant': { shirt: 0xf4efe6, outfit: 'vest' },
    researcher: { shirt: 0x9fc3d6, outfit: 'cardigan', face: 'glasses', hand: 'coffee' },
    worker: { shirt: 0x4a5a78, outfit: 'vest' },
    farmer: { shirt: 0xfbfbf7, outfit: 'vest', hand: 'coffee' },
    hiker: { outfit: 'vest', side: 'luggage' },
    traveller: { side: 'luggage' },
  };
  const rolePreset = (role) => ({ ...NO_ACC, ...ROLE_PRESET[role] });

  // 前四色取自站方 people.js 的調色盤，其餘為補充；每一列最後另有「自訂色」
  const PALETTE = {
    skin: [0xf3cfae, 0xe6b48f, 0xcf9670, 0xf0c4a0, 0xb98560, 0x8a5a3c],
    hair: [0x4a3426, 0x1f1d22, 0x6b4a33, 0xb5472f, 0xc9a35a, 0xd9d4cc],
    shirt: [0x115e59, 0x24262b, 0xfbfcfa, 0x1c1e24, 0x6f7fb5, 0x58a6a6, 0xe8c547, 0xf2a1a1, 0x8fb37a, CORAL, 0x4a5a78],
    pants: [0x18223c, 0xc6aa8c, 0xd8cab2, 0x3b3a42, 0x4a5a78, 0x6b5a4a, 0x2f3a4a, 0x8a8f99],
    hatColor: [0xf1c232, 0xe8c547, 0xdb6a41, 0x58a6a6, 0x6f7fb5, 0xf2a1a1, 0xfbfbf7, 0x3b3a42],
  };
  const PART_LABEL = { skin: '膚色', hair: '髮色', shirt: '上衣', pants: '褲子', hatColor: '帽子色' };
  const SHAPE_RANGE = { height: [0.8, 1.25], width: [0.8, 1.3] };

  const DEFAULT_LOOK = {
    name: '我', role: 'citizen', hairStyle: 'short', eyes: 'dot', mouth: 'none', height: 1, width: 1,
    ...NO_ACC,
    outfit: 'nkuht-teal', hat: 'none', back: 'none', hand: 'none', side: 'none', face: 'none',
    skin: PALETTE.skin[1], hair: 0x1f1d22, shirt: 0x115e59, pants: 0x18223c, hatColor: PALETTE.hatColor[0],
  };

  // ── 暱稱：不再預設叫「我」。名字是空的或舊預設值時，自動給一個中性的隨機暱稱並保存，之後每次都相同。
  // 只用「形容詞＋名詞」組合，不含師長姓名、飯店、職稱或像官方頭銜的字眼（資料規則與防冒名 R-13）。
  const NICK_ZH = [
    ['晨光', '海風', '暖陽', '星空', '微笑', '月光', '山嵐', '晴空', '雲朵', '清風', '白浪', '楓葉', '初雪', '燈塔', '彩虹', '花火'],
    ['旅人', '探險家', '背包客', '島民', '漫遊者', '航海家', '觀察家', '追光者', '小旅客', '散步家'],
  ];
  const NICK_EN = [
    ['Sunny', 'Misty', 'Cozy', 'Lucky', 'Calm', 'Merry', 'Brisk', 'Jolly', 'Happy', 'Quiet'],
    ['Fox', 'Owl', 'Gull', 'Rover', 'Pilot', 'Scout', 'Wren', 'Lark', 'Otter'],
  ];
  const isEnUI = () => document.documentElement.lang === 'en' || new URLSearchParams(location.search).get('lang') === 'en';
  const pickSecure = (arr) => {
    const u = new Uint32Array(1);
    crypto.getRandomValues(u);
    return arr[u[0] % arr.length];
  };
  const randomNickname = () => {
    const [adj, noun] = isEnUI() ? NICK_EN : NICK_ZH;
    return (pickSecure(adj) + pickSecure(noun)).slice(0, 10);
  };
  const isPlaceholderName = (n) => !n || !String(n).trim() || ['我', 'You', '高餐訪客'].includes(String(n).trim());
  const NAME_ASKED_KEY = 'htl-name-asked';
  const nameAsked = () => { try { return localStorage.getItem(NAME_ASKED_KEY) === '1'; } catch (e) { return true; } };
  const markNameAsked = () => { try { localStorage.setItem(NAME_ASKED_KEY, '1'); } catch (e) { /* 無痕模式略過 */ } };

  // 複製出來拍照的領航員（謝文欽系主任）：銀灰側分短髮、炭灰西裝搭配淡粉襯衫、深藍西裝褲
  const PUMA_LOOK = {
    name: '謝文欽主任', role: 'puma', hairStyle: 'side', eyes: 'happy', mouth: 'smile', height: 1, width: 1,
    outfit: 'cardigan', hat: 'none', hatColor: 0x484b52, back: 'none', hand: 'none', side: 'none', face: 'none',
    skin: 0xf3cfae, hair: 0x6e6a66, shirt: 0xf4dce6, pants: 0x283040,
  };

  // 系上 10 位專任師長形象預設組（依餐旅學院網站照片形象打造）
  const FACULTY_PRESETS = [
    ['hsieh-wc', '謝文欽 主任', { name: '謝文欽主任', role: 'civil-servant', hairStyle: 'side', hair: 0x6e6a66, skin: 0xf3cfae, eyes: 'happy', mouth: 'smile', face: 'none', outfit: 'cardigan', shirt: 0xf4dce6, pants: 0x283040, hand: 'none', hat: 'none', back: 'none', side: 'none' }],
    ['yang-jt', '楊仁德 教授', { name: '楊仁德教授', role: 'researcher', hairStyle: 'short', hair: 0x383434, skin: 0xf3cfae, eyes: 'dot', mouth: 'smile', face: 'glasses', outfit: 'cardigan', shirt: 0xffffff, pants: 0x1e2838, hand: 'coffee', hat: 'none', back: 'none', side: 'none' }],
    ['sha-c', '沙荃 老師', { name: '沙荃老師', role: 'civil-servant', hairStyle: 'side', hair: 0x222022, skin: 0xe6b48f, eyes: 'dot', mouth: 'smile', face: 'none', outfit: 'cardigan', shirt: 0xfbfbf7, pants: 0x46352b, hand: 'none', hat: 'none', back: 'none', side: 'none' }],
    ['hsieh-jl', '謝家黎 副教授', { name: '謝家黎老師', role: 'civil-servant', hairStyle: 'curly', hair: 0x4a251d, skin: 0xf3cfae, eyes: 'happy', mouth: 'smile', face: 'none', outfit: 'vest', shirt: 0xc82829, pants: 0x252329, hand: 'flower', hat: 'none', back: 'none', side: 'none' }],
    ['huang-cy', '黃啟揚 老師', { name: '黃啟揚老師', role: 'researcher', hairStyle: 'short', hair: 0x3a3532, skin: 0xe6b48f, eyes: 'happy', mouth: 'smile', face: 'glasses', outfit: 'plain', shirt: 0xd97a54, pants: 0x9c8e78, hand: 'coffee', hat: 'none', back: 'none', side: 'none' }],
    ['yu-mf', '游明鳳 老師', { name: '游明鳳老師', role: 'civil-servant', hairStyle: 'long', hair: 0x46291c, skin: 0xf3cfae, eyes: 'happy', mouth: 'smile', face: 'none', outfit: 'cardigan', shirt: 0x222836, pants: 0x222836, hand: 'none', hat: 'none', back: 'none', side: 'none' }],
    ['hsieh-cl', '謝金龍 組長', { name: '謝金龍老師', role: 'civil-servant', hairStyle: 'side', hair: 0x221d1a, skin: 0xe6b48f, eyes: 'dot', mouth: 'smile', face: 'glasses', outfit: 'cardigan', shirt: 0x2c384a, pants: 0x232d3c, hand: 'none', hat: 'none', back: 'none', side: 'none' }],
    ['hsu-mj', '許孟鈞 老師', { name: '許孟鈞老師', role: 'researcher', hairStyle: 'side', hair: 0x1a181b, skin: 0xf3cfae, eyes: 'happy', mouth: 'smile', face: 'glasses', outfit: 'cardigan', shirt: 0x282d38, pants: 0x1f242d, hand: 'coffee', hat: 'none', back: 'none', side: 'none' }],
    ['chang-hc', '張慧貞 老師', { name: '張慧貞老師', role: 'civil-servant', hairStyle: 'bob', hair: 0x54281c, skin: 0xf3cfae, eyes: 'happy', mouth: 'smile', face: 'none', outfit: 'plain', shirt: 0x1e1d21, pants: 0x46484e, hand: 'none', hat: 'none', back: 'none', side: 'none' }],
    ['lo-sk', '盧小琴 老師', { name: '盧小琴老師', role: 'researcher', hairStyle: 'bob', hair: 0x3b2316, skin: 0xf3cfae, eyes: 'happy', mouth: 'smile', face: 'none', outfit: 'plain', shirt: 0xfaf8f5, pants: 0x2a303c, hand: 'flower', hat: 'none', back: 'none', side: 'none' }],
  ];

  // 國立高雄餐旅大學（NKUHT）經典學生制服快速換裝預設組（依高餐秋冬西裝、夏季制服與新生晚會走秀實景打造）
  const NKUHT_UNIFORM_PRESETS = [
    ['u-teal-m', '墨綠西裝（男）', { role: 'citizen', hairStyle: 'short', hair: 0x1f1d22, outfit: 'nkuht-teal', shirt: 0x115e59, pants: 0x18223c, hat: 'none' }],
    ['u-teal-f', '墨綠西裝（女）', { role: 'citizen', hairStyle: 'pony', hair: 0x261d1a, outfit: 'nkuht-teal', shirt: 0x115e59, pants: 0x18223c, hat: 'none' }],
    ['u-black-m', '炭黑西裝（男）', { role: 'youth', hairStyle: 'side', hair: 0x1f1d22, outfit: 'nkuht-black', shirt: 0x24262b, pants: 0xc6aa8c, hat: 'none' }],
    ['u-black-f', '炭黑西裝（女）', { role: 'youth', hairStyle: 'long', hair: 0x382419, outfit: 'nkuht-black', shirt: 0x24262b, pants: 0xc6aa8c, hat: 'none' }],
    ['u-sum-m', '夏季白衫（男）', { role: 'citizen', hairStyle: 'short', hair: 0x1f1d22, outfit: 'nkuht-summer', shirt: 0xfbfcfa, pants: 0x18223c, hat: 'none' }],
    ['u-sum-f', '夏季白衫藏青裙', { role: 'citizen', hairStyle: 'bun', hair: 0x221b18, outfit: 'nkuht-summer', shirt: 0xfbfcfa, pants: 0x18223c, hat: 'none' }],
    ['u-khaki-f', '經典白衫卡其裙', { role: 'parent', hairStyle: 'long', hair: 0x2b1e17, outfit: 'nkuht-summer', shirt: 0xfbfcfa, pants: 0xc6aa8c, hat: 'none' }],
    ['u-polo', '新生黑Polo休閒', { role: 'child', hairStyle: 'bob', hair: 0x221b18, outfit: 'nkuht-polo', shirt: 0x1c1e24, pants: 0xd8cab2, hat: 'none' }],
  ];

  const loadLook = () => {
    try {
      const o = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (!o || typeof o !== 'object') return { ...DEFAULT_LOOK };
      const pick = (list, v, d) => (list.some(([k]) => k === v) ? v : d);
      const look = { ...DEFAULT_LOOK };
      if (typeof o.name === 'string') look.name = o.name.slice(0, 10);
      if (ROLE_LABEL[o.role]) look.role = o.role;
      // v0.2 以前的存檔沒有配件欄位：依它原本的身分補上預設配件，舊的「毛帽髮型」改成毛帽配件
      const legacy = !('hat' in o);
      if (legacy) {
        const p = rolePreset(look.role);
        for (const k of ACC_KEYS) if (k in p) look[k] = p[k];
        // 舊版戴帽身分會忽略髮型，所以只有該身分預設沒帽子時，才把「毛帽髮型」轉成毛帽配件
        if (o.hairStyle === 'beanie') { if (look.hat === 'none') look.hat = 'beanie'; o.hairStyle = 'short'; }
      } else {
        look.outfit = pick(OUTFITS, o.outfit, look.outfit);
        look.hat = pick(HATS, o.hat, look.hat);
        look.back = pick(BACKS, o.back, look.back);
        look.hand = pick(HANDS, o.hand, look.hand);
        look.side = pick(SIDES, o.side, look.side);
        look.face = pick(FACES, o.face, look.face);
      }
      look.hairStyle = pick(HAIR_STYLES, o.hairStyle, look.hairStyle);
      look.eyes = pick(EYES, o.eyes, look.eyes);
      look.mouth = pick(MOUTHS, o.mouth, look.mouth);
      for (const k of Object.keys(PALETTE)) if (Number.isInteger(o[k]) && o[k] >= 0 && o[k] <= 0xffffff) look[k] = o[k];
      for (const [k, [lo, hi]] of Object.entries(SHAPE_RANGE)) if (Number.isFinite(o[k])) look[k] = Math.min(hi, Math.max(lo, o[k]));
      return look;
    } catch (e) { return { ...DEFAULT_LOOK }; }
  };
  const saveLook = (look) => { try { localStorage.setItem(STORE_KEY, JSON.stringify(look)); } catch (e) { /* 無痕模式等情況略過 */ } };

  // ───────────────────────── three 取得與攔截 ─────────────────────────

  const whenReady = (test, ms = 100, max = 300) =>
    new Promise((res, rej) => {
      let n = 0;
      const t = setInterval(() => {
        const v = test();
        if (v) { clearInterval(t); res(v); }
        else if (++n > max) { clearInterval(t); rej(new Error('timeout')); }
      }, ms);
    });

  async function loadThree() {
    try {
      T = await import('three'); // 官網靠 importmap 解析；單檔分享頁已打包進來，不需要 importmap
    } catch (e) {
      const map = await whenReady(() => document.querySelector('script[type=importmap]'));
      const url = new URL(JSON.parse(map.textContent).imports.three, document.baseURI).href;
      T = await import(url);
    }
    try {
      RoundedBox = (await import('three/addons/geometries/RoundedBoxGeometry.js')).RoundedBoxGeometry;
    } catch (e) { LOG('RoundedBoxGeometry 載入失敗，改用普通方塊'); }
    try {
      mergeGeometries = (await import('three/addons/utils/BufferGeometryUtils.js')).mergeGeometries;
    } catch (e) { LOG('BufferGeometryUtils 載入失敗，角色改用逐件繪製'); }
    const rb = (r) => (RoundedBox ? new RoundedBox(1, 1, 1, 2, r) : new T.BoxGeometry(1, 1, 1));
    G = {
      leg: rb(0.3),
      body: new T.CapsuleGeometry(0.5, 0.6, 4, 10),
      arm: rb(0.35),
      head: new T.SphereGeometry(0.5, 16, 12),
      cap: new T.SphereGeometry(0.5, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.55),
      eye: new T.SphereGeometry(0.5, 8, 6),
      box: rb(0.2),
      cyl: new T.CylinderGeometry(0.5, 0.5, 1, 10),
      cone: new T.ConeGeometry(0.5, 1, 14),
      torus: new T.TorusGeometry(0.5, 0.09, 6, 18, Math.PI), // 半圈：笑眼、微笑
      rim: new T.TorusGeometry(0.5, 0.09, 6, 18),            // 整圈：眼鏡框
      pin: new T.ConeGeometry(0.5, 1, 14),
      ring: new T.RingGeometry(0.2, 0.25, 32).rotateX(-Math.PI / 2),
    };
  }

  // three r160 的 render / OrbitControls.update 都綁在實例上，改攔 prototype 上每幀、每次互動必經的方法
  function hook() {
    // 包一層方法，並登記精確的還原：原本是自有屬性就還原描述，原本是繼承來的就刪掉我們加的自有屬性
    const wrap = (proto, name, make) => {
      const own = Object.getOwnPropertyDescriptor(proto, name);
      const orig = proto[name];
      proto[name] = make(orig);
      undo.push(() => { if (own) Object.defineProperty(proto, name, own); else delete proto[name]; });
    };
    wrap(T.Scene.prototype, 'updateMatrixWorld', (orig) => function (f) {
      if (this.children.length > 50) cap.scene = this;
      return orig.call(this, f);
    });
    wrap(T.Camera.prototype, 'updateMatrixWorld', (orig) => function (f) {
      if (this.isPerspectiveCamera) cap.camera = this;
      return orig.call(this, f);
    });
    wrap(T.EventDispatcher.prototype, 'dispatchEvent', (orig) => function (e) {
      if (!cap.controls && this.target && this.target.isVector3 && this.object && this.object.isCamera) cap.controls = this;
      return orig.call(this, e);
    });
  }

  // OrbitControls 的滾輪處理一定會發 start/end 事件；deltaY 為 0 時不會動到鏡頭
  function ensureControls() {
    if (cap.controls) return true;
    const canvas = document.querySelector('canvas');
    if (canvas) canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: 0, bubbles: true, cancelable: true }));
    return !!cap.controls;
  }

  // ───────────────────────── 站方資料與路網 ─────────────────────────

  const shortName = (zh) => String(zh || '').replace(/（.*?）/g, '').trim();

  // policies.json 是站方的資料來源：島、建築（含教學重點 facts）、協作流
  async function loadData() {
    // 單檔分享頁：系所資料已內嵌在頁面裡；官網：直接用 app.js 已載入的資料，不再重抓一次 policies.json
    let d = window.__HEART_POLICIES__ || (window.heartCity && window.heartCity.policies);
    if (!d) {
      const appSrc = [...document.scripts].map((s) => s.src).find((s) => s.includes('heart-island-assets'));
      const base = appSrc.split('?')[0].replace(/[^/]*$/, '');
      d = await (await fetch(base + 'policies.json')).json();
    }
    const fp = new Map(window.heartCity.footprints.map((f) => [f.owner, f]));
    const islands = d.islands.map((is) => {
      const buildings = (is.buildings || []).map((b) => {
        const f = fp.get(b.id);
        return f ? { id: b.id, name: b.name.zh, facts: (b.facts || []).map((x) => x.zh).filter(Boolean), cx: (f.minX + f.maxX) / 2, cz: (f.minZ + f.maxZ) / 2 } : null;
      }).filter(Boolean);
      const cx = buildings.reduce((s, b) => s + b.cx, 0) / (buildings.length || 1);
      const cz = buildings.reduce((s, b) => s + b.cz, 0) / (buildings.length || 1);
      return { id: is.id, name: shortName(is.name.zh), summary: is.summary && is.summary.zh, buildings, cx, cz };
    });
    const flows = new Map(d.flows.map((f) => [f.id, (f.text && f.text.zh) || f.id]));
    return { islands, islandById: new Map(islands.map((i) => [i.id, i])), flows };
  }

  // 站方沒有公開路網，但 89 條行人路線都沿著步道走，合併相近的點就是一張路網
  function buildNet(routes) {
    const eps = 0.06, map = new Map(), nodes = [];
    const get = (p) => {
      const k = Math.round(p.x / eps) + ',' + Math.round(p.z / eps);
      let n = map.get(k);
      if (!n) { n = { id: nodes.length, x: p.x, z: p.z, y: p.footY, adj: new Map(), main: false }; map.set(k, n); nodes.push(n); }
      return n;
    };
    for (const r of routes) {
      let prev = null;
      for (const p of r) {
        const n = get(p);
        if (prev && prev !== n && !prev.adj.has(n.id)) {
          const d = Math.hypot(n.x - prev.x, n.z - prev.z);
          prev.adj.set(n.id, d);
          n.adj.set(prev.id, d);
        }
        prev = n;
      }
    }
    // 只保留最大的連通塊，避免目的地落在走不到的小島
    const comp = new Array(nodes.length).fill(-1), sizes = [];
    nodes.forEach((n) => {
      if (comp[n.id] >= 0) return;
      const c = sizes.length, st = [n.id];
      comp[n.id] = c;
      let s = 0;
      while (st.length) {
        const i = st.pop();
        s++;
        for (const j of nodes[i].adj.keys()) if (comp[j] < 0) { comp[j] = c; st.push(j); }
      }
      sizes.push(s);
    });
    const best = sizes.indexOf(Math.max(...sizes));
    nodes.forEach((n) => { n.main = comp[n.id] === best; });
    const main = nodes.filter((n) => n.main);
    const ys = main.map((n) => n.y).sort((a, b) => a - b);

    const nearest = (x, z) => {
      let b = null, bd = Infinity;
      for (const n of main) {
        const d = (n.x - x) ** 2 + (n.z - z) ** 2;
        if (d < bd) { bd = d; b = n; }
      }
      return { node: b, dist: Math.sqrt(bd) };
    };

    // A*：open 用二元堆
    const path = (a, b) => {
      const h = (n) => Math.hypot(n.x - b.x, n.z - b.z);
      const heap = [[h(a), a]], g = new Map([[a.id, 0]]), prev = new Map(), done = new Set();
      const push = (it) => {
        heap.push(it);
        let i = heap.length - 1;
        while (i > 0) {
          const p = (i - 1) >> 1;
          if (heap[p][0] <= heap[i][0]) break;
          [heap[p], heap[i]] = [heap[i], heap[p]];
          i = p;
        }
      };
      const pop = () => {
        const top = heap[0], last = heap.pop();
        if (heap.length) {
          heap[0] = last;
          let i = 0;
          for (;;) {
            const l = 2 * i + 1, r = l + 1;
            let m = i;
            if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
            if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
            if (m === i) break;
            [heap[m], heap[i]] = [heap[i], heap[m]];
            i = m;
          }
        }
        return top[1];
      };
      while (heap.length) {
        const cur = pop();
        if (done.has(cur.id)) continue;
        if (cur === b) {
          const out = [b];
          let c = b;
          while (prev.has(c.id)) { c = prev.get(c.id); out.push(c); }
          return out.reverse();
        }
        done.add(cur.id);
        for (const [j, w] of cur.adj) {
          const nb = nodes[j];
          const ng = g.get(cur.id) + w;
          if (ng < (g.has(j) ? g.get(j) : Infinity)) { g.set(j, ng); prev.set(j, cur); push([ng + h(nb), nb]); }
        }
      }
      return null;
    };

    return { nodes, main, nearest, path, groundY: ys[Math.floor(ys.length / 2)], yMin: ys[0], yMax: ys[ys.length - 1] };
  }

  // ───────────────────────── 角色模型 ─────────────────────────

  // 尺寸、位置、色塊照 people.js 的成人（scale 1）定義；各項配件的座標取自該檔，少數新增款式沿用同一套幾何與比例
  function buildFigure(look) {
    const hatted = look.hat !== 'none';
    const g = new T.Group();
    // 零件先記在各自的父節點（身體、兩腿、兩手）底下，最後每個父節點合併成一個網格
    const parts = new Map();
    const tmp = new T.Object3D();
    // 身高、體型直接做進零件：身高拉長腿與軀幹、體型加寬肩與身體，頭（臉、眼鏡、帽子、頭髮）維持原比例並整顆往上移，
    // 不再整個角色非等比縮放（頭會被拉成橢圓）
    const W = look.width || 1, H = look.height || 1, NECK = 0.27;
    const bodyS = new T.Matrix4().makeScale(W, H, W), headT = new T.Matrix4().makeTranslation(0, NECK * (H - 1), 0);
    const add = (parent, key, c, off, s, rot) => {
      // 胸前的衣款細節（領帶、名牌、翻領、釦子）貼著軀幹的弧面：依 x 推算表面深度並轉向法線，
      // 保留原本前後疊放的相對距離（名牌上的字仍在名牌之上），側面看不再浮在身體外
      if (parent === g && (key === 'box' || key === 'eye') && off[2] >= 0.048 && off[1] > 0.12 && off[1] < 0.275 && Math.abs(off[0]) < 0.066) {
        const RX = 0.0705, RZ = 0.06, u = off[0] / RX;
        const zs = RZ * Math.sqrt(Math.max(0.12, 1 - u * u));
        const r0 = rot || [0, 0, 0];
        off = [off[0], off[1], zs + (off[2] - 0.0575)];
        rot = [r0[0], Math.atan2(off[0] / (RX * RX), zs / (RZ * RZ)), r0[2]];
      }
      tmp.position.set(...off);
      tmp.scale.set(...s);
      tmp.rotation.set(...(rot || [0, 0, 0]));
      tmp.updateMatrix();
      const m = tmp.matrix.clone();
      if (parent.userData.hmHead) m.premultiply(headT); // 眼皮等跟著頭部走的子群組：只平移
      else if (parent !== g) m.premultiply(bodyS);     // 腿、手臂（含手持物）跟著拉長／加寬
      else if (off[1] < NECK) m.premultiply(bodyS);    // 軀幹、衣款、背包
      else m.premultiply(headT);                       // 頭部整組只平移
      if (!parts.has(parent)) parts.set(parent, []);
      parts.get(parent).push({ geo: G[key], color: c, matrix: m });
    };
    // 需要獨立材質的零件（例如墨鏡的反光鏡片）：不合併，單獨一個網格；幾何仍共用 G
    const addSolo = (parent, key, c, off, s, rot, mat = {}) => {
      tmp.position.set(...off);
      tmp.scale.set(...s);
      tmp.rotation.set(...(rot || [0, 0, 0]));
      tmp.updateMatrix();
      const m = tmp.matrix.clone();
      if (parent !== g || off[1] < NECK) m.premultiply(bodyS); else m.premultiply(headT);
      const mesh = new T.Mesh(G[key], new T.MeshStandardMaterial({ color: c, roughness: 0.7, ...mat }));
      mesh.matrixAutoUpdate = false;
      mesh.matrix.copy(m);
      mesh.castShadow = false;
      parent.add(mesh);
      return mesh;
    };
    const pivot = (x, y) => {
      const p = new T.Group();
      p.position.set(x * W, y * H, 0);
      g.add(p);
      return p;
    };
    const DARK = 0x221c1c;
    const isNkuht = String(look.outfit || '').startsWith('nkuht-');
    const isFemLook = ['long', 'bob', 'curly', 'bun', 'pony', 'puff'].includes(look.hairStyle);

    // 腿（髖軸 y=0.13）+ 鞋
    const legs = [-0.032, 0.032].map((x) => {
      const p = pivot(x, 0.13);
      if (look.outfit === 'nkuht-polo') {
        add(p, 'leg', look.pants, [0, -0.026, 0], [0.052, 0.054, 0.06]);
        add(p, 'leg', look.skin, [0, -0.072, 0], [0.042, 0.056, 0.046]);
        add(p, 'box', 0xf8f8f6, [0, -0.098, 0], [0.045, 0.032, 0.049]);
      } else if (isNkuht && isFemLook) {
        add(p, 'leg', look.pants, [0, -0.024, 0], [0.048, 0.048, 0.054]);
        add(p, 'leg', look.skin, [0, -0.076, 0], [0.042, 0.078, 0.046]);
      } else {
        add(p, 'leg', look.pants, [0, -0.065, 0], [0.05, 0.13, 0.058]);
      }
      if (look.outfit === 'nkuht-polo' || look.role === 'puma') {
        add(p, 'box', 0xf6f4ef, [0, -0.118, 0.012], [0.055, 0.025, 0.085]);
      } else if (isNkuht && isFemLook) {
        add(p, 'box', 0x1b1a1f, [0, -0.118, 0.011], [0.05, 0.023, 0.082]);
        add(p, 'box', look.skin, [0, -0.107, 0.018], [0.036, 0.008, 0.038]);
      } else {
        add(p, 'box', isNkuht ? 0x1b1a1f : 0x2a2524, [0, -0.118, 0.012], [0.055, 0.025, 0.085]);
      }
      return p;
    });

    // 身體與衣款
    const o = look.outfit;
    const COAT = 0x283244, COAT_SH = 0x1e2636, KNIT = 0x3b4250, KNIT_RIB = 0x2c323d;
    if (o === 'coat') { // 研究袍：白色長袍蓋過大腿、前襟敞開露出內搭、V 領翻領、口袋與胸前插筆
      add(g, 'body', COAT, [0, 0.2, 0], [0.138, 0.112, 0.118]);
      add(g, 'box', COAT, [0, 0.1, 0], [0.142, 0.1, 0.116]);                      // 袍身下襬，蓋到大腿
      add(g, 'box', look.shirt, [0, 0.24, 0.056], [0.036, 0.05, 0.006]);          // V 領露出的內搭
      add(g, 'box', look.shirt, [0, 0.212, 0.057], [0.018, 0.03, 0.006]);
      for (const sx of [-1, 1]) add(g, 'box', COAT_SH, [0.021 * sx, 0.232, 0.06], [0.014, 0.066, 0.006], [0, 0, 0.42 * sx]); // 翻領
      add(g, 'box', COAT_SH, [0, 0.135, 0.0595], [0.004, 0.13, 0.004]);           // 前襟開口
      for (const sx of [-1, 1]) add(g, 'box', COAT_SH, [0.04 * sx, 0.105, 0.059], [0.032, 0.026, 0.004]); // 下口袋
      add(g, 'box', COAT_SH, [0.042, 0.205, 0.0595], [0.026, 0.02, 0.004]);       // 胸前口袋
      add(g, 'box', 0x3e7c8c, [0.048, 0.219, 0.061], [0.004, 0.02, 0.004]);       // 插筆
    } else if (o === 'cardigan') { // 針織外套：開襟 V 領露出內搭、中間一排扣子、下襬與袖口羅紋、兩個口袋
      add(g, 'body', KNIT, [0, 0.2, 0], [0.139, 0.112, 0.118]);
      add(g, 'box', look.shirt, [0, 0.25, 0.055], [0.05, 0.026, 0.006]);         // V 領：上寬下窄的內搭
      add(g, 'box', look.shirt, [0, 0.226, 0.057], [0.026, 0.024, 0.006]);
      add(g, 'box', look.shirt, [0, 0.208, 0.058], [0.012, 0.018, 0.006]);
      for (const y of [0.188, 0.163, 0.138]) add(g, 'eye', 0x5a4a38, [0, y, 0.0605], [0.011, 0.011, 0.006]); // 扣子
      add(g, 'box', KNIT_RIB, [0, 0.127, 0], [0.126, 0.02, 0.106]);               // 下襬羅紋
      for (const sx of [-1, 1]) add(g, 'box', KNIT_RIB, [0.038 * sx, 0.158, 0.057], [0.028, 0.024, 0.005]); // 口袋
    } else if (o === 'nkuht-teal' || o === 'nkuht-black') {
      // 高餐秋冬墨綠西裝／經典炭黑西裝：白襯衫領口、金黃領帶（男）或金黃蝴蝶結領巾（女）、金色名牌、三顆門襟釦
      const jkt = look.shirt;
      const lapCol = o === 'nkuht-teal' ? 0x0c4743 : 0x17181c;
      const tipCol = o === 'nkuht-black' ? 0x1c1d22 : 0x18223c;
      if (isFemLook) {
        add(g, 'box', look.pants, [0, 0.126, 0], [0.138, 0.072, 0.114]);
      }
      add(g, 'body', jkt, [0, 0.2, 0], [0.141, 0.115, 0.12]);
      add(g, 'box', 0xfbfcfa, [0, 0.246, 0.056], [0.048, 0.038, 0.008]);
      add(g, 'box', 0xfbfcfa, [0, 0.218, 0.058], [0.026, 0.03, 0.008]);
      for (const sx of [-1, 1]) {
        add(g, 'box', 0xffffff, [0.016 * sx, 0.267, 0.051], [0.026, 0.013, 0.012], [0, 0, -0.46 * sx]);
        add(g, 'box', lapCol, [0.026 * sx, 0.228, 0.06], [0.016, 0.066, 0.006], [0, 0, 0.36 * sx]);
        add(g, 'box', lapCol, [0.041 * sx, 0.156, 0.059], [0.03, 0.014, 0.005]);
      }
      for (const y of [0.194, 0.17, 0.146]) add(g, 'eye', 0xf2efe4, [0, y, 0.062], [0.01, 0.01, 0.006]);
      // 左胸金色高餐名牌 + 右翻領徽章
      add(g, 'box', 0xe6be53, [0.038, 0.215, 0.062], [0.028, 0.01, 0.005]);
      add(g, 'box', 0xfaf8f0, [0.038, 0.215, 0.065], [0.022, 0.005, 0.002]);
      add(g, 'eye', 0xf2efe6, [-0.033, 0.24, 0.063], [0.009, 0.009, 0.005]);
      if (isFemLook) {
        add(g, 'eye', 0xf2c94c, [0, 0.255, 0.063], [0.016, 0.014, 0.01]);
        for (const sx of [-1, 1]) {
          add(g, 'box', 0xf2c94c, [0.016 * sx, 0.236, 0.063], [0.015, 0.038, 0.006], [0, 0, -0.44 * sx]);
          add(g, 'box', tipCol, [0.024 * sx, 0.22, 0.064], [0.015, 0.013, 0.006], [0, 0, -0.44 * sx]);
        }
      } else {
        add(g, 'box', 0xf2c94c, [0, 0.256, 0.062], [0.015, 0.013, 0.007]);
        add(g, 'box', 0xf2c94c, [0, 0.226, 0.062], [0.016, 0.048, 0.006]);
        add(g, 'eye', 0x18223c, [0, 0.236, 0.065], [0.005, 0.005, 0.003]);
      }
    } else if (o === 'nkuht-summer') {
      // 高餐夏季短袖白襯衫制服：金色名牌 + 男生黃底藏青斜紋領帶／女生黃底滾邊蝴蝶結領巾 + 西裝褲／及膝窄裙
      const tipCol = look.pants === 0xc6aa8c ? 0x1c1d22 : 0x18223c;
      if (isFemLook) {
        add(g, 'box', look.pants, [0, 0.128, 0], [0.138, 0.074, 0.114]);
      } else {
        add(g, 'box', look.pants, [0, 0.136, 0], [0.132, 0.036, 0.11]);
        add(g, 'box', 0x1b1c22, [0, 0.153, 0], [0.137, 0.014, 0.117]);
        add(g, 'box', 0xd8dce2, [0, 0.153, 0.059], [0.018, 0.015, 0.006]);
      }
      add(g, 'body', look.shirt, [0, 0.2, 0], [0.136, 0.112, 0.116]);
      for (const sx of [-1, 1]) {
        add(g, 'box', 0xffffff, [0.017 * sx, 0.266, 0.05], [0.027, 0.014, 0.013], [0, 0, -0.46 * sx]);
        add(g, 'eye', 0x18223c, [0.022 * sx, 0.263, 0.058], [0.005, 0.005, 0.004]);
      }
      add(g, 'box', 0xe6be53, [0.036, 0.222, 0.059], [0.027, 0.01, 0.005]);
      add(g, 'box', 0xfaf8f0, [0.036, 0.222, 0.062], [0.021, 0.005, 0.002]);
      if (isFemLook) {
        add(g, 'eye', 0xf2c94c, [0, 0.255, 0.061], [0.016, 0.014, 0.01]);
        for (const sx of [-1, 1]) {
          add(g, 'box', 0xf2c94c, [0.017 * sx, 0.236, 0.061], [0.015, 0.038, 0.006], [0, 0, -0.46 * sx]);
          add(g, 'box', tipCol, [0.025 * sx, 0.22, 0.062], [0.015, 0.013, 0.006], [0, 0, -0.46 * sx]);
        }
      } else {
        add(g, 'box', 0xf2c94c, [0, 0.256, 0.06], [0.015, 0.013, 0.007]);
        add(g, 'box', 0xf2c94c, [0, 0.205, 0.06], [0.018, 0.088, 0.006]);
        add(g, 'box', 0x18223c, [0, 0.163, 0.061], [0.018, 0.02, 0.006]);
        add(g, 'box', 0xffffff, [0, 0.175, 0.062], [0.018, 0.004, 0.006], [0, 0, 0.35]);
      }
    } else if (o === 'nkuht-polo') {
      // 高餐新生休閒 Polo 衫制服：翻領雙釦 Polo + 卡其短褲／褲裙 + 白長襪白球鞋
      if (isFemLook) add(g, 'box', look.pants, [0, 0.132, 0], [0.137, 0.064, 0.113]);
      else add(g, 'box', look.pants, [0, 0.136, 0], [0.132, 0.036, 0.11]);
      add(g, 'body', look.shirt, [0, 0.2, 0], [0.136, 0.112, 0.116]);
      for (const sx of [-1, 1]) add(g, 'box', look.shirt, [0.016 * sx, 0.266, 0.05], [0.026, 0.013, 0.012], [0, 0, -0.45 * sx]);
      add(g, 'box', 0xfbfcfa, [0, 0.244, 0.059], [0.008, 0.032, 0.005]);
      add(g, 'eye', 0xe6be53, [0.034, 0.228, 0.06], [0.01, 0.01, 0.005]);
    } else add(g, 'body', look.shirt, [0, 0.2, 0], [0.135, 0.11, 0.115]);
    if (o === 'vest') { // 公務員背心：無袖橘色背心套在襯衫外，V 領露出襯衫領口，胸前掛識別證
      const VEST_SH = 0xc45a35;
      add(g, 'body', CORAL, [0, 0.196, 0], [0.141, 0.104, 0.12]);                 // 背心身（比身體大一圈，袖子露出襯衫）
      add(g, 'box', look.shirt, [0, 0.256, 0.054], [0.046, 0.026, 0.006]);        // V 領內的襯衫
      add(g, 'box', look.shirt, [0, 0.238, 0.056], [0.026, 0.02, 0.006]);
      for (const sx of [-1, 1]) add(g, 'box', 0xffffff, [0.016 * sx, 0.268, 0.05], [0.026, 0.012, 0.012], [0, 0, -0.5 * sx]); // 白襯衫領尖
      add(g, 'box', VEST_SH, [0, 0.16, 0.0605], [0.004, 0.08, 0.004]);            // 前襟拉鍊
      add(g, 'box', 0x3e7c8c, [-0.014, 0.225, 0.062], [0.005, 0.05, 0.004], [0, 0, 0.35]); // 掛繩
      add(g, 'box', 0x3e7c8c, [0.014, 0.225, 0.062], [0.005, 0.05, 0.004], [0, 0, -0.35]);
      add(g, 'box', 0xffffff, [0, 0.183, 0.064], [0.032, 0.042, 0.006]);          // 識別證
      add(g, 'box', 0x58a6a6, [0, 0.195, 0.068], [0.024, 0.01, 0.002]);           // 識別證色條
    }
    if (o === 'hivis') { // 反光背心：螢光橘、兩道環繞腰身的銀色反光條、肩上兩道直條、前襟拉鍊
      const HIVIS = 0xff8a1f, REFL = 0xe4e8ec;
      add(g, 'body', HIVIS, [0, 0.196, 0], [0.141, 0.104, 0.12]);
      add(g, 'box', look.shirt, [0, 0.258, 0.054], [0.044, 0.024, 0.006]);        // V 領內的上衣
      for (const y of [0.172, 0.214]) add(g, 'cyl', REFL, [0, y, 0], [0.146, 0.014, 0.125]); // 環繞反光條
      for (const sx of [-1, 1]) {
        add(g, 'box', REFL, [0.036 * sx, 0.25, 0.058], [0.014, 0.05, 0.004]);     // 肩上直條（前）
        add(g, 'box', REFL, [0.036 * sx, 0.25, -0.058], [0.014, 0.05, 0.004]);    // （後）
      }
      add(g, 'box', 0x8a4a12, [0, 0.16, 0.0615], [0.004, 0.09, 0.004]);           // 前襟拉鍊
    }
    if (o === 'puma') { // 領航員角色：橘色背心、敞開的白領口、小浪花別針（沒有識別證）
      add(g, 'box', CORAL, [0, 0.205, 0.004], [0.13, 0.112, 0.106]);
      add(g, 'box', 0xfbfbf7, [0, 0.235, 0.058], [0.03, 0.05, 0.004]);
      add(g, 'eye', 0x58a6a6, [0.035, 0.225, 0.06], [0.026, 0.026, 0.01]);
    }

    // 手臂（肩軸 y=0.255）+ 手；公務員背心的袖子是背心色
    const sleeve = o === 'coat' ? COAT : o === 'cardigan' ? KNIT : look.shirt; // 背心類無袖：袖子露出裡面的上衣
    const HAND_Y = -0.105; // 手相對肩軸的高度
    const arms = [-0.077, 0.077].map((x) => {
      const p = pivot(x, 0.255);
      if (o === 'nkuht-summer' || o === 'nkuht-polo') {
        add(p, 'arm', sleeve, [0, -0.024, 0], [0.037, 0.048, 0.04]);
        add(p, 'arm', look.skin, [0, -0.072, 0], [0.031, 0.058, 0.034]);
      } else {
        add(p, 'arm', sleeve, [0, -0.05, 0], [0.034, 0.1, 0.038]);
      }
      if (o === 'nkuht-teal' || o === 'nkuht-black') add(p, 'box', 0xfbfcfa, [0, -0.095, 0], [0.035, 0.01, 0.039]);
      if (o === 'cardigan') add(p, 'box', KNIT_RIB, [0, -0.09, 0], [0.038, 0.016, 0.042]); // 袖口羅紋
      if (o === 'coat') add(p, 'box', COAT_SH, [0, -0.09, 0], [0.037, 0.012, 0.041]);
      add(p, 'eye', look.skin, [0, HAND_Y, 0], [0.034, 0.034, 0.034]);
      return p;
    });
    // 手：掛在手臂末端的子節點；每幀轉成手臂的反向，掛在這裡的東西跟著手移動但維持直立（目前只有氣球，舉手時才不會轉到地上）
    const hands = arms.map((a) => {
      const h = new T.Group();
      h.position.set(0, HAND_Y * H, 0);
      a.add(h);
      return h;
    });
    const hold = (i, key, c, [x, y, z], s) => add(hands[i], key, c, [x, y - HAND_Y, z], s); // 座標仍以肩軸為準，換算成相對手

    // 頭與臉：眼睛、腮紅、嘴巴
    // 2026-11-14 人物精緻化：五官貼著頭部的弧面擺放並轉向表面法線（側面看不再浮在臉外）；
    // 眼睛加反光點、眉毛、耳朵；頭髮加瀏海與鬢角；眼皮另成一組，用來眨眼
    add(g, 'head', look.skin, [0, 0.345, 0], [0.19, 0.178, 0.172]);
    const face = (key, c, x, y, s, lift = 0.0015, rz = 0, parent = g) => {
      const HX = 0.095, HY = 0.089, HZ = 0.086, HC = 0.345;
      const u = x / HX, v = (y - HC) / HY;
      const z = HZ * Math.sqrt(Math.max(0.04, 1 - u * u - v * v));
      const nx = x / (HX * HX), ny = (y - HC) / (HY * HY), nz = z / (HZ * HZ);
      add(parent, key, c, [x, y, z + lift], s, [-Math.atan2(ny, Math.hypot(nx, nz)), Math.atan2(nx, nz), rz]);
    };
    const skinShade = new T.Color(look.skin).multiplyScalar(0.86).getHex();
    const browCol = look.hairStyle === 'bald' ? new T.Color(look.hair).lerp(new T.Color(look.skin), 0.35).getHex() : look.hair;
    const blinkable = look.eyes !== 'happy' && look.eyes !== 'sleepy';
    const lids = new T.Group();
    lids.userData.hmHead = true;
    lids.visible = false;
    g.add(lids);
    for (const s of [-1, 1]) {
      const x = 0.036 * s;
      if (look.eyes === 'happy') face('torus', DARK, x, 0.344, [0.032, 0.032, 0.02]);              // ^ ^
      else if (look.eyes === 'wide') face('eye', DARK, x, 0.348, [0.03, 0.039, 0.014]);
      else if (look.eyes === 'sleepy') face('box', DARK, x, 0.346, [0.03, 0.006, 0.012]);
      else face('eye', DARK, x, 0.348, [0.021, 0.027, 0.012]);
      if (blinkable) {
        const big = look.eyes === 'wide';
        face('eye', 0xffffff, x + 0.006, 0.355 + (big ? 0.004 : 0), [big ? 0.011 : 0.008, big ? 0.011 : 0.008, 0.004], 0.0075); // 反光點
        face('eye', look.skin, x, 0.349, [big ? 0.036 : 0.028, big ? 0.045 : 0.034, 0.016], 0.004, 0, lids);              // 眼皮
        face('box', DARK, x, 0.346, [big ? 0.03 : 0.024, 0.004, 0.004], 0.0115, 0, lids);                                  // 閉眼的睫毛線
      }
      face('box', browCol, 0.038 * s, 0.37, [0.026, 0.0065, 0.006], 0.003, -0.12 * s);          // 眉毛
      face('eye', 0xf2a1a1, 0.056 * s, 0.324, [0.024, 0.013, 0.008]);
      add(g, 'eye', look.skin, [0.093 * s, 0.338, 0.002], [0.026, 0.042, 0.03]);                // 耳朵
      add(g, 'eye', skinShade, [0.098 * s, 0.338, 0.004], [0.012, 0.022, 0.014]);
    }
    face('eye', skinShade, 0, 0.334, [0.012, 0.009, 0.008], 0.001);                               // 小鼻子
    if (look.face !== 'mask') {
      if (look.mouth === 'smile') face('torus', DARK, 0, 0.322, [0.046, 0.046, 0.02], 0.0015, Math.PI); // 下半圈
      else if (look.mouth === 'o') face('eye', DARK, 0, 0.31, [0.014, 0.019, 0.01]);
      else if (look.mouth === 'flat') face('box', DARK, 0, 0.31, [0.03, 0.005, 0.008]);
    }
    if (look.face === 'glasses') { // 領航員角色 角色的眼鏡：兩個細框、鼻樑、向後的鏡腳
      for (const dx of [-0.038, 0.038]) add(g, 'rim', 0x211d1d, [dx, 0.35, 0.09], [0.05, 0.044, 0.05]);
      add(g, 'box', 0x211d1d, [0, 0.352, 0.091], [0.026, 0.006, 0.006]);
      for (const dx of [-0.093, 0.093]) add(g, 'box', 0x211d1d, [dx, 0.352, 0.045], [0.006, 0.006, 0.09]);
    }
    if (look.face === 'sunglasses') { // 墨鏡：兩片蓋住眼睛的深色鏡片（較亮的反光材質），鼻樑與鏡腳沿用眼鏡的尺寸（官網 10/23 新增，併入）
      for (const dx of [-0.038, 0.038]) addSolo(g, 'eye', 0x161314, [dx, 0.349, 0.092], [0.058, 0.046, 0.012], null, { roughness: 0.25, metalness: 0.2 });
      add(g, 'box', 0x211d1d, [0, 0.356, 0.092], [0.03, 0.007, 0.006]);
      for (const dx of [-0.093, 0.093]) add(g, 'box', 0x211d1d, [dx, 0.352, 0.045], [0.006, 0.006, 0.09]);
    }
    if (look.face === 'mask') {
      add(g, 'box', 0xf2f2ee, [0, 0.308, 0.078], [0.1, 0.06, 0.045]);
      for (const dx of [-0.092, 0.092]) add(g, 'box', 0xf2f2ee, [dx, 0.325, 0.03], [0.004, 0.004, 0.1]);
    }

    // 頭髮：比頭大一圈的殼 + 髮型（戴帽子時頭髮殼壓低、髮型被蓋住；光頭沒有頭髮殼）
    if (look.hairStyle !== 'bald') add(g, 'cap', look.hair, [0, 0.352, -0.006], [0.206, hatted ? 0.17 : 0.19, 0.204], [-0.32, 0, 0]);
    if (!hatted) {
      const st = look.hairStyle, c = look.hair;
      if (st === 'long') add(g, 'box', c, [0, 0.31, -0.07], [0.19, 0.13, 0.05], [0.12, 0, 0]);
      if (st === 'bun') add(g, 'eye', c, [0, 0.44, -0.07], [0.075, 0.07, 0.07]);
      if (st === 'pony') add(g, 'eye', c, [0, 0.33, -0.115], [0.055, 0.1, 0.05], [0.35, 0, 0]);
      if (st === 'puff') for (const [dx, dy] of [[-0.07, 0.4], [0.07, 0.4], [0, 0.435]]) add(g, 'eye', c, [dx, dy, -0.02], [0.09, 0.08, 0.09]);
      if (st === 'curly') { // 領航員角色 的捲髮：頭頂幾顆小球，再補兩側
        for (const [dx, dz] of [[-0.035, -0.02], [0.035, -0.02], [0, 0.03], [0, -0.06]]) add(g, 'eye', c, [dx, 0.43, dz], [0.066, 0.056, 0.066]);
        for (const dx of [-0.085, 0.085]) add(g, 'eye', c, [dx, 0.395, -0.02], [0.06, 0.06, 0.06]);
      }
      if (st === 'bob') {
        add(g, 'box', c, [0, 0.315, -0.065], [0.2, 0.12, 0.07], [0.1, 0, 0]);
        for (const sx of [-1, 1]) add(g, 'box', c, [sx * 0.098, 0.318, -0.015], [0.03, 0.11, 0.13]);
      }
      if (st === 'side') add(g, 'box', c, [0.04, 0.405, 0.075], [0.13, 0.035, 0.06], [0.15, 0, -0.25]); // 斜瀏海
      if (st !== 'side' && st !== 'bald') {
        // 瀏海：額前一排小髮束，略為錯落
        for (const [x, y, w] of [[-0.052, 0.388, 0.05], [-0.018, 0.384, 0.054], [0.018, 0.386, 0.052], [0.052, 0.39, 0.048]]) face('eye', c, x, y, [w, 0.036, 0.03], -0.004);
      }
    }

    // 帽子
    const hc = look.hatColor;
    switch (look.hat) {
      case 'kid':
        add(g, 'cap', hc, [0, 0.39, 0], [0.205, 0.13, 0.195]);
        add(g, 'cyl', hc, [0, 0.39, 0.02], [0.24, 0.008, 0.22]);
        break;
      case 'hardhat':
        add(g, 'cap', hc, [0, 0.395, 0], [0.21, 0.13, 0.2]);
        add(g, 'cyl', hc, [0, 0.39, 0.02], [0.22, 0.01, 0.22]);
        break;
      case 'helmet': add(g, 'cap', hc, [0, 0.385, 0], [0.205, 0.12, 0.195]); break;
      case 'hike': add(g, 'cap', hc, [0, 0.39, 0], [0.214, 0.1, 0.206]); break;
      case 'straw': add(g, 'cone', 0xd8b878, [0, 0.415, 0], [0.34, 0.07, 0.34]); break; // 斗笠固定色
      case 'beanie':
        add(g, 'cap', hc, [0, 0.376, -0.008], [0.222, 0.17, 0.218], [-0.2, 0, 0]);
        add(g, 'eye', 0xfff8f0, [0, 0.465, -0.02], [0.045, 0.045, 0.045]);
        break;
      default:
    }

    // 背部
    if (look.back === 'schoolbag') add(g, 'box', 0x4a6fa5, [0, 0.2, -0.07], [0.1, 0.11, 0.05]);
    if (look.back === 'hikepack') add(g, 'box', 0xc06a3a, [0, 0.21, -0.075], [0.11, 0.14, 0.07]);

    // 手持物（掛在手臂軸上，座標已換算成相對肩軸；會跟著手臂擺動）；只有氣球改用 hold() 掛在手上、維持直立
    switch (look.hand) {
      case 'coffee': add(arms[1], 'cyl', 0xf6efe3, [0.023, -0.095, 0.03], [0.03, 0.05, 0.03]); break;
      case 'basket':
        add(arms[1], 'cyl', 0x9c7a4e, [0.033, -0.105, 0.02], [0.08, 0.06, 0.08]);
        add(arms[1], 'eye', 0x7fa35e, [0.033, -0.065, 0.02], [0.06, 0.04, 0.06]);
        break;
      case 'cane': add(arms[1], 'cyl', 0x7a5a3e, [0.028, -0.165, 0.03], [0.012, 0.18, 0.012]); break;
      case 'pole': add(arms[1], 'cyl', 0x4a4a52, [0.023, -0.135, 0.03], [0.01, 0.24, 0.01]); break;
      case 'tube': add(arms[0], 'cyl', 0x7fa8d8, [-0.023, -0.065, 0.02], [0.03, 0.12, 0.03]); break;
      case 'umbrella':
        add(arms[1], 'cyl', CORAL, [0.028, -0.15, 0.03], [0.02, 0.19, 0.02]);
        add(arms[1], 'eye', 0x2a2524, [0.028, -0.255, 0.03], [0.026, 0.026, 0.026]);
        break;
      case 'flower':
        add(arms[1], 'cyl', 0x6f9a52, [0.03, -0.12, 0.03], [0.01, 0.12, 0.01]);
        add(arms[1], 'eye', 0xf2a1a1, [0.03, -0.055, 0.03], [0.045, 0.045, 0.045]);
        break;
      case 'balloon':
        hold(1, 'cyl', 0xdddddd, [0.03, 0.05, 0.03], [0.004, 0.3, 0.004]);
        hold(1, 'eye', 0xe8575a, [0.03, 0.27, 0.03], [0.09, 0.1, 0.09]);
        break;
      default:
    }

    // 同行物
    if (look.side === 'luggage') {
      add(g, 'box', CORAL, [0.11, 0.08, 0.0], [0.05, 0.13, 0.1]);
      add(g, 'cyl', 0x2a2524, [0.11, 0.17, 0.0], [0.008, 0.06, 0.008]);
    }
    if (look.side === 'stroller') { // 前方的嬰兒推車（簡化版）
      add(g, 'box', 0x6f7fb5, [0, 0.1, 0.25], [0.1, 0.08, 0.14]);
      add(g, 'cap', 0x58a6a6, [0, 0.14, 0.21], [0.11, 0.09, 0.11]);
      add(g, 'box', 0x2a2524, [0, 0.16, 0.13], [0.08, 0.012, 0.18]);
      for (const [x, z] of [[-0.055, 0.2], [0.055, 0.2], [-0.055, 0.3], [0.055, 0.3]]) add(g, 'eye', 0x2a2524, [x, 0.035, z], [0.05, 0.05, 0.05]);
    }

    // 合併：每個父節點一個網格、共用頂點色材質
    if (!FIG_MAT) FIG_MAT = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.7 });
    const col = new T.Color();
    for (const [parent, list] of parts) {
      const geos = list.map(({ geo, color, matrix }) => {
        let gg = geo.clone().applyMatrix4(matrix);
        if (gg.index) gg = gg.toNonIndexed(); // 圓角方塊沒有索引、球體有：統一成無索引才能合併
        col.setHex(color);
        const n = gg.attributes.position.count, arr = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) { arr[i * 3] = col.r; arr[i * 3 + 1] = col.g; arr[i * 3 + 2] = col.b; }
        gg.setAttribute('color', new T.BufferAttribute(arr, 3));
        return gg;
      });
      const merged = mergeGeometries && geos.length > 1 ? mergeGeometries(geos, false) : null;
      if (merged) {
        geos.forEach((x) => x.dispose());
        const m = new T.Mesh(merged, FIG_MAT);
        m.castShadow = false; // 站方陰影圖改為靜態（只含建築），角色用下面的軟陰影
        m.userData.hmOwned = true;
        parent.add(m);
      } else for (const gg of geos) { // 合併工具不可用時退回逐件（仍共用材質）
        const m = new T.Mesh(gg, FIG_MAT);
        m.castShadow = false; // 站方陰影圖改為靜態（只含建築），角色用下面的軟陰影
        m.userData.hmOwned = true;
        parent.add(m);
      }
    }

    // 頭頂標記，方便在大場景裡找到自己
    const pin = new T.Mesh(G.pin, new T.MeshStandardMaterial({ color: 0xff5a36, roughness: 0.7, emissive: 0xff5a36, emissiveIntensity: 0.5 }));
    pin.position.set(0, 0.62 + NECK * (H - 1), 0);
    pin.scale.set(0.06, 0.1, 0.06);
    pin.rotation.set(Math.PI, 0, 0);
    g.add(pin);

    // 腳下的軟陰影（同站方居民）：站方的陰影圖只含靜態建築，會動的角色都用這種圓形陰影
    if (!G.blob) G.blob = new T.CircleGeometry(0.5, 20).rotateX(-Math.PI / 2);
    if (!G.blobMat) G.blobMat = new T.MeshBasicMaterial({ color: 0x2a2018, transparent: true, opacity: 0.22, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8 });
    const blob = new T.Mesh(G.blob, G.blobMat);
    blob.position.y = 0.006;
    blob.scale.setScalar(0.2 * W);
    blob.renderOrder = 1;
    blob.userData.hmShared = true;
    g.add(blob);

    // 追隨中顯示的底圈
    const ring = new T.Mesh(G.ring, new T.MeshBasicMaterial({ color: 0xff5a36, transparent: true, opacity: 0.85, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -8 }));
    ring.position.y = 0.012;
    ring.renderOrder = 3; // 地上的底圈：固定繪製順序並往前偏移深度，走在高低不平的路面時不會被地面吃掉而閃爍
    ring.visible = false;
    g.add(ring);

    // base：學童身形較小（站方 scale 0.78）；shape：使用者設定的身高與體型
    // shape 已做進零件，群組只做等比縮放；pinY 給頭頂標記的上下浮動用
    return { group: g, legs, arms, hands, pin, ring, lids: blinkable ? lids : null, pinY: pin.position.y, base: look.role === 'child' ? 0.78 : look.role === 'puma' ? 1.16 : 1, shape: { w: 1, h: 1 } };
  }

  // 眨眼：每 2–5 秒閉眼約 0.13 秒（眼皮群組平常隱藏）；夥伴與領航員分身共用
  function blinkFigure(fig, now) {
    if (!fig || !fig.lids) return;
    if (!fig.blinkAt) fig.blinkAt = now + 800 + Math.random() * 3200;
    const t = now - fig.blinkAt;
    fig.lids.visible = t >= 0 && t < 130;
    if (t >= 130) fig.blinkAt = now + 2000 + Math.random() * 3000;
  }

  // 站方 zoomFactor：鏡頭拉遠時小人放大到最多 1.45 倍
  function camDist() {
    const cam = cap.camera;
    if (cap.controls) return cam.position.distanceTo(cap.controls.target);
    const dir = cam.getWorldDirection(new T.Vector3());
    return dir.y < -0.01 ? (0.4 - cam.position.y) / dir.y : 20;
  }
  const zoomFactor = () => Math.min(1.45, Math.max(1, camDist() / 20));
  // 站方的縮放 × 身分身形 × 鏡頭距離；再套用使用者的身高與體型。重建後立刻套用，不會有一幀以 1 倍大小出現
  const applyFigScale = (fig) => {
    const sc = fig.base * 0.8 * zoomFactor();
    fig.group.scale.set(sc * fig.shape.w, sc * fig.shape.h, sc * fig.shape.w);
  };

  // ───────────────────────── 介面 ─────────────────────────

  const CSS = `
.hm-open{font:inherit}
#hm-open[aria-pressed=true]{background:#211d1d!important;color:#fff8f4!important;border-color:#211d1d!important}
.hm-panel{position:absolute;right:0;top:0;bottom:0;width:318px;overflow:auto;box-sizing:border-box;
  background:#fff8f4e8;color:#211d1d;border:0;border-left:1px solid #211d1d26;border-radius:0;box-shadow:none;-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);
  font:14px/1.5 "Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif;z-index:7;padding:29px 22px 22px;display:none;overscroll-behavior:contain}
.hm-panel.loose{position:fixed}
body.hm-docked #sidebar{display:none!important}
@media (min-width:801px){
  body.hm-docked .sidebar-hidden .toolbar{right:338px}
  body.hm-docked .sidebar-hidden .controls{right:348px}
}
.hm-panel.open{display:block}
.hm-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px}
.hm-eyebrow{font-size:11px;letter-spacing:.14em;color:#db6a41;font-weight:700;margin-bottom:10px}
.hm-title{font-size:24px;font-weight:900;margin:0;line-height:1.25}
.hm-x{border:0;background:transparent;font-size:22px;line-height:1;cursor:pointer;color:#78685e;padding:2px 6px}
.hm-tabs{display:flex;gap:4px;margin:14px 0 2px}
.hm-tab{flex:1;border:0;background:transparent;font:inherit;font-weight:600;color:#78685e;padding:6px 0;cursor:pointer;border-radius:9px}
.hm-tab:hover{background:#db6a4114}
.hm-tab[aria-selected=true],.hm-tab[aria-selected=true]:hover{background:#db6a41;color:#fff}
.hm-row{margin-top:12px}
.hm-lab{font-size:12px;color:#78685e;margin-bottom:6px;letter-spacing:.04em}
.hm-note{font-size:12px;color:#78685e;margin-top:4px}
.hm-status{margin-top:12px;padding:8px 10px;border-radius:10px;background:#fcea8b66;font-size:13px}
.hm-name{width:100%;box-sizing:border-box;border:1px solid #211d1d26;border-radius:9px;padding:7px 10px;font:inherit;background:#fff;color:#211d1d}
.hm-chips,.hm-sw{display:flex;flex-wrap:wrap;gap:6px}
.hm-sw{gap:8px}
.hm-sec{border-top:1px solid #211d1d14;margin-top:12px;padding-top:2px}
.hm-sec>summary{cursor:pointer;font-weight:700;font-size:13px;padding:8px 0;list-style:none;display:flex;justify-content:space-between;align-items:center}
.hm-sec>summary::-webkit-details-marker{display:none}
.hm-sec>summary::after{content:"＋";color:#db6a41;font-weight:400}
.hm-sec[open]>summary::after{content:"－"}
.hm-sec>.hm-row:first-of-type{margin-top:2px}
.hm-custom{position:relative;display:inline-block;overflow:hidden;background:conic-gradient(#e8575a,#e8c547,#8fb37a,#58a6a6,#6f7fb5,#b58fd0,#e8575a)}
.hm-custom input{position:absolute;inset:-6px;width:calc(100% + 12px);height:calc(100% + 12px);opacity:0;cursor:pointer;padding:0;border:0}
.hm-range{width:100%;accent-color:#db6a41;margin:2px 0}
.hm-rangeval{float:right;color:#211d1d;font-size:12px}
.hm-chip{border:1px solid #211d1d26;background:#fff;color:#211d1d;border-radius:999px;padding:4px 11px;font:inherit;font-size:13px;cursor:pointer;text-align:left}
.hm-chip[aria-pressed=true],.hm-chip[aria-pressed=true]:hover{background:#db6a41;border-color:#db6a41;color:#fff}
.hm-chip:hover,.hm-ghost:hover{background:#fdf0ea;border-color:#db6a4166}
@media (hover:none){.hm-chip:hover,.hm-ghost:hover{background:#fff;border-color:#211d1d26}}
.hm-ghost[aria-pressed=true]:hover{background:#db6a41;border-color:#db6a41}
/* 前往某處：島名兩欄等寬；選定的島，地點一列一個，收在淺底框裡 */
.hm-chips.grid2{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.hm-chips.grid2 .hm-chip{text-align:center;border-radius:9px;padding:7px 6px;line-height:1.35}
.hm-places{margin-top:10px;padding:10px;border-radius:12px;background:#211d1d0a}
.hm-places .hm-lab{color:#211d1d;font-weight:700}
.hm-chips.list{display:flex;flex-direction:column;gap:6px}
.hm-chips.list .hm-chip{border-radius:9px;padding:7px 11px;width:100%;box-sizing:border-box;line-height:1.35}
.hm-chips.off{opacity:.4;pointer-events:none}
.hm-swb{width:30px;height:30px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px #211d1d33;cursor:pointer;padding:0;flex:none;box-sizing:border-box;min-width:0!important;min-height:0!important;aspect-ratio:1/1}
.hm-swb[aria-pressed=true]{box-shadow:0 0 0 2px #db6a41}
.hm-foot{display:flex;gap:8px;margin-top:16px}
.hm-primary{flex:1;background:#db6a41;color:#fff;border:0;border-radius:9px;padding:9px;font:inherit;font-weight:600;cursor:pointer}
.hm-ghost{background:#fff;color:#211d1d;border:1px solid #211d1d26;border-radius:9px;padding:9px 12px;font:inherit;cursor:pointer}
.hm-ghost[aria-pressed=true]{background:#db6a41;border-color:#db6a41;color:#fff}
.hm-two{display:flex;gap:8px}.hm-two>*{flex:1;padding:8px 6px}
.hm-foot.sticky{position:sticky;bottom:-22px;margin:10px -22px -22px;padding:10px 22px 22px;background:linear-gradient(to bottom,rgba(255,248,244,0),#fff8f4 22%);z-index:2}
.hm-aim{display:flex;gap:14px;align-items:center;justify-content:center;margin-top:10px;flex-wrap:wrap}
.hm-dial{position:relative;width:132px;height:132px;border-radius:50%;border:2px solid #211d1d26;background:#fff;touch-action:none;cursor:pointer;flex:none}
.hm-dial-needle{position:absolute;left:50%;top:50%;width:6px;height:54px;margin:-54px 0 0 -3px;background:#db6a41;border-radius:3px;transform-origin:50% 100%;pointer-events:none}
.hm-dial-needle::after{content:"";position:absolute;left:50%;top:-9px;margin-left:-8px;border:8px solid transparent;border-bottom:12px solid #db6a41;border-top:0}
.hm-dial::before{content:"";position:absolute;left:50%;top:50%;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:50%;background:#211d1d;z-index:1}
.hm-dl{position:absolute;font-size:11px;color:#78685e;pointer-events:none}
.hm-dl.t{left:50%;top:3px;transform:translateX(-50%)}.hm-dl.b{left:50%;bottom:3px;transform:translateX(-50%)}
.hm-dl.l{left:6px;top:50%;transform:translateY(-50%)}.hm-dl.r{right:6px;top:50%;transform:translateY(-50%)}
.hm-spot{display:flex;align-items:center;justify-content:center;font-weight:600;color:#db6a41;border:1px dashed #db6a4180;border-radius:9px;background:#fff}
.hm-flow{border-top:1px solid #211d1d14;padding:4px 0}
.hm-flow summary{cursor:pointer;font-size:13px;padding:3px 0}
.hm-flow summary b{color:#db6a41;margin-right:6px}
.hm-flow .hm-chips{margin:4px 0 6px}
.hm-tag,.hm-say{position:fixed;left:0;top:0;background:rgba(255,248,244,.94);border:1px solid #211d1d26;border-radius:999px;padding:1px 9px;
  font:600 12px/1.6 "Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif;color:#211d1d;pointer-events:none;white-space:nowrap;z-index:20;display:none}
.hm-tag b{color:#db6a41;margin-left:6px;font-weight:600}
.hm-say{border-radius:12px;border-color:#db6a41;white-space:normal;width:max-content;max-width:230px;padding:5px 11px;font-weight:500;z-index:21}
.hm-say b{display:block;color:#db6a41}
.hm-headbtns{display:flex;align-items:center;gap:6px}
.hm-min{display:none}
.hm-sub{display:none;font-size:12px;color:#78685e;margin-top:2px;max-width:230px}
.hm-panel.min .hm-tabs,.hm-panel.min .hm-body{display:none}
.hm-panel.min{padding:8px 12px;max-height:none;overflow:visible}
.hm-panel.min .hm-head{margin-bottom:0}
.hm-panel.min .hm-sub{display:block}
/* 手機：底部抽屜。站方在手機上也用底部抽屜（側邊欄 z17、介紹卡 z16），所以一次只開一個，由腳本互斥 */
@media (max-width:800px){
  .hm-panel{position:fixed;left:0;right:0;top:auto;bottom:calc(60px + env(safe-area-inset-bottom,0px));width:auto;height:52vh;height:52dvh;border-left:0;border-top:3px solid #e5a922;border-radius:22px 22px 0 0;box-shadow:0 -12px 42px #211d1d33;z-index:26;
    padding:20px 18px 20px;transition:transform .22s cubic-bezier(.22,1,.36,1),opacity .18s ease;will-change:transform}
  .hm-panel:not(.open){transform:translate3d(0,calc(100% + 96px + env(safe-area-inset-bottom,0px)),0)!important;visibility:hidden!important;pointer-events:none!important}
  .hm-panel.open{transform:translate3d(0,0,0)!important;visibility:visible!important}
  .hm-panel.loose{height:52vh;height:52dvh}
  .hm-panel.full{bottom:0;height:calc(100dvh - env(safe-area-inset-top,0px) - 8px);padding-bottom:calc(24px + env(safe-area-inset-bottom,0px));z-index:28}
  .hm-panel.min{height:auto;bottom:calc(66px + env(safe-area-inset-bottom,0px));left:10px;right:10px;border-radius:18px;border:1.5px solid #e5a92288;padding:10px 14px;box-shadow:0 8px 26px #211d1d26;z-index:22}
  .hm-panel.min .sheet-handle{display:none!important}
  .hm-eyebrow{margin-bottom:4px}
  .hm-title{font-size:20px}
  .hm-foot.sticky{bottom:-16px;margin:10px -20px -16px;padding:10px 20px 16px}
  .hm-min{display:inline-block}
}
/* 觸控：放大點擊範圍；輸入框 16px 以上，iOS 才不會在聚焦時自動放大頁面 */
@media (max-width:800px),(pointer:coarse){
  .hm-chip{padding:9px 14px;font-size:14px}
  .hm-swb{width:38px;height:38px}
  .hm-ghost,.hm-primary{padding:11px 12px;min-height:44px}
  .hm-tab{padding:11px 0}
  .hm-x{min-width:44px;min-height:44px}
  .hm-name{font-size:16px;padding:10px 12px}
  .hm-flow summary{padding:9px 0}
  .hm-sw{gap:10px}
  .hm-range{height:32px}
}
/* 矮視窗（手機橫放只有約 440px 高）；必須寫在觸控樣式之後，同優先級後寫的才會贏：面板只剩 340px，選項縮緊湊一點，不然要捲將近 5 屏；點擊範圍仍維持約 34px 以上 */
@media (max-height:520px){
  .hm-panel{padding:10px 12px}
  .hm-title{font-size:16px}
  .hm-row{margin-top:7px}
  .hm-lab{margin-bottom:3px}
  .hm-chips{gap:5px}
  /* 站方在觸控裝置有一條全域 button{min-height:44px}，要明確歸零才縮得動 */
  .hm-chip,.hm-swb,.hm-tab,.hm-ghost,.hm-primary,.hm-sec>summary{min-height:0}
  .hm-chip{padding:5px 11px;font-size:13px}
  .hm-swb{width:30px;height:30px;min-width:0}
  .hm-sw{gap:7px}
  .hm-ghost,.hm-primary{padding:6px 10px;min-height:34px}
  .hm-tab{padding:6px 0}
  .hm-name{padding:6px 10px}
  .hm-sec>summary{padding:6px 0}
  .hm-note{margin-top:2px}
  /* 定點站立的羅盤縮小；黏底按鈕的位移對應緊湊的內距 */
  .hm-aim{gap:10px;margin-top:6px}
  .hm-dial{width:108px;height:108px}
  .hm-dial-needle{height:44px;margin-top:-44px}
  .hm-foot.sticky{bottom:-10px;margin:8px -12px -10px;padding:8px 12px 10px}
}
/* ── 五星級奢華酒店禮賓美學覆寫與雙手人體工學分離式 HUD (The Grand NKUHT Split Gamepad Edition) ── */
.hm-panel{background:linear-gradient(180deg,#faf7f0 0%,#f0e8d7 100%)!important;border-left:1.5px solid rgba(198,161,91,.65)!important}
.hm-head{background:repeating-linear-gradient(45deg,rgba(198,161,91,.035) 0 1px,transparent 1px 14px),linear-gradient(165deg,#0b1614 0%,#132722 58%,#182320 100%)!important;
  margin:-28px -22px 14px!important;padding:22px 20px 16px!important;border-bottom:2px solid #c6a15b!important;color:#faf6ed!important}
.hm-eyebrow{color:#e6ca8a!important;letter-spacing:.2em!important}
.hm-title{font-family:"Noto Serif TC",Georgia,serif!important;color:#faf6ed!important;letter-spacing:.06em}
.hm-x:not(.hm-min){color:transparent!important;font-size:0!important;line-height:0!important}
.hm-x.hm-min{color:#e6ca8a!important}
.hm-tabs{background:#0f1f1c!important;border:1px solid rgba(198,161,91,.45)!important;border-radius:9px!important;padding:4px!important}
.hm-tab{color:#d5c8b0!important;border-radius:6px!important}
.hm-tab[aria-selected="true"]{background:linear-gradient(135deg,#ebd094 0%,#c49b4d 100%)!important;color:#0c1614!important;font-weight:800!important}
.hm-chip,.hm-ghost{border-radius:7px!important;border:1px solid rgba(198,161,91,.45)!important;background:#fff!important;color:#12211e!important}
.hm-chip[aria-pressed="true"],.hm-ghost[aria-pressed="true"],.hm-primary{background:linear-gradient(135deg,#0f1f1c 0%,#1c352f 100%)!important;color:#e6ca8a!important;border-color:#c6a15b!important}
#hm-drive[aria-pressed=true]{background:linear-gradient(135deg,#ebd094 0%,#c49b4d 100%)!important;color:#0c1614!important;border-color:#fff!important;box-shadow:0 4px 14px rgba(198,161,91,.45)!important}

/* 分離式 RPG HUD 容器：不阻擋中央 3D 視野，僅子按鈕吃事件 */
.hm-pad{position:fixed;inset:0;z-index:24;display:none;pointer-events:none;user-select:none;-webkit-user-select:none;
  font:600 12px/1.35 "Noto Sans TC","PingFang TC",sans-serif;color:#faf6ed}
.hm-pad.open{display:block}

/* 1. 頂部精簡禮賓狀態膠囊 */
.hm-hud-top{position:fixed;top:82px;left:calc((100vw - 318px) / 2);transform:translateX(-50%);pointer-events:auto;
  display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:center;max-width:calc(100vw - 24px);
  background:linear-gradient(160deg,rgba(12,23,20,.92),rgba(20,37,32,.92));border:1.5px solid rgba(208,172,102,.72);
  border-radius:999px;padding:5px 10px;box-shadow:0 10px 28px rgba(8,15,13,.36);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);
  transition:left .2s ease,opacity .2s ease,transform .2s ease}
.sidebar-hidden .hm-hud-top{left:50%}
.hm-rpg-isl{font-size:11.5px;font-weight:800;color:#c6f2df;background:rgba(37,165,106,.22);border:1px solid rgba(72,199,142,.45);border-radius:999px;padding:3px 9px;max-width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hm-rpg-lvl{min-height:26px!important;height:26px;padding:0 9px!important;border-radius:999px!important;border:1px solid rgba(230,202,138,.65)!important;background:rgba(230,202,138,.16)!important;color:#f7dfa0!important;font:800 11px/1 "Noto Sans TC",sans-serif!important;cursor:pointer;display:inline-flex;align-items:center;gap:4px}
.hm-rpg-lvl:hover{background:rgba(230,202,138,.3)!important}
.hm-top-pill{min-height:26px!important;height:26px;padding:0 9px!important;border-radius:999px!important;border:1px solid rgba(198,161,91,.5)!important;background:rgba(255,255,255,.08)!important;color:#f3e7cb!important;font:700 11px/1 "Noto Sans TC",sans-serif!important;cursor:pointer;display:inline-flex;align-items:center;gap:4px}
.hm-top-pill:hover{background:rgba(230,202,138,.22)!important;border-color:#ebd094!important}
.hm-tp-sel{appearance:none;-webkit-appearance:none;max-width:136px;padding-right:18px!important;background-image:linear-gradient(45deg,transparent 50%,#e6ca8a 50%),linear-gradient(135deg,#e6ca8a 50%,transparent 50%)!important;background-position:calc(100% - 11px) 50%,calc(100% - 7px) 50%!important;background-size:4px 4px,4px 4px!important;background-repeat:no-repeat!important}
.hm-tp-sel option{background:#0f1f1c;color:#faf6ed;font-weight:700}
.hm-top-pill.exit{background:rgba(219,106,65,.22)!important;border-color:rgba(219,106,65,.65)!important;color:#ffd8c8!important}
.hm-top-pill.exit:hover{background:#db6a41!important;color:#fff!important}

/* 2. 左下角：動態浮動 360° 類比虛擬搖桿熱區（點哪裡搖桿中心就吸附在哪裡） */
.hm-stick-zone{position:fixed;left:332px;bottom:20px;width:132px;height:132px;pointer-events:auto;touch-action:none;
  display:flex;align-items:center;justify-content:center;border-radius:26px;transition:left .2s ease,opacity .2s ease}
.qp-hud.min ~ .hm-pad .hm-stick-zone,body:has(.qp-hud.min) .hm-stick-zone{left:24px;bottom:64px}
.hm-joy{position:relative;width:96px;height:96px;border-radius:50%;
  background:radial-gradient(circle,rgba(230,202,138,.16) 0%,rgba(12,24,21,.76) 72%);
  border:1.8px solid rgba(208,172,102,.68);box-shadow:0 8px 24px rgba(0,0,0,.32),inset 0 2px 10px rgba(0,0,0,.45);
  -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);cursor:grab;opacity:.84;
  transition:opacity .18s ease,border-color .18s ease,box-shadow .18s ease}
.hm-joy::before{content:"";position:absolute;inset:16px;border-radius:50%;border:1px dashed rgba(230,202,138,.32);pointer-events:none}
.hm-joy.dragging{opacity:1;cursor:grabbing;border-color:#f5d33a;box-shadow:0 10px 28px rgba(0,0,0,.44),0 0 0 3px rgba(245,211,58,.2)}
.hm-joy.sprinting{border-color:#ff944d;box-shadow:0 10px 30px rgba(219,106,65,.45),0 0 0 4px rgba(245,211,58,.32)}
.hm-joy-ring{position:absolute;inset:-4px;border-radius:50%;border:2px solid transparent;pointer-events:none;transition:opacity .12s}
.hm-joy.dragging .hm-joy-ring{border-top-color:#f5d33a;opacity:.92}
.hm-joy-nub{position:absolute;left:50%;top:50%;width:38px;height:38px;margin:-19px 0 0 -19px;border-radius:50%;
  background:linear-gradient(145deg,#f7dfa0,#b88938);border:2px solid #fff8e6;box-shadow:0 4px 12px rgba(0,0,0,.48);
  pointer-events:none;display:flex;align-items:center;justify-content:center;font-size:13px;color:#0c1614;font-weight:900;transition:transform .06s ease-out}
.hm-joy.dragging .hm-joy-nub{transition:none;background:linear-gradient(145deg,#ffe999,#db6a41);color:#fff}
.hm-kb-pills{position:absolute;bottom:-4px;left:50%;transform:translateX(-50%);display:flex;gap:3px;pointer-events:none}
.hm-kb-pill{font:800 9.5px/1 ui-monospace,monospace;padding:2px 5px;border-radius:4px;background:rgba(12,23,20,.86);border:1px solid rgba(208,172,102,.45);color:#c9b489}
.hm-kb-pill.on{background:#ebd094;color:#0c1614;border-color:#fff}

/* 3. 中下方情境互動提示膠囊（靠近師長／學長姐／玩家／建築時浮現） */
.hm-near-bar{position:fixed;left:calc((100vw - 318px) / 2);bottom:24px;transform:translateX(-50%) translateY(8px);
  pointer-events:none;opacity:0;display:flex;align-items:center;gap:6px;z-index:26;max-width:calc(100vw - 24px);
  transition:opacity .18s ease,transform .18s cubic-bezier(.2,1,.3,1)}
.sidebar-hidden .hm-near-bar{left:50%}
.hm-near-bar.show{opacity:1;pointer-events:auto;transform:translateX(-50%) translateY(0)}
.hm-pad-near{min-height:40px!important;padding:8px 16px!important;border-radius:999px!important;border:2px solid #f5d33a!important;
  background:linear-gradient(135deg,#0f221e 0%,#1d3b34 100%)!important;color:#fff8e8!important;
  font:800 13px/1.2 "Noto Sans TC",sans-serif!important;cursor:pointer;display:inline-flex;align-items:center;gap:7px;
  box-shadow:0 10px 28px rgba(8,15,13,.48),0 0 0 3px rgba(245,211,58,.24);animation:hmNearPulse 1.8s ease-in-out infinite}
.hm-pad-near kbd{background:linear-gradient(135deg,#ffe27a,#db6a41);color:#0c1614;border-radius:6px;padding:2px 6px;font:900 11px/1 ui-monospace,monospace}
.hm-pad-near-alt{min-height:38px!important;padding:7px 12px!important;border-radius:999px!important;border:1.5px solid rgba(230,202,138,.75)!important;
  background:rgba(255,252,244,.95)!important;color:#12211e!important;font:800 12px/1 "Noto Sans TC",sans-serif!important;cursor:pointer;box-shadow:0 6px 18px rgba(8,15,13,.25)}
.hm-pad-near-alt:hover{background:#ffe9a8!important}
@keyframes hmNearPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.025)}}

/* 4. 右下角：扇形直覺動作鍵群（主互動鍵 + 跳躍／衝刺／表情） */
.hm-act-cluster{position:fixed;right:336px;bottom:66px;pointer-events:auto;display:flex;flex-direction:column;align-items:flex-end;gap:8px;transition:right .2s ease,opacity .2s ease}
.sidebar-hidden .hm-act-cluster{right:20px}
body.hm-docked .sidebar-hidden .hm-act-cluster,body.log-open .sidebar-hidden .hm-act-cluster{right:336px}
.hm-act-row{display:flex;align-items:flex-end;gap:8px}
.hm-act-sub{width:46px;height:46px;min-height:46px!important;padding:0!important;border-radius:50%!important;
  border:1.5px solid rgba(208,172,102,.65)!important;background:linear-gradient(165deg,rgba(22,42,37,.92),rgba(11,22,19,.94))!important;
  color:#f3e7cb!important;font:800 11px/1.05 "Noto Sans TC",sans-serif!important;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;
  cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.34);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);transition:transform .1s,background .15s}
.hm-act-sub i{font-style:normal;font-size:15px;line-height:1}
.hm-act-sub small{font-size:9px;color:#d6c094;font-weight:700;line-height:1}
.hm-act-sub:active{transform:scale(.92)}
.hm-act-sub[aria-pressed=true]{background:linear-gradient(135deg,#ebd094,#c49b4d)!important;color:#0c1614!important;border-color:#fff!important;box-shadow:0 6px 20px rgba(229,169,34,.45)}
.hm-act-sub[aria-pressed=true] small{color:#0c1614!important}
.hm-act-main{width:64px;height:64px;min-height:64px!important;padding:0!important;border-radius:50%!important;
  border:2px solid rgba(235,208,148,.85)!important;background:linear-gradient(145deg,#18342e,#0b1916)!important;
  color:#f7dfa0!important;font:900 12px/1.1 "Noto Sans TC",sans-serif!important;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;
  cursor:pointer;box-shadow:0 10px 26px rgba(0,0,0,.42),inset 0 1px 0 rgba(255,255,255,.2);transition:transform .12s,box-shadow .2s,background .2s}
.hm-act-main i{font-style:normal;font-size:20px;line-height:1}
.hm-act-main small{font-size:9.5px;color:#ebd094;font-weight:800}
.hm-act-main:active{transform:scale(.93)}
.hm-act-main.ready{background:linear-gradient(135deg,#ffe27a 0%,#db6a41 100%)!important;color:#0c1614!important;border-color:#fff!important;
  box-shadow:0 10px 28px rgba(219,106,65,.52),0 0 0 4px rgba(245,211,58,.32);animation:hmNearPulse 1.5s ease-in-out infinite}
.hm-act-main.ready small{color:#0c1614!important}

/* 表情與禮賓動作快捷輪盤 */
.hm-emote-pop{position:fixed;right:336px;bottom:140px;z-index:27;pointer-events:auto;display:none;flex-wrap:wrap;gap:6px;max-width:250px;justify-content:flex-end;
  background:linear-gradient(160deg,rgba(12,23,20,.96),rgba(20,37,32,.96));border:1.5px solid rgba(208,172,102,.75);border-radius:16px;padding:8px;box-shadow:0 14px 34px rgba(0,0,0,.45)}
.sidebar-hidden .hm-emote-pop{right:20px}
.hm-emote-pop.open{display:flex}
.hm-emote-btn{min-height:32px!important;padding:5px 10px!important;border-radius:999px!important;border:1px solid rgba(208,172,102,.5)!important;
  background:rgba(255,255,255,.08)!important;color:#faf6ed!important;font:700 12px/1 "Noto Sans TC",sans-serif!important;cursor:pointer}
.hm-emote-btn:hover{background:linear-gradient(135deg,#ebd094,#c49b4d)!important;color:#0c1614!important;border-color:#fff!important}

.hm-xp-pop{position:fixed;left:0;top:0;z-index:29;pointer-events:none;background:linear-gradient(135deg,#ffe27a,#db6a41);color:#0c1614;border:1.5px solid #fff;border-radius:999px;padding:3px 11px;font:900 12.5px/1.3 "Noto Sans TC",sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.32);white-space:nowrap;animation:hmXpFloat 1.45s cubic-bezier(.18,.88,.32,1) forwards}
@keyframes hmXpFloat{0%{opacity:0;transform:translate(-50%,0) scale(.75)}18%{opacity:1;transform:translate(-50%,-14px) scale(1.06)}100%{opacity:0;transform:translate(-50%,-54px) scale(.94)}}

@media (max-width:1060px) and (min-width:801px){
  .hm-stick-zone{left:24px;bottom:168px}
}
@media (max-width:800px){
  .hm-hud-top{top:calc(var(--brand-bottom,54px) + 5px);left:50%;width:calc(100vw - 14px);max-width:430px;flex-wrap:wrap;justify-content:center;
    border-radius:15px;padding:5px 6px;gap:4px;z-index:19;-webkit-backdrop-filter:none;backdrop-filter:none;
    background:linear-gradient(165deg,rgba(12,23,20,.96),rgba(19,36,31,.96))}
  .hm-rpg-isl,.hm-rpg-lvl{display:none!important}
  .hm-tp-sel{order:1;flex:1 1 112px;max-width:none;min-width:0;height:28px;min-height:28px!important;font-size:11px!important;padding:0 18px 0 8px!important}
  .hm-lm-sel{order:2}
  .hm-top-pill.exit{order:3;flex:0 0 auto;height:28px;min-height:28px!important;padding:0 10px!important;background:rgba(219,106,65,.34)!important;border-color:#ff9c78!important;color:#fff!important;font-weight:800!important}
  .hm-hud-top > button.hm-top-pill:not(.exit){order:4;flex:1 1 auto;justify-content:center;height:27px;min-height:27px!important;padding:0 7px!important;font-size:10.5px!important}
  .hm-stick-zone{left:8px;bottom:calc(66px + env(safe-area-inset-bottom,0px));width:124px;height:124px;z-index:19}
  .hm-joy{width:88px;height:88px;-webkit-backdrop-filter:none;backdrop-filter:none;background:radial-gradient(circle,rgba(230,202,138,.2) 0%,rgba(12,24,21,.88) 74%)}
  .hm-joy-nub{width:34px;height:34px;margin:-17px 0 0 -17px;font-size:12px}
  .hm-kb-pills{display:none}
  .hm-act-cluster{right:10px;bottom:calc(68px + env(safe-area-inset-bottom,0px));gap:6px;z-index:19}
  .hm-act-row{gap:6px}
  .hm-act-sub{width:42px;height:42px;min-height:42px!important;-webkit-backdrop-filter:none;backdrop-filter:none;touch-action:manipulation}
  .hm-act-sub i{font-size:14px}
  .hm-act-sub small{font-size:8.5px}
  .hm-act-main{width:56px;height:56px;min-height:56px!important;touch-action:manipulation}
  .hm-act-main i{font-size:18px}
  .hm-act-main small{font-size:9px}
  .hm-emote-pop{right:10px;bottom:calc(182px + env(safe-area-inset-bottom,0px));z-index:27}
  .hm-near-bar{left:50%;bottom:calc(196px + env(safe-area-inset-bottom,0px));max-width:calc(100vw - 20px);width:max-content}
  .hm-pad-near{min-height:36px!important;padding:6px 13px!important;font-size:12px!important;max-width:66vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .hm-pad-near-alt{min-height:34px!important;padding:6px 10px!important;font-size:11.5px!important}
  body.log-open .hm-pad,
  body.m-time .hm-pad,
  body:has(.sidebar.mobile-open) .hm-pad,
  body:has(.hm-panel.open:not(.min)) .hm-pad{opacity:0;pointer-events:none}
  body.card-open .hm-near-bar,
  body.card-open .hm-stick-zone,
  body.card-open .hm-act-cluster{opacity:0;pointer-events:none}
}
@media (max-width:920px) and (max-height:520px){
  .hm-hud-top{top:calc(var(--brand-bottom,44px) + 4px);width:auto;max-width:calc(100vw - 16px);flex-wrap:nowrap;overflow-x:auto;border-radius:999px;padding:3px 7px}
  .hm-rpg-isl,.hm-rpg-lvl{display:none!important}
  .hm-stick-zone{left:10px;bottom:calc(54px + env(safe-area-inset-bottom,0px));width:106px;height:106px}
  .hm-joy{width:76px;height:76px}
  .hm-act-cluster{right:10px;bottom:calc(56px + env(safe-area-inset-bottom,0px));gap:5px}
  .hm-act-sub{width:38px;height:38px;min-height:38px!important}
  .hm-act-main{width:50px;height:50px;min-height:50px!important}
  .hm-near-bar{left:50%;bottom:calc(58px + env(safe-area-inset-bottom,0px));max-width:calc(100vw - 250px)}
}
`;

  const NAMECARD_CSS = `
.hm-namecard-bg{position:fixed;inset:0;z-index:90;display:grid;place-items:center;padding:16px;background:rgba(10,18,16,.55)}
.hm-namecard{width:min(380px,100%);background:#fffdf8;color:#12211e;border:1px solid #c6a15b;border-radius:16px;padding:18px 18px 16px;box-shadow:0 18px 50px rgba(0,0,0,.35);font:14px/1.5 "Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif}
.hm-namecard-title{margin:0 0 6px;font-size:17px;font-weight:800;color:#12211e}
.hm-namecard-note{margin:0 0 12px;font-size:12.5px;color:#4a514e}
.hm-namecard-row{display:flex;gap:8px;margin-bottom:12px}
.hm-namecard-input{flex:1;min-width:0;min-height:44px;border:1.5px solid #c6a15b;border-radius:10px;padding:0 12px;font:inherit;font-size:16px;color:#12211e;background:#fff}
.hm-namecard-input:focus-visible{outline:3px solid #0f766e;outline-offset:1px}
.hm-namecard-acts{display:flex;gap:8px;justify-content:flex-end}
.hm-namecard .hm-ghost,.hm-namecard .hm-primary{min-height:44px;padding:0 16px;flex:none}
.hm-namecard .hm-primary{min-width:96px}
.hm-namecard .hm-primary[disabled]{opacity:.6;cursor:wait}
.hm-linkbtn{all:unset;display:block;margin-top:12px;font-size:12.5px;color:#0f766e;text-decoration:underline;cursor:pointer;min-height:24px}
.hm-linkbtn:focus-visible{outline:3px solid #0f766e;outline-offset:2px;border-radius:4px}
.hm-xfer-code{margin:6px 0 4px;padding:12px;border-radius:12px;background:#0f1f1c;color:#e6ca8a;text-align:center;font:800 26px/1.2 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.12em;user-select:all}
.hm-xfer-input{text-transform:uppercase;letter-spacing:.1em;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.hm-xfer-acts{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
.hm-xfer-acts .hm-ghost{padding:6px 10px;font-size:12px}
.hm-move{position:fixed;z-index:80;top:calc(var(--toolbar-bottom,58px) + 10px);left:50%;transform:translateX(-50%);width:min(560px,calc(100% - 24px));box-sizing:border-box;display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:12px 44px 12px 14px;background:#fffdf8;color:#12211e;border:1.5px solid #c6a15b;border-radius:14px;box-shadow:0 14px 36px rgba(0,0,0,.28);font:13px/1.5 "Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif}
.hm-move-text{flex:1 1 260px;display:flex;flex-direction:column;gap:2px}
.hm-move-text b{font-size:14.5px}
.hm-move-text span{color:#3d4542;font-size:12.5px}
.hm-move-acts{display:flex;gap:8px;flex-wrap:wrap}
.hm-move .hm-ghost,.hm-move .hm-primary{min-height:40px;padding:0 14px;display:inline-flex;align-items:center;text-decoration:none;flex:none}
.hm-move-x{position:absolute;top:6px;right:6px;width:34px;height:34px;border:0;border-radius:8px;background:transparent;color:#12211e;font-size:22px;line-height:1;cursor:pointer}
.hm-move-x:hover,.hm-move-x:focus-visible{background:rgba(198,161,91,.18)}
@media (max-width:800px){.hm-move{top:auto;bottom:calc(76px + env(safe-area-inset-bottom,0px))}}
`;
  const hex = (n) => '#' + n.toString(16).padStart(6, '0');
  const h = (tag, props = {}, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v);
    }
    for (const kid of kids) el.append(kid);
    return el;
  };

  // ── 角色轉移碼：把暱稱、外觀、護照進度與廣場偏好帶到另一台裝置（不含廣場身分金鑰 htl-plaza-ident）。
  // 轉移碼只在瀏覽器產生；以 PBKDF2 導出 AES-GCM 金鑰與「查詢代號」，伺服器只保存代號與密文，讀不到內容。
  // 轉移碼與代號都只放在 POST 內容，不進網址；10 分鐘內有效、只能取一次。
  const XFER_KEYS = ['heart-me:v1', 'htl-passport:v1', 'htl-plaza-dm-off', 'htl-plaza-blocked', 'htl-plaza-muted'];
  const XFER_ABC = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'; // 去掉 0/O、1/I/L 等易混淆字元（31 字）
  const XFER_LEN = 12;
  const newXferCode = () => {
    let out = '';
    const buf = new Uint8Array(16);
    while (out.length < XFER_LEN) {
      crypto.getRandomValues(buf);
      for (const b of buf) if (b < 248 && out.length < XFER_LEN) out += XFER_ABC[b % 31]; // 拒絕取樣，避免偏差
    }
    return out;
  };
  const fmtXferCode = (c) => c.match(/.{1,4}/g).join('-');
  const normXferCode = (v) => String(v || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
  const validXferCode = (c) => c.length === XFER_LEN && [...c].every((ch) => XFER_ABC.includes(ch));
  const b64 = (bytes) => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(s); };
  const unb64 = (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
  async function deriveXfer(code) {
    const enc = new TextEncoder();
    const base = await crypto.subtle.importKey('raw', enc.encode(code), 'PBKDF2', false, ['deriveBits']);
    const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode('htl-xfer-v1'), iterations: 150000, hash: 'SHA-256' }, base, 512));
    const key = await crypto.subtle.importKey('raw', bits.slice(0, 32), 'AES-GCM', false, ['encrypt', 'decrypt']);
    const slot = [...bits.slice(32)].map((b) => b.toString(16).padStart(2, '0')).join('');
    return { key, slot };
  }
  // 只連官方伺服器或本機開發伺服器（不送往其他位址，與 R-06 一致）
  const xferEndpoint = () => {
    try {
      const u = new URL(String(window.htlSocial?.getWsState?.().url || '').replace(/^ws/i, 'http'));
      if (/^(localhost|127\.\d+\.\d+\.\d+)$/.test(u.hostname)) return `${u.protocol}//${u.host}/xfer`;
    } catch (e) { /* 使用官方伺服器 */ }
    return 'https://htl-island-plaza.dr-jacqueshsu.workers.dev/xfer';
  };
  async function xferPost(body) {
    const res = await fetch(xferEndpoint(), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer',
    });
    let data = {};
    try { data = await res.json(); } catch (e) { /* 略過 */ }
    return { status: res.status, data };
  }
  async function exportProfile() {
    const items = {};
    for (const k of XFER_KEYS) { try { const v = localStorage.getItem(k); if (v != null) items[k] = v; } catch (e) { /* 略過 */ } }
    const plain = new TextEncoder().encode(JSON.stringify({ v: 1, items }));
    const code = newXferCode();
    const { key, slot } = await deriveXfer(code);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain));
    const packed = new Uint8Array(iv.length + ct.length);
    packed.set(iv);
    packed.set(ct, iv.length);
    const data = b64(packed);
    if (data.length > 24 * 1024) throw new Error('too-large');
    const r = await xferPost({ op: 'put', slot, data });
    if (r.status !== 200) throw new Error(r.data?.reason || 'server');
    return code;
  }
  // 解密後逐項檢查格式，只接受固定的 5 個鍵；寫入前由使用者確認
  function checkProfile(obj) {
    if (!obj || obj.v !== 1 || !obj.items || typeof obj.items !== 'object') return null;
    const out = {};
    for (const [k, v] of Object.entries(obj.items)) {
      if (!XFER_KEYS.includes(k) || typeof v !== 'string' || v.length > 20000) return null;
      if (k === 'htl-plaza-dm-off') { if (v !== '1') return null; }
      else {
        let parsed;
        try { parsed = JSON.parse(v); } catch (e) { return null; }
        const wantArray = k === 'htl-plaza-blocked' || k === 'htl-plaza-muted';
        if (wantArray ? !Array.isArray(parsed) : (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))) return null;
      }
      out[k] = v;
    }
    return out;
  }
  async function importProfile(code) {
    const { key, slot } = await deriveXfer(code);
    const r = await xferPost({ op: 'take', slot });
    if (r.status === 404) throw new Error('not-found');
    if (r.status === 429) throw new Error('rate');
    if (r.status !== 200 || typeof r.data?.data !== 'string') throw new Error('server');
    const packed = unb64(r.data.data);
    let plain;
    try { plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: packed.slice(0, 12) }, key, packed.slice(12)); } catch (e) { throw new Error('decrypt'); }
    const items = checkProfile(JSON.parse(new TextDecoder().decode(plain)));
    if (!items) throw new Error('format');
    return items;
  }

  // 共用的小卡外框（取名、轉移都用）：焦點留在卡內、Esc 關閉、點背景關閉
  function openCard(titleText, build) {
    document.querySelector('.hm-namecard-bg')?.remove();
    const prevFocus = document.activeElement;
    const card = h('div', { class: 'hm-namecard', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'hm-card-title' });
    const bg = h('div', { class: 'hm-namecard-bg', onclick: (e) => { if (e.target === bg) close(); } }, card);
    const close = () => { bg.remove(); try { prevFocus?.focus?.(); } catch (e) { /* 略過 */ } };
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
      else if (e.key === 'Tab') {
        const f = [...card.querySelectorAll('button, input')].filter((el) => !el.disabled && el.offsetParent);
        const i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1]?.focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0]?.focus(); }
      }
    });
    const body = h('div', {});
    card.append(h('h2', { id: 'hm-card-title', class: 'hm-namecard-title' }, titleText), body);
    document.body.append(bg);
    build(body, close);
    (card.querySelector('input, .hm-primary') || card.querySelector('button'))?.focus();
    return close;
  }
  const xferError = (err, t) => ({
    'not-found': t('找不到這組轉移碼：可能輸入錯誤、已超過 10 分鐘，或已經用過。', 'Code not found: it may be mistyped, older than 10 minutes, or already used.'),
    rate: t('嘗試太多次，請稍候一分鐘再試。', 'Too many attempts. Please wait a minute.'),
    decrypt: t('轉移碼不正確。', 'That code is not correct.'),
    format: t('資料格式不正確，已停止匯入。', 'The data is not in the expected format; nothing was imported.'),
    'too-large': t('資料太大，無法轉移。', 'Too much data to transfer.'),
    busy: t('伺服器忙碌中，請稍後再試。', 'The server is busy. Please try again later.'),
  })[err?.message] || t('連線失敗，請確認網路後再試。', 'Could not reach the server. Please check your connection.');

  function openXferExport() {
    const t = (zh, en) => (isEnUI() ? en : zh);
    openCard(t('轉移角色到其他裝置', 'Move your character to another device'), (body, close) => {
      const note = h('p', { class: 'hm-namecard-note' },
        t('產生一組轉移碼，在另一台裝置的「角色 → 輸入轉移碼」輸入，就能帶過去暱稱、外觀、護照進度與廣場設定。轉移碼 10 分鐘內有效、只能用一次。請只給自己使用，不要分享給別人。',
          'Get a one-time code and enter it on your other device under Avatar → Enter transfer code to bring over your name, look, passport progress and plaza settings. It works once, within 10 minutes. Keep it to yourself.'));
      const status = h('p', { class: 'hm-namecard-note', role: 'status', 'aria-live': 'polite' });
      const goBtn = h('button', { class: 'hm-primary', type: 'button' }, t('產生轉移碼', 'Get a code'));
      const closeBtn = h('button', { class: 'hm-ghost', type: 'button', onclick: () => close() }, t('關閉', 'Close'));
      const acts = h('div', { class: 'hm-namecard-acts' }, closeBtn, goBtn);
      goBtn.addEventListener('click', async () => {
        goBtn.disabled = true;
        status.textContent = t('產生中…', 'Working…');
        try {
          const code = await exportProfile();
          const until = Date.now() + 10 * 60 * 1000;
          const codeEl = h('div', { class: 'hm-xfer-code', 'aria-label': t('轉移碼', 'Transfer code') }, fmtXferCode(code));
          const timer = h('p', { class: 'hm-namecard-note' });
          const tick = () => {
            const left = Math.max(0, until - Date.now());
            timer.textContent = left ? t(`剩餘 ${Math.floor(left / 60000)}:${String(Math.floor(left / 1000) % 60).padStart(2, '0')}`, `${Math.floor(left / 60000)}:${String(Math.floor(left / 1000) % 60).padStart(2, '0')} left`) : t('已過期，請重新產生。', 'Expired — get a new code.');
            if (left && document.body.contains(timer)) setTimeout(tick, 1000);
          };
          tick();
          const copyBtn = h('button', { class: 'hm-ghost', type: 'button', onclick: async () => {
            try { await navigator.clipboard.writeText(code); copyBtn.textContent = t('已複製', 'Copied'); } catch (e) { copyBtn.textContent = t('請手動抄寫', 'Copy by hand'); }
          } }, t('複製', 'Copy'));
          status.textContent = '';
          body.replaceChildren(note, codeEl, timer, h('div', { class: 'hm-namecard-acts' }, copyBtn, h('button', { class: 'hm-primary', type: 'button', onclick: () => close() }, t('完成', 'Done'))));
          body.querySelector('.hm-primary').focus();
        } catch (err) {
          status.textContent = xferError(err, t);
          goBtn.disabled = false;
        }
      });
      body.append(note, status, acts);
    });
  }

  function openXferImport() {
    const t = (zh, en) => (isEnUI() ? en : zh);
    markNameAsked();
    openCard(t('從其他裝置轉移角色', 'Bring your character from another device'), (body, close) => {
      const note = h('p', { class: 'hm-namecard-note' }, t('在原本的裝置按「角色 → 轉移到其他裝置」取得 12 碼轉移碼，再輸入到這裡。', 'On your other device choose Avatar → Move to another device to get a 12-character code, then enter it here.'));
      const input = h('input', { class: 'hm-namecard-input hm-xfer-input', type: 'text', maxlength: '20', autocomplete: 'off', spellcheck: 'false', autocapitalize: 'characters', inputmode: 'text', placeholder: 'XXXX-XXXX-XXXX', 'aria-label': t('轉移碼', 'Transfer code') });
      const status = h('p', { class: 'hm-namecard-note', role: 'status', 'aria-live': 'polite' });
      const goBtn = h('button', { class: 'hm-primary', type: 'submit' }, t('取回', 'Retrieve'));
      const form = h('form', { onsubmit: async (e) => {
        e.preventDefault();
        const code = normXferCode(input.value);
        if (!validXferCode(code)) { status.textContent = t('請輸入 12 碼轉移碼（英文字母與數字）。', 'Enter the 12-character code (letters and digits).'); return; }
        goBtn.disabled = true;
        status.textContent = t('取回中…', 'Retrieving…');
        try {
          const items = await importProfile(code);
          let who = '';
          try { who = String(JSON.parse(items['heart-me:v1'] || '{}').name || '').slice(0, 10); } catch (err) { /* 略過 */ }
          let xp = 0;
          try { xp = Math.max(0, Math.floor(Number(JSON.parse(items['htl-passport:v1'] || '{}').xp) || 0)); } catch (err) { /* 略過 */ }
          const ask = h('p', { class: 'hm-namecard-note' });
          ask.textContent = t(`要用「${who || '（未命名）'}」（${xp} XP）取代這台裝置上的角色與護照進度嗎？`, `Replace the character and passport on this device with "${who || '(unnamed)'}" (${xp} XP)?`);
          const apply = () => {
            try {
              for (const k of XFER_KEYS) { if (k in items) localStorage.setItem(k, items[k]); else localStorage.removeItem(k); }
              localStorage.setItem(NAME_ASKED_KEY, '1');
            } catch (err) { status.textContent = t('無法寫入瀏覽器儲存空間（可能是無痕模式）。', 'Could not save (private browsing?).'); return; }
            location.reload();
          };
          body.replaceChildren(ask, h('div', { class: 'hm-namecard-acts' },
            h('button', { class: 'hm-ghost', type: 'button', onclick: () => close() }, t('取消', 'Cancel')),
            h('button', { class: 'hm-primary', type: 'button', onclick: apply }, t('取代並重新載入', 'Replace & reload'))));
          body.querySelector('.hm-primary').focus();
        } catch (err) {
          status.textContent = xferError(err, t);
          goBtn.disabled = false;
        }
      } },
        h('div', { class: 'hm-namecard-row' }, input),
        status,
        h('div', { class: 'hm-namecard-acts' }, h('button', { class: 'hm-ghost', type: 'button', onclick: () => close() }, t('取消', 'Cancel')), goBtn));
      body.append(note, form);
    });
  }

  // ── 舊網址搬家提示：只在 htl-island-navigator.pages.dev 顯示一次（可關閉）。瀏覽器依網址分開保存資料，
  // 所以提醒使用者先用「角色轉移碼」把角色帶到新網址；不強制跳轉，舊連結與 QR code 仍可使用。
  const NEW_SITE = 'https://nkuht-htl.drmjhsu.com';
  const OLD_HOST = 'htl-island-navigator.pages.dev';
  const MOVE_KEY = 'htl-move-notice-v1';
  function showMoveNotice() {
    if (location.hostname !== OLD_HOST || document.querySelector('.hm-move')) return;
    try { if (localStorage.getItem(MOVE_KEY) === '1') return; } catch (e) { return; }
    const t = (zh, en) => (isEnUI() ? en : zh);
    const dismiss = () => { try { localStorage.setItem(MOVE_KEY, '1'); } catch (e) { /* 略過 */ } bar.remove(); };
    const go = h('a', { class: 'hm-primary hm-move-go', href: NEW_SITE + location.pathname + location.search, rel: 'noopener' }, t('前往新網址', 'Go to the new address'));
    const xfer = h('button', { class: 'hm-ghost', type: 'button', onclick: () => openXferExport() }, t('📲 先轉移角色', '📲 Move my character first'));
    const close = h('button', { class: 'hm-move-x', type: 'button', 'aria-label': t('關閉提示', 'Dismiss'), onclick: dismiss }, '×');
    const title = h('b', {});
    title.textContent = t('本站新網址：nkuht-htl.drmjhsu.com', 'New address: nkuht-htl.drmjhsu.com');
    const note = h('span', {});
    note.textContent = t('想保留名字、角色與護照進度？先按「先轉移角色」取得轉移碼，再到新網址的「角色 → 輸入轉移碼」輸入。',
      'To keep your name, character and passport, get a transfer code first, then enter it on the new site under Avatar → Enter transfer code.');
    const bar = h('div', { class: 'hm-move', role: 'region', 'aria-label': t('網址搬遷通知', 'Address change notice') },
      h('div', { class: 'hm-move-text' }, title, note),
      h('div', { class: 'hm-move-acts' }, xfer, go),
      close);
    document.body.append(bar);
  }

  // ── 取名小卡：首次使用時出現一次。可輸入名字、換一個隨機暱稱，或直接略過（沿用隨機暱稱）
  function openNameCard(api, S) {
    if (document.querySelector('.hm-namecard')) return;
    const en = isEnUI();
    const t = (zh, eng) => (en ? eng : zh);
    const prevFocus = document.activeElement;
    const input = h('input', {
      class: 'hm-namecard-input', type: 'text', maxlength: '10', autocomplete: 'off', spellcheck: 'false',
      'aria-labelledby': 'hm-namecard-title', 'aria-describedby': 'hm-namecard-note',
    });
    input.value = S.look.name || randomNickname();
    const close = (save) => {
      if (save) {
        const v = input.value.trim();
        if (v && v !== S.look.name) api.update({ name: v });
      }
      markNameAsked();
      bg.remove();
      try { prevFocus?.focus?.(); } catch (e) { /* 略過 */ }
    };
    const diceBtn = h('button', { class: 'hm-ghost', type: 'button', onclick: () => { input.value = randomNickname(); input.focus(); input.select(); } }, t('🎲 換一個', '🎲 Shuffle'));
    const skipBtn = h('button', { class: 'hm-ghost', type: 'button', onclick: () => close(false) }, t('略過', 'Skip'));
    const okBtn = h('button', { class: 'hm-primary', type: 'submit' }, t('確定', 'OK'));
    const form = h('form', {
      class: 'hm-namecard', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'hm-namecard-title',
      onsubmit: (e) => { e.preventDefault(); close(true); },
      onkeydown: (e) => {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(false); }
        else if (e.key === 'Tab') {
          const f = [input, diceBtn, skipBtn, okBtn];
          const i = f.indexOf(document.activeElement);
          if (e.shiftKey && i <= 0) { e.preventDefault(); okBtn.focus(); }
          else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); input.focus(); }
        }
      },
    },
      h('h2', { id: 'hm-namecard-title', class: 'hm-namecard-title' }, t('替你的角色取個名字', 'Name your character')),
      h('p', { id: 'hm-namecard-note', class: 'hm-namecard-note' },
        t('旅伴廣場的其他人會看到這個名字。不想取也沒關係，可以直接用下面的隨機名字。請不要填真實姓名或個人資料。',
          'Other visitors in the plaza will see this name. You can keep the random one below. Please don\'t use your real name or personal details.')),
      h('div', { class: 'hm-namecard-row' }, input, diceBtn),
      h('div', { class: 'hm-namecard-acts' }, skipBtn, okBtn),
      h('button', { class: 'hm-linkbtn', type: 'button', onclick: () => { bg.remove(); openXferImport(); } }, t('📥 已在其他裝置玩過？輸入轉移碼', '📥 Played on another device? Enter a transfer code')));
    const bg = h('div', { class: 'hm-namecard-bg', onclick: (e) => { if (e.target === bg) close(false); } }, form);
    document.body.append(bg);
    input.focus();
    input.select();
  }

  function buildUI(api, S) {
    const style = h('style');
    style.textContent = CSS + NAMECARD_CSS;
    document.head.append(style);

    const tag = h('div', { class: 'hm-tag' });
    const say = h('div', { class: 'hm-say' });
    document.body.append(tag, say);

    const dyn = h('div', { class: 'hm-body' });
    const nameInput = h('input', {
      class: 'hm-name', maxlength: '10', placeholder: '替角色取個名字',
      'aria-label': '角色名字（旅伴廣場的其他人會看到）',
      oninput: (e) => { const v = e.target.value.trim(); if (v) api.update({ name: v }, false); },
      onchange: (e) => {
        const v = e.target.value.trim();
        if (!v) { const n = randomNickname(); e.target.value = n; api.update({ name: n }, false); }
        markNameAsked();
      },
    });
    const tabs = h('div', { class: 'hm-tabs', role: 'tablist' },
      ...[['look', '外觀'], ['trip', '行程'], ['photo', '拍照']].map(([k, label]) =>
        h('button', { class: 'hm-tab', type: 'button', role: 'tab', 'data-tab': k, onclick: () => { api.setTab(k); track("htl_avatar_tab", { tab: k }); } }, label)));
    const closeBtn = h('button', { class: 'hm-x', type: 'button', 'aria-label': '關閉', onclick: () => api.close() }, '×');
    const minBtn = h('button', { class: 'hm-x hm-min', type: 'button', 'aria-label': '收合或展開', onclick: () => api.toggleMin() }, '▾');
    const handleBtn = h('button', {
      class: 'sheet-handle mob-only', type: 'button', 'aria-label': '展開或收合角色面板',
      onclick: () => {
        if (panel.classList.contains('min')) { panel.classList.remove('min'); minBtn.textContent = '▾'; }
        else panel.classList.toggle('full');
      }
    }, h('i'));
    const sub = h('div', { class: 'hm-sub' });
    const headEl = h('div', { class: 'hm-head' },
      h('div', {}, h('div', { class: 'hm-eyebrow' }, 'MY CHARACTER'), h('h2', { class: 'hm-title' }, '角色'), sub),
      h('div', { class: 'hm-headbtns' }, minBtn, closeBtn));
    const panel = h('div', { class: 'hm-panel', role: 'dialog', 'aria-label': '角色' },
      handleBtn, headEl, tabs, dyn);
    let hmTouchY = null;
    for (const dragEl of [handleBtn, headEl]) {
      dragEl.addEventListener('touchstart', (e) => { hmTouchY = e.touches[0].clientY; }, { passive: true });
      dragEl.addEventListener('touchend', (e) => {
        if (hmTouchY === null) return;
        const dy = e.changedTouches[0].clientY - hmTouchY;
        hmTouchY = null;
        if (dy < -36) {
          if (panel.classList.contains('min')) { panel.classList.remove('min'); minBtn.textContent = '▾'; }
          else panel.classList.add('full');
        } else if (dy > 42) {
          if (panel.classList.contains('full')) panel.classList.remove('full');
          else if (!panel.classList.contains('min')) { panel.classList.add('min'); minBtn.textContent = '▴'; }
          else api.close();
        }
      }, { passive: true });
    }
    // 放在站方側邊欄同一層（#app），位置、大小與清單完全一樣；開啟時取代清單
    const host = document.querySelector('#sidebar') && document.querySelector('#sidebar').parentElement;
    if (host) host.append(panel); else { panel.classList.add('loose'); document.body.append(panel); }

    // 開啟按鈕：優先放進站方工具列，沿用它的按鈕樣式
    const isEnUI = document.documentElement.lang === 'en' || new URLSearchParams(location.search).get('lang') === 'en';
    const openBtn = h('button', { id: 'hm-open', class: 'hm-open', type: 'button', onclick: () => {
      api.toggle();
      if (panel.classList.contains('open')) track("htl_avatar_open");
    } }, h('i', { class: 'tb-ic', 'aria-hidden': 'true' }, '☺'), h('span', { class: 'tb-lbl' }, isEnUI ? 'Avatar' : '角色'));
    const driveBtn = h('button', { id: 'hm-drive', class: 'hm-open', type: 'button', 'aria-pressed': 'false', title: isEnUI ? 'Walk freely with WASD / 360° joystick and chat with faculty & peers' : '使用 WASD / 360° 動態搖桿自由探索全島並與師長、同學對話', onclick: () => {
      api.toggleDrive();
    } }, h('i', { class: 'tb-ic', 'aria-hidden': 'true' }, '🕹️'), h('span', { class: 'tb-lbl' }, isEnUI ? 'Walk' : '漫遊'));
    const toolbar = document.querySelector('nav.toolbar');
    if (toolbar) {
      const ref = toolbar.querySelector('#sidebar-toggle') || toolbar.firstChild;
      toolbar.insertBefore(driveBtn, ref);
      toolbar.insertBefore(openBtn, ref);
    } else {
      Object.assign(openBtn.style, { position: 'fixed', left: '16px', top: '16px', zIndex: 60, padding: '8px 12px', borderRadius: '9px', border: '1px solid #211d1d26', background: '#fff8f4' });
      document.body.append(openBtn, driveBtn);
    }

    // ── 分離式雙手人體工學 RPG HUD（1. 頂部狀態膠囊 + 2. 左下動態浮動 360° 搖桿 + 3. 情境互動提示 + 4. 右下扇形動作鍵群）
    const rpgIslEl = h('span', { class: 'hm-rpg-isl' }, '📍 旅館島巡禮中');
    const rpgLvlBtn = h('button', { class: 'hm-rpg-lvl', type: 'button', title: '點擊開啟旅館島學習護照', onclick: () => window.__htlPassport?.open?.() }, '★ 0 XP');
    const tpSelect = h('select', {
      class: 'hm-top-pill hm-tp-sel',
      title: '快速瞬間傳送至任一主題島嶼中心',
      'aria-label': '快速傳送島嶼',
      onchange: (e) => {
        const id = e.target.value;
        e.target.value = '';
        e.target.blur();
        canvas.focus?.();
        if (id) api.teleportToIsland(id);
      },
    }, h('option', { value: '' }, '⚡ 傳送島嶼...'));
    const lmSelect = h('select', {
      class: 'hm-top-pill hm-tp-sel hm-lm-sel',
      title: '一鍵拜訪朝陽鐘樓與高餐校園景觀藝術（或按 L 鍵巡禮下一座地標）',
      'aria-label': '拜訪高餐校園地標',
      onchange: (e) => {
        const id = e.target.value;
        e.target.value = '';
        e.target.blur();
        canvas.focus?.();
        if (id) {
          if (id === '__sport') api.teleportToIsland('sport');
          else api.visitLandmark(id);
        }
      },
    }, h('option', { value: '' }, '🏛️ 拜訪地標...'));
    const questTopBtn = h('button', { class: 'hm-top-pill', type: 'button', title: '自動尋路前往當前主線任務目標 (Q)', onclick: () => api.walkToQuestTarget() }, '🧭 尋路');
    const camTopBtn = h('button', { class: 'hm-top-pill', type: 'button', title: '切換追隨鏡頭視角 (V)：拖曳畫面可自由 360° 環繞角色', onclick: () => api.cycleCamMode() }, '🎥 標準視角');
    const plazaTopBtn = h('button', { class: 'hm-top-pill', type: 'button', title: '開啟線上旅伴廣場與即時聊天室 (C)', onclick: () => window.htlSocial?.toggleChat?.() }, '👥 旅伴廣場');
    const exitDriveBtn = h('button', { class: 'hm-top-pill exit', type: 'button', title: '結束操控模式 (Esc)', onclick: () => api.toggleDrive(false) }, '✕ 結束');
    const topBar = h('div', { class: 'hm-hud-top' }, rpgIslEl, rpgLvlBtn, tpSelect, lmSelect, questTopBtn, camTopBtn, plazaTopBtn, exitDriveBtn);

    // 左下角：動態浮動原點 360° 類比虛擬搖桿（點擊熱區內任一點即以該點為圓心，單手大拇指無須盲找中心）
    const joyRing = h('div', { class: 'hm-joy-ring' });
    const joyNub = h('div', { class: 'hm-joy-nub' }, '✦');
    const joyWrap = h('div', { class: 'hm-joy', 'aria-label': '360 度動態類比搖桿（推到底自動衝刺）' }, joyRing, joyNub);
    const kbPills = {
      u: h('span', { class: 'hm-kb-pill' }, 'W'),
      l: h('span', { class: 'hm-kb-pill' }, 'A'),
      d: h('span', { class: 'hm-kb-pill' }, 'S'),
      r: h('span', { class: 'hm-kb-pill' }, 'D'),
    };
    const stickZone = h('div', { class: 'hm-stick-zone', title: '在區域內任意處按住拖曳即可 360° 移動（推到底自動衝刺）' },
      joyWrap,
      h('div', { class: 'hm-kb-pills' }, kbPills.u, kbPills.l, kbPills.d, kbPills.r));

    let joyPtr = null;
    let joyOrigin = { x: 0, y: 0 };
    const updateJoyFromPoint = (clientX, clientY) => {
      const maxR = 36;
      const dx = clientX - joyOrigin.x, dy = clientY - joyOrigin.y;
      const dist = Math.hypot(dx, dy);
      const clamped = Math.min(dist, maxR);
      const ang = Math.atan2(dy, dx);
      const deadzone = 4;
      const eff = dist > deadzone ? (clamped - deadzone) / (maxR - deadzone) : 0;
      const mag = Math.max(0, Math.min(1, eff));
      const nx = mag > 0 ? Math.cos(ang) * mag : 0;
      const nz = mag > 0 ? -Math.sin(ang) * mag : 0;
      S.joy = { x: nx, z: nz, mag };
      joyNub.style.transform = `translate(${(Math.cos(ang) * clamped).toFixed(1)}px, ${(Math.sin(ang) * clamped).toFixed(1)}px)`;
      joyRing.style.transform = `rotate(${(ang * 180 / Math.PI + 90).toFixed(1)}deg)`;
      joyWrap.classList.toggle('sprinting', mag > 0.78);
    };
    const resetJoy = () => {
      joyPtr = null;
      S.joy = { x: 0, z: 0, mag: 0 };
      joyWrap.classList.remove('dragging', 'sprinting');
      joyWrap.style.transform = 'translate(0px, 0px)';
      joyNub.style.transform = 'translate(0px, 0px)';
    };
    stickZone.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      joyPtr = e.pointerId;
      const zr = stickZone.getBoundingClientRect();
      const zcx = zr.left + zr.width / 2, zcy = zr.top + zr.height / 2;
      // 動態浮動底座：允許圓心跟隨手指落點偏移（上限 ±22px），大幅提升觸控手感
      const ox = Math.max(-22, Math.min(22, e.clientX - zcx));
      const oy = Math.max(-22, Math.min(22, e.clientY - zcy));
      joyOrigin = { x: zcx + ox, y: zcy + oy };
      joyWrap.style.transform = `translate(${ox.toFixed(1)}px, ${oy.toFixed(1)}px)`;
      joyWrap.classList.add('dragging');
      try { stickZone.setPointerCapture(e.pointerId); } catch {}
      updateJoyFromPoint(e.clientX, e.clientY);
    });
    stickZone.addEventListener('pointermove', (e) => {
      if (joyPtr === e.pointerId) updateJoyFromPoint(e.clientX, e.clientY);
    });
    stickZone.addEventListener('pointerup', resetJoy);
    stickZone.addEventListener('pointercancel', resetJoy);
    stickZone.addEventListener('lostpointercapture', resetJoy);

    // 零延遲多點觸控輔助器：左手拇指按住虛擬搖桿時，右手拇指輕觸動作鍵立即在 0ms 觸發，不需等待合成 click
    const bindInstantTouch = (btn, fn) => {
      let lastTouchFire = 0;
      btn.dataset.instantTouch = '1';
      btn.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'touch' || e.pointerType === 'pen') {
          e.preventDefault();
          e.stopPropagation();
          lastTouchFire = performance.now();
          fn();
        }
      });
      btn.addEventListener('click', (e) => {
        if (performance.now() - lastTouchFire < 480) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        fn();
      });
      return btn;
    };

    // 情境互動膠囊（支援雙按鈕：主對話互動 + 查看靜態介紹卡）
    const nearBtn = bindInstantTouch(h('button', { class: 'hm-pad-near', type: 'button' }, ''), () => api.interactPrimary());
    const nearAltBtn = bindInstantTouch(h('button', { class: 'hm-pad-near-alt', type: 'button', style: 'display:none' }, '📄 介紹卡'), () => (S.altPhoto ? window.heartCity?.photoWith?.(S.altPhoto) : api.openRawCard()));
    const nearBar = h('div', { class: 'hm-near-bar' }, nearBtn, nearAltBtn);

    // 表情與禮賓動作快捷輪盤
    const emotePop = h('div', { class: 'hm-emote-pop', role: 'menu', 'aria-label': '禮賓動作與交流選單' },
      ...[['wave', '👋 揮手問候'], ['bow', '🙇 禮賓鞠躬'], ['cheer', '🎉 歡呼慶祝'], ['coffee', '☕ 舉杯致意']].map(([k, lbl]) =>
        bindInstantTouch(h('button', { class: 'hm-emote-btn', type: 'button' }, lbl), () => { api.triggerEmote(k); emotePop.classList.remove('open'); })),
      bindInstantTouch(h('button', { class: 'hm-emote-btn', type: 'button' }, '💬 廣場發言'), () => { emotePop.classList.remove('open'); window.htlSocial?.toggleChat?.(true); }));

    // 右下角扇形動作鍵群
    const sprintBtn = bindInstantTouch(h('button', { class: 'hm-act-sub', type: 'button', 'aria-pressed': 'false', title: '切換跑步衝刺 (Shift)' },
      h('i', {}, uiIcon('run')), h('small', {}, '衝刺')), () => api.toggleSprint());
    const jumpBtn = bindInstantTouch(h('button', { class: 'hm-act-sub', type: 'button', title: '跳躍歡呼 (Space)' },
      h('i', {}, uiIcon('jump')), h('small', {}, '跳躍')), () => api.jump());
    const emoteBtn = bindInstantTouch(h('button', { class: 'hm-act-sub', type: 'button', title: '禮賓動作與對話聊天 (C)' },
      h('i', {}, uiIcon('smile')), h('small', {}, '動作')), () => emotePop.classList.toggle('open'));
    const interactMainIco = h('i', {}, uiIcon('wave'));
    const setMainIco = (name) => { if (interactMainIco.dataset.ic !== name) { interactMainIco.dataset.ic = name; interactMainIco.replaceChildren(uiIcon(name)); } };
    const interactMainLbl = h('small', {}, '打招呼');
    const interactMainBtn = bindInstantTouch(h('button', { class: 'hm-act-main', type: 'button', title: '與身旁對象對話互動或打招呼 (E)' },
      interactMainIco, interactMainLbl), () => api.interactPrimary());

    const actCluster = h('div', { class: 'hm-act-cluster' },
      h('div', { class: 'hm-act-row' }, emoteBtn, sprintBtn),
      h('div', { class: 'hm-act-row' }, jumpBtn, interactMainBtn));

    const pad = h('div', { class: 'hm-pad', role: 'region', 'aria-label': '角色 RPG 移動與互動控制器' },
      topBar, stickZone, nearBar, emotePop, actCluster);
    document.body.append(pad);

    const CAM_LABELS = ['標準視角', 'RPG近景', '廣角鳥瞰'];
    const syncPad = () => {
      driveBtn.setAttribute('aria-pressed', String(!!S.drive));
      pad.classList.toggle('open', !!S.drive);
      document.body.classList.toggle('hm-driving', !!S.drive);
      if (!S.drive) emotePop.classList.remove('open');
      sprintBtn.setAttribute('aria-pressed', String(!!S.sprint));
      camTopBtn.textContent = `🎥 ${CAM_LABELS[S.camMode || 0] || '視角'}`;
      for (const k of ['u', 'd', 'l', 'r']) kbPills[k].classList.toggle('on', !!(S.keys[k] || S.padHold[k]));
      const st = window.__htlPassport?.getPlayerStatus?.();
      if (st) {
        rpgLvlBtn.textContent = `${'★'.repeat(st.stars)} ${st.xp} XP`;
      }
      if (S.curIslandName) {
        rpgIslEl.textContent = `📍 ${S.curIslandName}`;
      }
      if (S.islands?.length && tpSelect.options.length !== S.islands.length + 1) {
        tpSelect.replaceChildren(
          h('option', { value: '' }, '⚡ 傳送島嶼...'),
          ...S.islands.map((isl, idx) => h('option', { value: isl.id }, `${String(idx + 1).padStart(2, '0')}｜${isl.name}`))
        );
      }
      const lms = window.heartCity?.landmarks || [];
      if (lms.length && lmSelect.options.length !== lms.length + 2) {
        lmSelect.replaceChildren(
          h('option', { value: '' }, '🏛️ 拜訪地標...'),
          ...lms.map((lm) => h('option', { value: lm.id }, `${lm.badge || '🏛️'}｜${(lm.name?.zh || lm.name || '').replace(/（.*）/, '')}`)),
          h('option', { value: '__sport' }, '🏨 09｜實習旅館專島（24 家合作旅館＋群賢會館）')
        );
      }
      const onlineCnt = window.htlSocial?.getOnlineCount?.() || 0;
      plazaTopBtn.textContent = onlineCnt > 1 ? `👥 廣場 (${onlineCnt}人)` : '👥 旅伴廣場';

      const ext = S.extNear; // 來自 island-social.js 的學長姐 NPC 或真實線上玩家感應
      S.altPhoto = null;
      if (S.arrived && S.arrived.teacher) {
        const t = S.arrived.teacher;
        const nm = t.shortTitle?.zh || t.name?.zh || '師長';
        nearBtn.replaceChildren(h('kbd', {}, 'E'), t.kind === 'lord' ? `與「${nm}」禮賓對話` : `向「${nm}」請益交流`);
        nearAltBtn.style.display = '';
        nearAltBtn.textContent = '📄 師資卡';
        nearBar.classList.add('show');
        interactMainBtn.classList.add('ready');
        setMainIco('chat');
        interactMainLbl.textContent = '請益 [E]';
      } else if (ext) {
        nearBtn.replaceChildren(h('kbd', {}, 'E'), ext.prompt || `與「${ext.name}」對話交流`);
        nearAltBtn.style.display = ext.hasCard ? '' : 'none';
        if (ext.hasCard) nearAltBtn.textContent = '📄 路線卡';
        nearBar.classList.add('show');
        interactMainBtn.classList.add('ready');
        setMainIco(ext.kind === 'peer' ? 'wave' : 'chat');
        interactMainLbl.textContent = ext.kind === 'peer' ? '交流 [E]' : '對話 [E]';
      } else if (S.arrived && S.arrived.landmark) {
        const lmTitle = S.arrived.landmark.name?.zh || S.arrived.landmark.name || '高餐校園地標';
        nearBtn.replaceChildren(h('kbd', {}, 'E'), `探索高餐地標「${lmTitle}」`);
        S.altPhoto = S.arrived.landmark.id;
        nearAltBtn.style.display = '';
        nearAltBtn.textContent = '📸 合照';
        nearBar.classList.add('show');
        interactMainBtn.classList.add('ready');
        setMainIco('landmark');
        interactMainLbl.textContent = '地標 [E]';
      } else if (S.arrived && S.arrived.building) {
        nearBtn.replaceChildren(h('kbd', {}, 'E'), `探索「${S.arrived.building.name}」`);
        S.altPhoto = S.arrived.building.id || null;
        nearAltBtn.style.display = S.altPhoto ? '' : 'none';
        nearAltBtn.textContent = '📸 合照';
        nearBar.classList.add('show');
        interactMainBtn.classList.add('ready');
        setMainIco('landmark');
        interactMainLbl.textContent = '查看 [E]';
      } else {
        nearBar.classList.remove('show');
        nearAltBtn.style.display = 'none';
        interactMainBtn.classList.remove('ready');
        setMainIco('wave');
        interactMainLbl.textContent = '打招呼';
      }
      window.__htlPassport?.syncQuestHud?.();
    };

    const chips = (items, current, onPick, extraClass = '') =>
      h('div', { class: 'hm-chips ' + extraClass }, ...items.map(([k, label]) =>
        h('button', { class: 'hm-chip', type: 'button', 'aria-pressed': String(k === current), onclick: () => onPick(k) }, label)));
    // 色票 + 最後一顆「自訂色」：拖動色盤時只重建角色、不重繪面板（否則色盤會被關掉），放開後才重繪
    const swatches = (part, current) => {
      const inPalette = PALETTE[part].includes(current);
      return h('div', { class: 'hm-sw' },
        ...PALETTE[part].map((c) =>
          h('button', { class: 'hm-swb', type: 'button', style: `background:${hex(c)}`, 'aria-label': PART_LABEL[part], 'aria-pressed': String(c === current), onclick: () => api.update({ [part]: c }) })),
        h('label', { class: 'hm-swb hm-custom', title: '自訂顏色', 'aria-pressed': String(!inPalette), ...(inPalette ? {} : { style: `background:${hex(current)}` }) },
          h('input', {
            type: 'color', value: hex(current), 'aria-label': PART_LABEL[part] + '自訂顏色',
            oninput: (e) => api.update({ [part]: parseInt(e.target.value.slice(1), 16) }, false),
            onchange: () => render(),
          })));
    };
    const slider = (key, label) => {
      const [lo, hi] = SHAPE_RANGE[key];
      const val = h('span', { class: 'hm-rangeval' }, Math.round(S.look[key] * 100) + '%');
      return row(label, val, h('input', {
        class: 'hm-range', type: 'range', min: String(lo), max: String(hi), step: '0.01', value: String(S.look[key]), 'aria-label': label,
        oninput: (e) => { const v = parseFloat(e.target.value); val.textContent = Math.round(v * 100) + '%'; api.update({ [key]: v }, false); },
      }));
    };
    const toggle = (label, on, fn) => h('button', { class: 'hm-ghost', type: 'button', 'aria-pressed': String(!!on), onclick: fn }, label);
    const row = (label, ...kids) => h('div', { class: 'hm-row' }, h('div', { class: 'hm-lab' }, label), ...kids);
    // 可收合的區塊；開合狀態記在 S.ui.sections，面板重繪後才不會全部縮回去
    const section = (key, title, ...kids) => {
      const el = h('details', { class: 'hm-sec', ...(S.ui.sections[key] ? { open: '' } : {}) }, h('summary', {}, title), ...kids);
      el.addEventListener('toggle', () => { S.ui.sections[key] = el.open; });
      return el;
    };

    // 面向羅盤：點或拖曳設定方向。完全在面板內，不碰場景手勢（免得跟鏡頭旋轉、站方的點選搶）
    const dialWidget = () => {
      const needle = h('div', { class: 'hm-dial-needle' });
      const dial = h('div', { class: 'hm-dial', 'aria-label': '面向羅盤：點或拖曳設定方向' }, needle,
        h('span', { class: 'hm-dl t' }, '遠'), h('span', { class: 'hm-dl b' }, '近'), h('span', { class: 'hm-dl l' }, '左'), h('span', { class: 'hm-dl r' }, '右'));
      const set = (e) => {
        const r = dial.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        if (Math.hypot(dx, dy) > 6) api.aimDial(Math.atan2(dx, -dy)); // 0 = 上
      };
      let drag = false;
      dial.addEventListener('pointerdown', (e) => { drag = true; try { dial.setPointerCapture(e.pointerId); } catch (err) { /* 合成事件沒有可捕捉的指標 */ } set(e); });
      dial.addEventListener('pointermove', (e) => { if (drag) set(e); });
      const end = () => { drag = false; };
      dial.addEventListener('pointerup', end);
      dial.addEventListener('pointercancel', end);
      return dial;
    };
    const whoName = (actor) => (actor === 'puma' ? '領航員分身' : '角色');
    const placingUI = () => [
      h('div', { class: 'hm-status' }, `放置：${whoName(S.actor)}`),
      h('div', { class: 'hm-note' }, '在場景裡點一個位置：步道旁、建築前、教室黑板前都可以；小島請點島上。可以先拖曳轉好鏡頭再點。'),
      h('div', { class: 'hm-foot' }, h('button', { class: 'hm-ghost', type: 'button', style: 'flex:1', onclick: () => api.cancelPlace() }, '取消')),
    ];
    const poseRow = () => {
      const po = S.pose[S.aim.actor];
      return row('姿勢', h('div', { class: 'hm-two' },
        toggle('左手舉高', po.l, () => api.togglePose('l')),
        toggle('右手舉高', po.r, () => api.togglePose('r'))));
    };
    const aimUI = () => [
      h('div', { class: 'hm-status' }, `${whoName(S.aim.actor)} · ${S.aim.name}：調整面向`),
      h('div', { class: 'hm-aim' }, dialWidget()),
      h('div', { class: 'hm-note' }, '羅盤：點或拖曳設定面向（上＝畫面遠方，會跟著目前鏡頭）；也可以直接點場景上的任一處，角色會面向那裡。'),
      row('面向', h('div', { class: 'hm-chips' },
        ...[['camera', '面向鏡頭'], ['back', '背對鏡頭'], ['building', '面向最近建築']].map(([k, label]) =>
          h('button', { class: 'hm-chip', type: 'button', onclick: () => api.aimFace(k) }, label)),
        h('button', { class: 'hm-chip', type: 'button', onclick: () => api.aimTurn(-15) }, '⟲ 左轉 15°'),
        h('button', { class: 'hm-chip', type: 'button', onclick: () => api.aimTurn(15) }, '右轉 15° ⟳'))),
      poseRow(),
      h('div', { class: 'hm-row' }, toggle('拍照模式（隱藏名牌與標記）', S.clean, () => api.toggleClean())),
      h('div', { class: 'hm-foot sticky' }, // 黏在面板底部：內容比面板高時，確認鈕也一直看得到
        h('button', { class: 'hm-ghost', type: 'button', onclick: () => api.cancelAim() }, '取消'),
        h('button', { class: 'hm-primary', type: 'button', onclick: () => api.commitAim() }, '站在這裡')),
    ];

    function renderLook() {
      const look = S.look, set = (k) => (v) => api.update({ [k]: v });
      if (document.activeElement !== nameInput) nameInput.value = look.name;
      const hatted = look.hat !== 'none';
      dyn.replaceChildren(
        row('名字', nameInput,
          h('div', { class: 'hm-xfer-acts' },
            h('button', { class: 'hm-ghost', type: 'button', onclick: () => openXferExport() }, '📲 轉移到其他裝置'),
            h('button', { class: 'hm-ghost', type: 'button', onclick: () => openXferImport() }, '📥 輸入轉移碼'))),
        row('身分', chips(ROLES, look.role, (k) => api.setRole(k)),
          h('div', { class: 'hm-note' }, '切換身分會套用該身分的預設衣著與配件，之後每一項都能自己改')),
        section('nkuhtUniform', '🎓 高餐學生制服快速換裝 ＆ 校園地標巡禮',
          row('一鍵換穿高餐大經典制服（共 8 款實景制服）',
            h('div', { class: 'hm-chips' },
              ...NKUHT_UNIFORM_PRESETS.map(([uid, label, preset]) =>
                h('button', {
                  class: 'hm-chip',
                  type: 'button',
                  'aria-pressed': String(look.outfit === preset.outfit && look.shirt === preset.shirt && look.pants === preset.pants && look.hairStyle === preset.hairStyle),
                  onclick: () => api.update({ ...preset }),
                }, '🎓 ' + label))),
            h('div', { class: 'hm-note' }, '依高餐秋冬墨綠西裝、經典炭黑西裝、夏季白衫配黃領帶／領巾與新生 Polo 衫實景打造；換裝後可點下方地標打卡！')),
          ...(window.heartCity?.landmarks?.length ? [row('飛往朝陽鐘樓與高餐校園景觀藝術',
            h('div', { class: 'hm-chips' },
              ...window.heartCity.landmarks.map((lm) =>
                h('button', {
                  class: 'hm-chip',
                  type: 'button',
                  onclick: () => {
                    api.close();
                    if (S.drive) api.visitLandmark(lm.id);
                    else window.heartCity.selectLandmark?.(lm.id);
                  },
                }, `${lm.badge || '🏛️'} ${(lm.name?.zh || lm.name || '').replace(/（.*）/, '')}`))))] : [])),
        section('faculty', '👩‍🏫 系上 10 位師長形象套用／召喚導覽',
          row('套用師長形象（或點下方直接召喚 3D 老師）',
            h('div', { class: 'hm-chips' },
              ...FACULTY_PRESETS.map(([tid, label, preset]) =>
                h('button', {
                  class: 'hm-chip',
                  type: 'button',
                  'aria-pressed': String(look.outfit === preset.outfit && look.shirt === preset.shirt && look.hairStyle === preset.hairStyle && look.hair === preset.hair),
                  // 只套用外觀，不改名字：避免訪客的名字變成師長姓名（防冒名 R-13）
                  onclick: () => { const { name: _n, ...outfitOnly } = preset; api.update(outfitOnly); },
                }, '👔 ' + label))),
            h('div', { class: 'hm-note' }, '點擊上方可將自己的角色換成老師同款穿搭（名字不會改變）；點擊下方可飛往島上的 3D 老師聽課解說：')),
          row('飛往島上 3D 老師聽課解說',
            h('div', { class: 'hm-chips' },
              ...FACULTY_PRESETS.map(([tid, label]) =>
                h('button', {
                  class: 'hm-chip',
                  type: 'button',
                  onclick: () => {
                    api.close();
                    if (window.heartCity && window.heartCity.selectTeacher) window.heartCity.selectTeacher(tid);
                  },
                }, '🎙️ ' + label))))),
        row('預覽方向', h('div', { class: 'hm-two' },
          h('button', { class: 'hm-ghost', type: 'button', onclick: () => api.facing(false) }, '面向鏡頭'),
          h('button', { class: 'hm-ghost', type: 'button', onclick: () => api.facing(true) }, '背面'))),
        ...(S.fitSpots && S.fitSpots.length ? [row('試衣地點', h('div', { class: 'hm-two' },
          h('div', { class: 'hm-spot' }, (S.fitSpots[S.fitIdx] || S.fitSpots[0]).name),
          ...(S.fitSpots.length > 1 ? [h('button', { class: 'hm-ghost', type: 'button', onclick: () => api.nextSpot() }, '換一個')] : [])))] : []),
        ...(S.fitSpots && S.fitSpots.length ? [row('合照', h('div', { class: 'hm-two' },
          toggle('與領航員合照', S.pair, () => api.togglePair()),
          ...(S.pair ? [h('button', { class: 'hm-ghost', type: 'button', onclick: () => api.swapPair() }, '左右換邊')] : [])))] : []),
        section('face', '臉與髮',
          row('髮型', chips(HAIR_STYLES, look.hairStyle, set('hairStyle'), hatted ? 'off' : ''),
            hatted ? h('div', { class: 'hm-note' }, '戴著帽子，髮型被蓋住了') : ''),
          row('髮色', swatches('hair', look.hair)),
          row('膚色', swatches('skin', look.skin)),
          row('眼睛', chips(EYES, look.eyes, set('eyes'), look.face === 'sunglasses' ? 'off' : ''),
            look.face === 'sunglasses' ? h('div', { class: 'hm-note' }, '戴著墨鏡，眼睛被蓋住了') : ''),
          row('嘴巴', chips(MOUTHS, look.mouth, set('mouth'), look.face === 'mask' ? 'off' : ''),
            look.face === 'mask' ? h('div', { class: 'hm-note' }, '戴著口罩，嘴巴被蓋住了') : ''),
          row('臉部配件', chips(FACES, look.face, set('face')))),
        section('outfit', '衣著',
          row('衣款', chips(OUTFITS, look.outfit, set('outfit'))),
          row('上衣顏色', swatches('shirt', look.shirt)),
          row('褲子顏色', swatches('pants', look.pants))),
        section('acc', '配件',
          row('帽子', chips(HATS, look.hat, set('hat'))),
          ...(hatted && look.hat !== 'straw' ? [row('帽子顏色', swatches('hatColor', look.hatColor))] : []),
          row('背部', chips(BACKS, look.back, set('back'))),
          row('手持物', chips(HANDS, look.hand, set('hand'))),
          row('同行物', chips(SIDES, look.side, set('side')))),
        section('shape', '體型',
          slider('height', '身高'),
          slider('width', '體型（寬窄）')),
        h('div', { class: 'hm-foot' },
          h('button', { class: 'hm-ghost', type: 'button', onclick: () => api.randomize() }, '🎲 隨機'),
          h('button', { class: 'hm-ghost', type: 'button', onclick: () => api.reset() }, '重設'),
          h('button', { class: 'hm-primary', type: 'button', onclick: () => api.close() }, '完成')));
    }

    function renderTrip() {
      const D = S.data, M = S.mission;
      const kids = M.label ? [h('div', { class: 'hm-status' }, M.label)] : []; // 沒有行程（例如剛停止自動逛逛）就不顯示狀態框
      if (S.arrived && S.arrived.building) {
        kids.push(h('div', { class: 'hm-row' },
          h('button', { class: 'hm-ghost', type: 'button', style: 'width:100%', onclick: () => api.openCard() }, `查看「${S.arrived.building.name}」的介紹卡`)));
      }
      kids.push(h('div', { class: 'hm-row' },
        toggle('🕹️ 鍵盤 WASD ／ 方向鍵 ／ 搖桿自由操控走動', S.drive, () => api.toggleDrive())));
      kids.push(h('div', { class: 'hm-row hm-two' },
        toggle('🎲 自動逛逛', M.type === 'wander', () => api.toggleWander()),
        toggle('📍 點地圖指定', S.pickMode, () => api.togglePick())));
      if (S.drive) kids.push(h('div', { class: 'hm-note' }, '已開啟自由操控：按鍵盤 WASD 或方向鍵（↑↓←→）或畫面下方搖桿即可控制角色走遍全島，或直接點擊地面走過去！'));
      else if (S.pickMode) kids.push(h('div', { class: 'hm-note' }, '在場景裡點一個地方，角色會走過去。按 Esc 取消。'));
      if (D) {
        const sel = D.islandById.get(S.ui.island);
        const islandRow = row('前往某處',
          chips(D.islands.map((i) => [i.id, i.name]), S.ui.island, (k) => api.pickIsland(k), 'grid2'));
        if (sel) {
          islandRow.append(h('div', { class: 'hm-places' },
            h('div', { class: 'hm-lab' }, `${sel.name}：選一個地點`),
            chips([['__island', '→ 島的中心'], ...sel.buildings.map((b) => [b.id, b.name])],
              S.mission.targetId,
              (k) => (k === '__island' ? api.goIsland(sel.id) : api.goBuilding(k)), 'list')));
        }
        kids.push(islandRow);
      } else {
        kids.push(h('div', { class: 'hm-note' }, '系所資料載入失敗，目前只能用「點地圖指定」。'));
      }
      dyn.replaceChildren(...kids);
    }

    function renderPhoto() {
      if (S.placing) { dyn.replaceChildren(...placingUI()); return; }
      if (S.aim) { dyn.replaceChildren(...aimUI()); return; }
      const kids = [];
      kids.push(row('拍照站位', h('div', { class: 'hm-two' },
        h('button', { class: 'hm-ghost', type: 'button', onclick: () => api.startPlace('me') }, '📌 角色'),
        h('button', { class: 'hm-ghost', type: 'button', onclick: () => api.startPlace('puma') }, '📌 領航員分身'))));
      const tools = [];
      if (S.stand) tools.push(h('button', { class: 'hm-chip', type: 'button', onclick: () => api.leaveStand() }, '解除定點，繼續漫步'));
      if (S.puma && S.puma.fig.group.visible) tools.push(h('button', { class: 'hm-chip', type: 'button', onclick: () => api.removePuma() }, '收回領航員'));
      tools.push(toggle('拍照模式（隱藏名牌與標記）', S.clean, () => api.toggleClean()));
      kids.push(h('div', { class: 'hm-row' }, h('div', { class: 'hm-chips' }, ...tools)));
      if (window.htlPhotoShare) kids.push(h('div', { class: 'hm-row' }, h('button', { class: 'hm-ghost', type: 'button', onclick: () => window.htlPhotoShare.open() }, '📸 拍下並套相框分享到 IG / FB')));
      dyn.replaceChildren(...kids);
    }

    function render() {
      syncPad();
      for (const b of tabs.children) b.setAttribute('aria-selected', String(b.dataset.tab === S.tab));
      (S.tab === 'trip' ? renderTrip : S.tab === 'photo' ? renderPhoto : renderLook)();
    }

    // 面板跟清單在同一個位置（CSS 定位），不需要逐幀計算
    function layout() {}

    return {
      panel, tag, say, openBtn, driveBtn, pad, syncPad, render, layout,
      destroy() { style.remove(); tag.remove(); say.remove(); panel.remove(); openBtn.remove(); driveBtn.remove(); pad.remove(); },
      setOpen(on) {
        panel.classList.toggle('open', on);
        panel.classList.remove('full');
        openBtn.setAttribute('aria-pressed', String(on));
        if (on) { panel.classList.remove('min'); minBtn.textContent = '▾'; layout(); }
      },
      isOpen: () => panel.classList.contains('open'),
      // 收合：只留一條標題列，並在標題下顯示目前行程（手機上讓出畫面看角色走路）
      setMin(on) {
        panel.classList.toggle('min', on);
        if (on) panel.classList.remove('full');
        minBtn.textContent = on ? '▴' : '▾';
      },
      isMin: () => panel.classList.contains('min'),
      setSub(text) { if (sub.textContent !== text) sub.textContent = text; },
    };
  }

  // ───────────────────────── 組裝 ─────────────────────────

  function spawn(data) {
    const hc = window.heartCity;
    const routes = hc.pedestrianRoutes;
    const canvas = document.querySelector('canvas');
    // 站方另外提供的步道（例如通往高雄港灣區的橋）：只加進路網，不當成可選的來回路線
    const net = buildNet(routes.concat(hc.extraWalkRoutes || []));

    const S = {
      look: loadLook(), fig: null, follow: null, data,
      tab: 'look', pickMode: false, ui: { island: null, sections: { nkuhtUniform: true, face: true } },
      routeInfo: hc.routeIslands(),           // 與 pedestrianRoutes 同序：{ flow, islands }
      mission: { type: 'route', label: '', routeIdx: -1, flow: null, targetId: null },
      walk: null, idle: null, pause: null, arrived: null, say: null, lastBuilding: null,
      fitting: false, fitSaved: null, baseLimits: null, pose: { me: { l: false, r: false }, puma: { l: false, r: false } }, fitSpots: null, fitIslandSpots: null, fitIdx: 0, fitGen: null,
      stand: null, aim: null, placing: false, defaultRoute: 0, actor: 'me', puma: null, clean: false, pair: false, pairSwap: false, fitPumaSaved: null,
      drive: false, sprint: false, keys: { u: false, d: false, l: false, r: false }, padHold: { u: false, d: false, l: false, r: false }, nearBuilding: null,
      nearTeacher: null, extNear: null, extNearKey: '', joy: { x: 0, z: 0, mag: 0 }, vel: { x: 0, z: 0 }, emote: null, lastTapAt: 0, lastTapX: 0, lastTapY: 0, jumpY: 0, jumpVel: 0, camMode: 0, curIslandId: null, curIslandName: '',
    };
    // 已經自己取過名字的舊訪客不再詢問；名字是空的或舊預設值「我」時，先給隨機暱稱並保存
    if (isPlaceholderName(S.look.name)) {
      S.look.name = randomNickname();
      saveLook(S.look);
    } else {
      markNameAsked();
    }
    const buildings = data ? data.islands.flatMap((i) => i.buildings.map((b) => ({ ...b, island: i }))) : [];

    const SPEED = 0.3;        // 沿路線閒逛的速度（與站方居民相近）
    const CAM_MODES = [
      { off: new T.Vector3(0.9, 2.5, 2.3), lift: new T.Vector3(0, 0, 0), label: '標準斜角追隨' },
      { off: new T.Vector3(0.52, 1.16, 1.44), lift: new T.Vector3(0, 0.14, 0), label: 'RPG 近景追隨' },
      { off: new T.Vector3(1.35, 3.85, 3.45), lift: new T.Vector3(0, 0, 0), label: '廣角鳥瞰追隨' },
    ];
    const FOLLOW_OFFSET = CAM_MODES[0].off; // 同站方 selectWalker 的視角
    // 試衣時的視角：鏡頭瞄準胸口（FIT_LIFT）、接近平視（約 8° 俯角），臉才不會被帽簷和頭髮遮住
    const FIT_OFFSET = new T.Vector3(0.2, 0.3, 2.0);
    const FIT_LIFT = new T.Vector3(0, 0.16, 0);
    let followOffset = FOLLOW_OFFSET;
    let followLift = new T.Vector3(); // 追隨瞄準點相對腳底的抬高量
    let last = performance.now();

    // ── 角色重建（保留位置與朝向）
    function rebuild() {
      const old = S.fig;
      const next = buildFigure(S.look);
      if (old) {
        next.group.position.copy(old.group.position);
        next.group.rotation.copy(old.group.rotation);
        cap.scene.remove(old.group);
        disposeFigure(old.group);
      }
      next.ring.visible = !!S.follow;
      applyFigScale(next);
      cap.scene.add(next.group);
      S.fig = next;
      refreshTag();
    }
    const refreshTag = () => { ui.tag.replaceChildren(S.look.name, h('b', {}, ROLE_LABEL[S.look.role])); ui.tag._sz = null; };

    // ── 目的地標記
    const destMark = new T.Group();
    const destRing = new T.Mesh(G.ring, new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -8 }));
    destRing.scale.setScalar(1.8);
    const destPin = new T.Mesh(G.pin, new T.MeshStandardMaterial({ color: CORAL, emissive: CORAL, emissiveIntensity: 0.6 }));
    destPin.rotation.x = Math.PI;
    destPin.scale.set(0.08, 0.14, 0.08);
    destMark.add(destRing, destPin);
    destMark.visible = false;
    cap.scene.add(destMark);
    // 調整面向時，角色前方的小箭頭（貼地，指向面向的方向）
    const aimArrow = new T.Group();
    const arrowMesh = new T.Mesh(G.cone, new T.MeshBasicMaterial({ color: CORAL, transparent: true, opacity: 0.9, depthTest: false }));
    arrowMesh.rotation.x = Math.PI / 2; // 錐尖朝 +z（角色面向的方向）
    arrowMesh.scale.set(0.1, 0.18, 0.1);
    arrowMesh.position.set(0, 0.03, 0.3);
    arrowMesh.renderOrder = 997;
    aimArrow.add(arrowMesh);
    aimArrow.visible = false;
    cap.scene.add(aimArrow);

    // ── 3D RPG 黃金任務羅盤箭頭（在操控模式下環繞角色腳邊，即時指向下一主線任務目標）
    const questCompass = new T.Group();
    const qRingMat = new T.MeshBasicMaterial({ color: 0xe6ca8a, transparent: true, opacity: 0.55, depthWrite: false });
    const qRingMesh = new T.Mesh(G.ring, qRingMat);
    qRingMesh.scale.setScalar(1.35);
    const qArrowMat = new T.MeshBasicMaterial({ color: 0xf5d33a, transparent: true, opacity: 0.92, depthTest: false });
    const qArrowMesh = new T.Mesh(G.cone, qArrowMat);
    qArrowMesh.rotation.x = Math.PI / 2;
    qArrowMesh.scale.set(0.075, 0.15, 0.075);
    qArrowMesh.position.set(0, 0.025, 0.23);
    qArrowMesh.renderOrder = 996;
    questCompass.add(qRingMesh, qArrowMesh);
    questCompass.visible = false;
    cap.scene.add(questCompass);

    // ── 3D 衝刺與跳躍星塵粒子池（零 GC 負擔）
    const dustPool = Array.from({ length: 8 }, () => {
      const mat = new T.MeshBasicMaterial({ color: 0xffe49e, transparent: true, opacity: 0, depthWrite: false });
      const mesh = new T.Mesh(G.eye, mat);
      mesh.visible = false;
      cap.scene.add(mesh);
      return { mesh, mat, life: 0, maxLife: 0.45, vx: 0, vy: 0, vz: 0 };
    });
    let dustIdx = 0, lastStepDust = 0;
    const spawnDust = (x, y, z, count = 1, boost = false) => {
      for (let i = 0; i < count; i++) {
        const p = dustPool[dustIdx++ % dustPool.length];
        const ang = Math.random() * Math.PI * 2;
        const spd = boost ? 0.22 + Math.random() * 0.18 : 0.08 + Math.random() * 0.08;
        p.mesh.position.set(x + (Math.random() - 0.5) * 0.05, y + 0.02, z + (Math.random() - 0.5) * 0.05);
        p.vx = Math.cos(ang) * spd;
        p.vy = boost ? 0.32 + Math.random() * 0.2 : 0.15 + Math.random() * 0.1;
        p.vz = Math.sin(ang) * spd;
        p.maxLife = boost ? 0.5 : 0.35;
        p.life = p.maxLife;
        p.mat.color.setHex(boost ? 0xf5d33a : 0xfff3d1);
        p.mesh.visible = true;
      }
    };

    // ── 行走：沿一串點走，kind 'loop' 來回、'once' 走到終點觸發 after
    function startWalk(pts, kind, after, speed = SPEED) {
      const seg = [];
      let total = 0;
      for (let i = 1; i < pts.length; i++) {
        const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z);
        seg.push(d);
        total += d;
      }
      S.walk = { pts, seg, total, dist: 0, dir: 1, kind, after, speed, stride: speed > 0.8 ? 12 : 8 };
      S.idle = null;
    }
    const posOf = () => S.fig.group.position;
    const subjectGroup = () => (S.aim && S.aim.actor === 'puma' && S.puma ? S.puma.fig.group : S.fig.group); // 鏡頭追隨的對象
    const subjectPos = () => { // 合照時鏡頭對準兩人中點
      if (S.fitting && S.pair && S.puma && S.puma.fig.group.visible) {
        const mid = S.fig.group.position.clone().add(S.puma.fig.group.position).multiplyScalar(0.5);
        const rg = new T.Vector3(); // 右側有站方的按鈕列：中心往畫面右邊偏，兩人就稍微靠左，Puma 才不被按鈕擋住
        rg.setFromMatrixColumn(cap.camera.matrixWorld, 0); rg.y = 0;
        return mid.addScaledVector(rg.normalize(), 0.14);
      }
      return subjectGroup().position;
    };
    const here = () => ({ x: posOf().x, z: posOf().z, y: posOf().y });

    function setMission(m) {
      S.mission = { type: 'idle', label: '', routeIdx: -1, flow: null, targetId: null, ...m };
      S.arrived = null;
      S.stand = null; // 任何新行程都會結束定點站立
      if (ui.isOpen() && S.tab !== 'look') ui.render();
    }
    const showSay = (title, text, ms = 5000) => { S.say = { title, text, until: performance.now() + ms }; };

    // ── 角色防穿牆、防落水與絲滑滑行物理碰撞引擎（整合六角島嶼邊界、橋樑走廊與 3D 建築／河道碰撞體）
    const navData = hc.navData || {};
    const TOP_Y = navData.top ?? net.groundY ?? 0.65;
    const ISL_R = navData.islandRadius ?? 1.95;
    const islR = (isl) => (isl && isl.r) || ISL_R;
    // 六角島嶼平頂內切半徑（支援不同大小島嶼，如實習旅館專島 R=4.65）：扣除最外圈白邊路緣，確保人物絕不踏出島邊掉進河道
    const HEX_RI = (ISL_R - 0.085) * 0.8660254;
    const islHexRi = (isl) => (islR(isl) - 0.085) * 0.8660254;
    const CHAR_R = 0.068; // 角色水平碰撞半徑
    const navIslands = Array.isArray(navData.islandCenters) && navData.islandCenters.length
      ? navData.islandCenters
      : navData.islandCenters && typeof navData.islandCenters === 'object' && Object.keys(navData.islandCenters).length
        ? Object.entries(navData.islandCenters).map(([id, c]) => ({ id, x: c.x, z: c.z, r: c.r || ISL_R, name: c.name }))
        : (data ? data.islands.map((i) => ({ id: i.id, x: i.cx, z: i.cz, r: ISL_R })) : []);
    const navBridges = (navData.bridges || []).map((b) => {
      const ax = b.pa.x, az = b.pa.z, bx = b.pb.x, bz = b.pb.z;
      const dx = bx - ax, dz = bz - az, len = Math.hypot(dx, dz) || 1;
      return {
        ax, az, bx, bz,
        ux: dx / len, uz: dz / len,
        nx: -dz / len, nz: dx / len,
        len,
        halfW: b.halfW || 0.27, // 橋面可行走半寬（大幅加寬護欄緩衝，確保 WASD 與搖桿跨島順暢不卡橋頭）
        arch: b.arch || 0,
        deck: b.deck || 0.0175,
        // 2026-11-15: walkways that are not at island height (marina ramp and floating pontoons) give their own deck
        // heights at each end; the walker follows a straight slope between them
        y0: Number.isFinite(b.y0) ? b.y0 : null,
        y1: Number.isFinite(b.y1) ? b.y1 : null,
      };
    });
    const navObs = (navData.obstacles || []).map((o) => ({
      ...o,
      cx: o.cx ?? o.x,
      cz: o.cz ?? o.z,
      boundR: o.boundR ?? (o.type === 'circle' ? o.r : Math.hypot(o.hx || 0, o.hz || 0)),
    }));
    const HEX_DIRS = [0, 1, 2, 3, 4, 5].map((k) => {
      const a = (k * Math.PI) / 3;
      return { nx: Math.cos(a), nz: Math.sin(a) };
    });

    // 判斷點到六角島中心的平頂六角距離（<= HEX_RI 代表在島嶼陸地內）
    const hexMetric = (dx, dz) => {
      let m = 0;
      for (let k = 0; k < 3; k++) {
        const d = HEX_DIRS[k];
        const p = Math.abs(dx * d.nx + dz * d.nz);
        if (p > m) m = p;
      }
      return m;
    };

    const nearestIsland = (x, z) => {
      let best = null, bestSigned = Infinity, bestDist = Infinity;
      for (const isl of navIslands) {
        const d = Math.hypot(x - isl.x, z - isl.z);
        const signed = d - islR(isl);
        if (signed < bestSigned) { bestSigned = signed; bestDist = d; best = isl; }
      }
      return { island: best, dist: bestDist };
    };

    // 將點約束在六角島嶼邊界內（沿六角斜邊平滑滑動）
    const clampHex = (x, z, isl, limit = islHexRi(isl)) => {
      let dx = x - isl.x, dz = z - isl.z;
      for (let k = 0; k < 6; k++) {
        const d = HEX_DIRS[k];
        const proj = dx * d.nx + dz * d.nz;
        if (proj > limit) {
          const ex = proj - limit;
          dx -= d.nx * ex;
          dz -= d.nz * ex;
        }
      }
      return { x: isl.x + dx, z: isl.z + dz };
    };

    // 檢查是否在橋樑走廊（含橋頭漏斗緩衝區）
    const findBridge = (x, z, margin = 0) => {
      let best = null, bestLat = Infinity;
      for (const br of navBridges) {
        const rx = x - br.ax, rz = z - br.az;
        const s = rx * br.ux + rz * br.uz;
        if (s < -0.36 - margin || s > br.len + 0.36 + margin) continue;
        const t = rx * br.nx + rz * br.nz;
        const al = Math.abs(t);
        if (al <= br.halfW + margin && al < bestLat) {
          bestLat = al;
          best = { br, s, t };
        }
      }
      return best;
    };

    // 將角色從建築牆面、房屋、櫃台、公車、樹幹、島內運河水池等障礙物平滑推出（支援多角度滑行）
    const pushOutObstacles = (x, z, radius = CHAR_R) => {
      let px = x, pz = z, hit = false;
      for (let iter = 0; iter < 3; iter++) {
        let moved = false;
        for (let i = 0; i < navObs.length; i++) {
          const o = navObs[i];
          const dx = px - o.cx, dz = pz - o.cz;
          if (Math.abs(dx) > o.boundR + radius || Math.abs(dz) > o.boundR + radius) continue;
          if (o.type === 'circle') {
            const minD = o.r + radius;
            const d2 = dx * dx + dz * dz;
            if (d2 < minD * minD) {
              const d = Math.sqrt(d2) || 0.0001;
              const pen = minD - d;
              px += (dx / d) * pen;
              pz += (dz / d) * pen;
              moved = true; hit = true;
            }
          } else {
            const lx = dx * o.cos + dz * o.sin;
            const lz = -dx * o.sin + dz * o.cos;
            const cx = Math.max(-o.hx, Math.min(o.hx, lx));
            const cz = Math.max(-o.hz, Math.min(o.hz, lz));
            const ex = lx - cx, ez = lz - cz;
            const d2 = ex * ex + ez * ez;
            if (d2 < radius * radius) {
              let nlx = 0, nlz = 0, pen = 0;
              if (d2 > 1e-7) {
                const d = Math.sqrt(d2);
                pen = radius - d;
                nlx = ex / d; nlz = ez / d;
              } else {
                const pxPen = o.hx + radius - Math.abs(lx);
                const pzPen = o.hz + radius - Math.abs(lz);
                if (pxPen < pzPen) {
                  pen = pxPen; nlx = lx >= 0 ? 1 : -1;
                } else {
                  pen = pzPen; nlz = lz >= 0 ? 1 : -1;
                }
              }
              const wx = nlx * o.cos - nlz * o.sin;
              const wz = nlx * o.sin + nlz * o.cos;
              px += wx * (pen + 0.0015);
              pz += wz * (pen + 0.0015);
              moved = true; hit = true;
            }
          }
        }
        if (!moved) break;
      }
      return { x: px, z: pz, hit };
    };

    // 計算合法地面高度（排除樹冠、燈球、招牌與河道峭壁，避免角色跳上屋頂或樹頂卡死）
    const groundHeightAt = (x, z, brInfo) => {
      if (brInfo) {
        const { br, s } = brInfo;
        const u = Math.max(0, Math.min(1, s / br.len));
        if (br.y0 !== null && br.y1 !== null) return br.y0 + (br.y1 - br.y0) * u + Math.sin(u * Math.PI) * br.arch;
        return TOP_Y + Math.sin(u * Math.PI) * br.arch + br.deck;
      }
      if (typeof hc.groundAt === 'function') {
        const y = hc.groundAt(x, z, TOP_Y + 0.11, 0.35);
        if (y !== null && y >= TOP_Y - 0.04 && y <= TOP_Y + 0.09) return y;
      }
      return TOP_Y + 0.015;
    };

    // 綜合檢查並修正單步目標位置（處理：橋面走廊 + 六角島陸地邊界 + 橋頭漏斗導引 + 建築牆體滑行）
    const solveWalkPos = (rawX, rawZ, curX, curZ, radius = CHAR_R) => {
      let x = rawX, z = rawZ;
      // 1. 先從建築牆體與島內河道推出
      const p1 = pushOutObstacles(x, z, radius);
      x = p1.x; z = p1.z;

      // 2. 檢查是否在橋樑或六角島陸地內
      let brInfo = findBridge(x, z, 0);
      const { island: isl } = nearestIsland(x, z);
      const inHex = isl ? hexMetric(x - isl.x, z - isl.z) <= islHexRi(isl) : false;

      if (brInfo && !inHex) {
        // 在跨河橋面上：限制在橋面護欄內側滑動
        const { br, s, t } = brInfo;
        const ct = Math.max(-br.halfW, Math.min(br.halfW, t));
        x = br.ax + br.ux * s + br.nx * ct;
        z = br.az + br.uz * s + br.nz * ct;
      } else if (!inHex) {
        // 超出島嶼邊界：若靠近橋頭（含寬廣漏斗區）則平滑導引上橋，否則沿六角島緣滑行（絕不落入河中）
        const nearBr = findBridge(x, z, 0.56);
        if (nearBr && nearBr.s >= -0.45 && nearBr.s <= nearBr.br.len + 0.45) {
          const { br, s, t } = nearBr;
          const ct = Math.max(-br.halfW, Math.min(br.halfW, t));
          const cs = Math.max(-0.18, Math.min(br.len + 0.18, s));
          x = br.ax + br.ux * cs + br.nx * ct;
          z = br.az + br.uz * cs + br.nz * ct;
          brInfo = { br, s: cs, t: ct };
        } else if (isl) {
          const cl = clampHex(x, z, isl, islHexRi(isl));
          x = cl.x; z = cl.z;
        }
      }

      // 3. 再次確認推離牆體後仍在合法陸地或橋面內
      const p2 = pushOutObstacles(x, z, radius);
      x = p2.x; z = p2.z;
      const { island: isl2 } = nearestIsland(x, z);
      const br2 = findBridge(x, z, 0.02);
      const inHex2 = isl2 ? hexMetric(x - isl2.x, z - isl2.z) <= islHexRi(isl2) + 0.01 : false;
      if (!inHex2 && !br2) {
        if (isl2) {
          const cl2 = clampHex(x, z, isl2, islHexRi(isl2));
          x = cl2.x; z = cl2.z;
          const p3 = pushOutObstacles(x, z, radius);
          if (hexMetric(p3.x - isl2.x, p3.z - isl2.z) <= islHexRi(isl2) + 0.015) {
            x = p3.x; z = p3.z;
          } else {
            return null;
          }
        } else {
          return null;
        }
      }

      const y = groundHeightAt(x, z, br2 && !inHex2 ? br2 : null);
      const moved = Math.hypot(x - curX, z - curZ);
      return { x, y, z, moved };
    };

    // 單幀玩家移動步進器：先嘗試直接滑行，若遇到死角則自動測試左右偏角（±25° ~ ±95°）順暢繞開，徹底消除卡死
    const stepCharacter = (curX, curY, curZ, vx, vz, stepDist) => {
      const subSteps = Math.max(1, Math.ceil(stepDist / 0.04));
      const subDist = stepDist / subSteps;
      let x = curX, y = curY, z = curZ;

      for (let s = 0; s < subSteps; s++) {
        const direct = solveWalkPos(x + vx * subDist, z + vz * subDist, x, z, CHAR_R);
        if (direct && direct.moved >= subDist * 0.22) {
          x = direct.x; y = direct.y; z = direct.z;
          continue;
        }
        // 若正前方被轉角或柱子擋住，嘗試微調方向角滑過障礙物
        const baseAng = Math.atan2(vz, vx);
        let best = direct && direct.moved > 0.0005 ? direct : null;
        let bestScore = best ? best.moved * 0.6 : 0;
        const angles = [0.42, -0.42, 0.85, -0.85, 1.25, -1.25, 1.62, -1.62];
        for (const da of angles) {
          const a = baseAng + da;
          const tvx = Math.cos(a), tvz = Math.sin(a);
          const cand = solveWalkPos(x + tvx * subDist, z + tvz * subDist, x, z, CHAR_R);
          if (cand && cand.moved > 0.001) {
            const align = Math.max(0.15, Math.cos(da));
            const score = cand.moved * align;
            if (score > bestScore) {
              bestScore = score;
              best = cand;
            }
          }
        }
        if (best) {
          x = best.x; y = best.y; z = best.z;
        } else {
          break;
        }
      }
      // 跨島水道輕躍導引：當玩家按住 WASD 在島緣朝相鄰島嶼推進（且該處無橋樑直通）時，自動平滑輕躍過河道登上鄰島，徹底消除跨島死角
      if (Math.hypot(x - curX, z - curZ) < stepDist * 0.35) {
        const { island: curIsl } = nearestIsland(x, z);
        if (curIsl && hexMetric(x - curIsl.x, z - curIsl.z) >= islHexRi(curIsl) - 0.18) {
          const outDot = (x - curIsl.x) * vx + (z - curIsl.z) * vz;
          if (outDot > 0.08) {
            for (const hopD of [0.55, 0.85, 1.15, 1.48, 1.85, 2.25, 2.68, 3.15]) {
              const hx = x + vx * hopD, hz = z + vz * hopD;
              const { island: nxtIsl } = nearestIsland(hx, hz);
              if (nxtIsl && nxtIsl.id !== curIsl.id && hexMetric(hx - nxtIsl.x, hz - nxtIsl.z) <= islHexRi(nxtIsl) - 0.08) {
                const land = solveWalkPos(hx, hz, hx, hz, CHAR_R);
                if (land && Math.hypot(land.x - hx, land.z - hz) <= 0.32) {
                  S.jumpY = Math.max(S.jumpY || 0, 0.24);
                  S.jumpVel = Math.max(S.jumpVel || 0, 0.92);
                  spawnDust(land.x, land.y, land.z, 5, true);
                  return { x: land.x, y: land.y, z: land.z };
                }
              }
            }
          }
        }
      }
      return { x, y, z };
    };

    // 取得同島最近的步道節點（避免隔著河道抓到對岸島嶼的節點而直線穿河）
    const nearestNodeOnIsland = (x, z) => {
      const { island: targetIsl } = nearestIsland(x, z);
      let bestSame = null, dSame = Infinity;
      let bestAny = null, dAny = Infinity;
      for (const n of net.nodes) {
        const d = Math.hypot(n.x - x, n.z - z);
        if (d < dAny) { dAny = d; bestAny = n; }
        if (targetIsl && Math.hypot(n.x - targetIsl.x, n.z - targetIsl.z) <= islR(targetIsl) + 0.15) {
          if (d < dSame) { dSame = d; bestSame = n; }
        }
      }
      return bestSame ? { node: bestSame, dist: dSame } : { node: bestAny, dist: dAny };
    };

    // 點擊地面或前往建築時，將起點／終點間的局部路徑切分為避障折線（不穿牆、不穿河）
    const traceLocalPath = (ax, ay, az, bx, by, bz, steps = 28) => {
      const pts = [];
      let cx = ax, cy = ay, cz = az;
      for (let s = 0; s < steps; s++) {
        const dx = bx - cx, dz = bz - cz;
        const dist = Math.hypot(dx, dz);
        if (dist < 0.05) break;
        const step = Math.min(0.08, dist);
        const nxt = stepCharacter(cx, cy, cz, dx / dist, dz / dist, step);
        if (Math.hypot(nxt.x - cx, nxt.z - cz) < 0.003) break;
        cx = nxt.x; cy = nxt.y; cz = nxt.z;
        pts.push({ x: cx, y: cy, z: cz });
      }
      return pts;
    };

    // 走到 (x, z) 附近的路網節點；支援同島智慧避障與跨島橋樑尋路（若跨獨立島區則自動啟用橋頭瞬移導引）
    function goTo(x, z, opts = {}) {
      const cur = here();
      const { island: curIsl, dist: curIslDist } = nearestIsland(cur.x, cur.z);
      // 若站在外島（拍照定點）離主島很遠：先回到最近的步道點，不在海上走
      const { node: start, dist: off } = nearestNodeOnIsland(cur.x, cur.z);
      if (!start) { showSay('走不到那裡', '找不到可以走的路。', 2500); return false; }
      if (curIslDist > islR(curIsl) + 0.6 || off > 3.8) {
        posOf().set(start.x, start.y, start.z);
      }
      const fromPos = here();
      const { node: end, dist: gap } = nearestNodeOnIsland(x, z);
      if (!end || gap > 4.8) { showSay('走不到那裡', '那附近沒有步道。', 2500); return false; }
      const nodes = net.path(start, end);
      let pts;
      if (nodes) {
        // 構建不穿牆、不落水的平滑路徑點
        const startBridge = traceLocalPath(fromPos.x, fromPos.y, fromPos.z, start.x, start.y, start.z, 24);
        pts = [fromPos, ...startBridge, ...nodes.map((n) => ({ x: n.x, z: n.z, y: n.y }))];
      } else {
        // 跨獨立島區：先瞬移至目標島入口步道節點並綻放星塵，再沿島內避障路徑走向目標
        posOf().set(end.x, end.y, end.z);
        spawnDust(end.x, end.y, end.z, 6, true);
        pts = [{ x: end.x, y: end.y, z: end.z }];
      }

      // 若是玩家點擊島上空地或指定建築，則從最近步道平滑走到該點（自動繞開牆體）
      let markX = end.x, markY = end.y, markZ = end.z;
      if (opts.directOk || !nodes) {
        const tail = traceLocalPath(end.x, end.y, end.z, x, end.y, z, 64);
        if (tail.length) {
          pts.push(...tail);
          const lastPt = tail[tail.length - 1];
          markX = lastPt.x; markY = lastPt.y; markZ = lastPt.z;
        }
      }
      if (pts.length < 2) {
        pts.push({ x: markX, y: markY, z: markZ });
      }
      destMark.position.set(markX, markY + 0.02, markZ);
      destMark.visible = true;
      const walkSpd = opts.speed || (S.drive ? 1.65 : SPEED);
      startWalk(pts, 'once', opts.after, walkSpd);
      if (opts.follow !== false && !S.follow) startFollow();
      return true;
    }

    const arrive = (b) => {
      destMark.visible = false;
      S.arrived = { building: b || null };
      S.idle = { since: performance.now() };
      if (b) {
        S.lastBuilding = b;
        showSay(`抵達：${b.name}`, b.facts[0] || (b.island && b.island.summary) || '');
      } else showSay('到了！', '');
      if (S.mission.type === 'wander') S.pause = { until: performance.now() + 5500, then: wanderNext };
      if (ui.isOpen() && S.tab !== 'look') ui.render();
    };

    // ── 手機：站方的側邊欄抽屜、介紹卡、即時日誌與圖層控制都是底部圖層，一次只開一個
    const isMobile = () => innerWidth <= 800;
    const siteLayerOpen = () => document.body.classList.contains('card-open')
      || document.body.classList.contains('log-open')
      || document.body.classList.contains('m-time')
      || !!document.querySelector('#sidebar.mobile-open');
    const closeSiteLayers = () => {
      const card = document.querySelector('#card-close');
      if (document.body.classList.contains('card-open') && card) card.click();
      const side = document.querySelector('#sidebar.mobile-open #mobile-close');
      if (side) side.click();
      const logClose = document.querySelector('#log-close');
      if (document.body.classList.contains('log-open') && logClose) logClose.click();
      const mobTime = document.querySelector('#mob-time');
      if (document.body.classList.contains('m-time')) {
        if (mobTime) mobTime.click();
        else document.body.classList.remove('m-time');
      }
    };
    // 選好行程後收合面板，讓出畫面看角色走路
    const autoMin = () => { if (isMobile() && ui.isOpen()) ui.setMin(true); };

    const isVis = (e) => !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 8;
    const overlap = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

    // 角色面板開啟時取代清單：桌面版藏起清單、面板佔用清單的欄位；清單原本是收起的，就先把欄位讓出來，關閉時再還原。
    // 面板開著時按「清單」：關掉角色面板、回到清單
    const appEl = document.querySelector('#app') || document.body;
    function ensureDock() {
      if (!ui.isOpen() || !ui.panel.parentElement || ui.panel.classList.contains('loose')) return;
      if (document.body.classList.contains('hm-docked')) return;
      // 清單原本是收起的：不把欄位讓回來（畫布會變窄、鏡頭看起來像突然縮放），面板直接疊在畫面右側；工具列由 CSS 移到面板左邊
      document.body.classList.add('hm-docked');
      remeasure();
    }
    function restoreSidebar(showList) {
      if (!document.body.classList.contains('hm-docked')) return;
      document.body.classList.remove('hm-docked');
      if (showList && !isMobile()) appEl.classList.remove('sidebar-hidden');
      remeasure();
    }
    const listBtn = document.querySelector('#sidebar-toggle');
    const onListBtn = (e) => {
      if (!ui.isOpen() || isMobile()) return; // 手機：站方打開清單抽屜，tick 會把角色面板收掉
      e.stopImmediatePropagation();
      e.preventDefault();
      ui.setOpen(false); cancelPlace(); cancelAim(); leaveFitting(); syncLimits();
      restoreSidebar(true);
    };
    if (listBtn) listBtn.addEventListener('click', onListBtn, true);
    undo.push(() => { if (listBtn) listBtn.removeEventListener('click', onListBtn, true); });

    // 角色（與頭上的名牌）可以待的區域，視窗座標：扣掉面板、介紹卡、以及擋在角色上方的 LOGO 與時間軸。
    // 手機橫放時站方左上角的 LOGO＋時間軸會佔到 y 176，剛好蓋住角色的頭
    const TAG_ROOM = 28;
    function freeRegion() {
      const r = canvas.getBoundingClientRect();
      const reg = { top: Math.max(r.top, 0), bottom: Math.min(r.bottom, innerHeight), left: Math.max(r.left, 0), right: Math.min(r.right, innerWidth) };
      const panelOpen = ui.isOpen() && !ui.isMin();
      const card = !isMobile() && document.body.classList.contains('card-open') && document.querySelector('#card');
      if (panelOpen) {
        const pr = ui.panel.getBoundingClientRect();
        if (isMobile()) reg.bottom = Math.min(reg.bottom, pr.top);
        else reg.right = Math.min(reg.right, pr.left);
      }
      if (isMobile()) {
        const tb = document.querySelector('nav.toolbar');
        if (tb && isVis(tb)) reg.bottom = Math.min(reg.bottom, tb.getBoundingClientRect().top - 6);
      }
      if (card && isVis(card)) reg.left = Math.max(reg.left, card.getBoundingClientRect().right);
      const cx = (reg.left + reg.right) / 2;
      for (const sel of ['.brand', '.hud']) {
        const e = document.querySelector(sel);
        if (!isVis(e)) continue;
        const b = e.getBoundingClientRect();
        if (b.left < cx + 70 && b.right > cx - 70 && b.top < innerHeight * 0.45) reg.top = Math.max(reg.top, b.bottom + 6);
      }
      return reg;
    }
    // 可用區域不夠高時，試衣鏡頭自動拉遠，讓角色（200px 等級）縮到放得進去；桌面大螢幕永遠是 1
    function autoCamScale() {
      const reg = freeRegion(), c = canvas.getBoundingClientRect();
      const H = Math.max(80, reg.bottom - (reg.top + TAG_ROOM));
      const px1 = 0.352 / (2 * FIT_OFFSET.length() * Math.tan(cap.camera.fov * Math.PI / 360)) * c.height; // 縮放 1 時，腳到頭頂的像素高
      return Math.max(1, px1 / (0.8 * H));
    }

    // 名牌與泡泡可以出現的區域（相對 canvas）：手機避開底部 App 導覽列與底部抽屜，桌面避開左側介紹卡與右側面板
    function freeBounds(r) {
      const fb = { L: 8, R: Math.min(r.width, innerWidth - r.left) - 8, T: isMobile() ? 66 : 124, B: Math.min(r.height, innerHeight - r.top) - 8 }; // 畫布可能比視窗大
      for (const sel of ['.brand', '.hud']) { // 頂部 LOGO 與桌面時間軸：名牌要在它們下面
        const e = document.querySelector(sel);
        if (isVis(e)) {
          const eb = e.getBoundingClientRect();
          if (eb.top < innerHeight * 0.45) fb.T = Math.max(fb.T, eb.bottom - r.top + 8);
        }
      }
      const card = document.body.classList.contains('card-open') && document.querySelector('#card');
      if (isMobile()) {
        fb.R = Math.min(r.width, innerWidth - r.left) - 10;
        const tops = [];
        const tb = document.querySelector('nav.toolbar');
        if (tb && isVis(tb)) tops.push(tb.getBoundingClientRect().top);
        if (ui.isOpen()) tops.push(ui.panel.getBoundingClientRect().top);
        const sheet = document.querySelector('#sidebar.mobile-open');
        if (sheet) tops.push(sheet.getBoundingClientRect().top);
        if (card) tops.push(card.getBoundingClientRect().top);
        const logEl = document.body.classList.contains('log-open') && document.querySelector('#log');
        if (logEl && isVis(logEl)) tops.push(logEl.getBoundingClientRect().top);
        const hudEl = document.body.classList.contains('m-time') && document.querySelector('.hud');
        if (hudEl && isVis(hudEl)) tops.push(hudEl.getBoundingClientRect().top);
        if (tops.length) fb.B = Math.min(...tops) - r.top - 4;
      } else {
        if (ui.isOpen()) fb.R = Math.min(fb.R, ui.panel.getBoundingClientRect().left - r.left - 8);
        if (card) fb.L = Math.max(fb.L, card.getBoundingClientRect().right - r.left + 8);
      }
      return fb;
    }

    // ── 各種行程
    function beginLoop(i) {
      const pts = routes[i].map((p) => ({ x: p.x, z: p.z, y: p.footY }));
      startWalk(pts, 'loop', null);
      S.arrived = null;
      destMark.visible = false;
    }
    function setRoute(i) {
      autoMin();
      const info = S.routeInfo[i], flow = info.flow;
      const names = info.islands.map((id) => (data && data.islandById.get(id) ? data.islandById.get(id).name : id));
      setMission({ type: 'route', routeIdx: i, flow, label: `沿 ${flow} 路線來回走：${names.join(' → ')}` });
      const p0 = routes[i][0];
      if (Math.hypot(p0.x - posOf().x, p0.z - posOf().z) < 0.2) beginLoop(i);
      else if (!goTo(p0.x, p0.z, { after: () => beginLoop(i) })) beginLoop(i);
    }
    function goBuilding(id) {
      const b = buildings.find((x) => x.id === id);
      if (!b) return;
      autoMin();
      setMission({ type: 'goto', targetId: id, label: `前往：${b.island.name} ·${b.name}` });
      S.ui.island = b.island.id;
      goTo(b.cx, b.cz, { after: () => arrive(b) });
    }
    function goIsland(id) {
      const is = data.islandById.get(id);
      autoMin();
      setMission({ type: 'goto', targetId: '__island', label: `前往：${is.name}` });
      goTo(is.cx, is.cz, { after: () => arrive(null) });
    }
    function wanderNext() {
      if (S.mission.type !== 'wander' || !buildings.length) return;
      let b;
      do { b = buildings[Math.floor(Math.random() * buildings.length)]; } while (buildings.length > 1 && S.lastBuilding && b.id === S.lastBuilding.id);
      S.mission.label = `自動逛逛中：前往 ${b.island.name} ·${b.name}`;
      S.mission.targetId = b.id;
      if (!goTo(b.cx, b.cz, { after: () => arrive(b) })) S.pause = { until: performance.now() + 1500, then: wanderNext };
      if (ui.isOpen() && S.tab !== 'look') ui.render();
    }
    function groundPoint(cx, cy, planeY = net.groundY) {
      const r = canvas.getBoundingClientRect();
      const ray = new T.Raycaster();
      ray.setFromCamera(new T.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1), cap.camera);
      const p = new T.Vector3();
      return ray.ray.intersectPlane(new T.Plane(new T.Vector3(0, 1, 0), -planeY), p) ? p : null;
    }
    function pickGround(cx, cy) {
      const p = groundPoint(cx, cy);
      if (!p) return;
      setMission({ type: 'goto', label: '前往：你在地圖上指定的地方' });
      goTo(p.x, p.z, { after: () => arrive(null), directOk: true });
    }

    // ── 追隨
    const startFollow = () => {
      if (!ensureControls()) { LOG('尚未取得 OrbitControls'); return; }
      if (hc.releaseCamera) hc.releaseCamera(); // 站方若正在飛行或追隨居民，先停掉，免得兩邊同時拉鏡頭
      S.follow = { anchor: null, sm: null, flyStart: performance.now(), from: { target: cap.controls.target.clone(), pos: cap.camera.position.clone() } };
      S.fig.ring.visible = subjectGroup() === S.fig.group;
    };
    const resumeFollowInPlace = () => {
      if (!ensureControls()) return;
      if (hc.releaseCamera) hc.releaseCamera();
      const c = cap.controls;
      const p = subjectPos().clone().add(followLift);
      const curDist = cap.camera.position.distanceTo(c.target);
      const tgtGap = Math.hypot(c.target.x - p.x, c.target.z - p.z);
      if (curDist >= 1.6 && curDist <= 18 && tgtGap <= 4.2) {
        const camOff = cap.camera.position.clone().sub(c.target);
        c.target.copy(p);
        cap.camera.position.copy(p).add(camOff);
        S.follow = {
          anchor: p.clone(),
          sm: p.clone(),
          tgt: c.target.clone(),
          landed: true,
          bias: null,
          lastT: performance.now(),
          flyStart: 0,
          fly: { dur: 1, lift: 0 },
          from: { target: p.clone(), pos: cap.camera.position.clone() },
        };
        S.fig.ring.visible = subjectGroup() === S.fig.group;
      } else {
        startFollow();
      }
    };
    const stopFollow = () => { S.follow = null; S.fig.ring.visible = false; applyPendingLimits(true); };
    // 試衣時放寬的鏡頭限制（最近距離、最低俯角），要等鏡頭飛離試衣近景後才還原；
    // 立刻還原的話，OrbitControls 會在同一幀把鏡頭硬拉到限制內，看起來像突然縮放
    // onlyIfInside：鏡頭已經在限制範圍內才還原（沒有在追隨時，等使用者自己拉遠後再還原），否則留到之後
    const applyPendingLimits = (onlyIfInside) => {
      const L = S.pendingLimits, c = cap.controls;
      if (!L || !c) return;
      if (onlyIfInside) {
        const off = cap.camera.position.clone().sub(c.target);
        const polar = Math.acos(Math.max(-1, Math.min(1, off.y / (off.length() || 1))));
        if (off.length() < L.minDistance - 1e-3 || polar > L.maxPolarAngle + 1e-3) return;
      }
      Object.assign(c, L);
      S.pendingLimits = null;
    };
    // 試衣與拍照要近一點、平視：站方限制了最近距離與最低俯角（約 3 單位、20°），這兩個分頁暫時放寬，離開時還原。
    // 原本的限制存在 baseLimits；還原時交給 pendingLimits，等鏡頭飛離（或使用者自己拉出）近景後才套回，免得突然縮放
    const relaxLimits = () => {
      const c = cap.controls;
      if (!c) return;
      if (!S.baseLimits) S.baseLimits = S.pendingLimits || { minDistance: c.minDistance, maxPolarAngle: c.maxPolarAngle };
      S.pendingLimits = null;
      c.minDistance = Math.min(c.minDistance, 1.6);
      c.maxPolarAngle = Math.max(c.maxPolarAngle, Math.PI / 2 - 0.05);
    };
    const syncLimits = () => {
      if (ui.isOpen() && (S.tab === 'look' || S.tab === 'photo')) relaxLimits();
      else if (S.baseLimits) { S.pendingLimits = S.baseLimits; S.baseLimits = null; }
    };

    // ── 試衣模式：面板開在「外觀」分頁時，把角色移到地圖上人最少、視野不被擋住的地方，停下來面向鏡頭。
    // 離開（切到「行程」或關閉面板）時回到原本的位置，繼續原本的路線或目的地。
    // 搜尋要發很多條射線（每條約 4 毫秒），改成 generator 分段執行：每幀只花約 6 毫秒，背景慢慢算，不會讓頁面卡住
    // ── 試衣點檢查（共用）：從試衣鏡頭看過去，頭與身體之間不能被擋；頭頂上方也不能有東西（例如被抬高的廣場地板蓋住）
    function fitScene() {
      const blockers = [], allMeshes = [];
      const skip = [S.fig.group, destMark, S.puma && S.puma.fig.group].filter(Boolean);
      cap.scene.traverse((o) => {
        if (!o.isMesh || !o.visible) return;
        if (skip.some((g) => g.getObjectById(o.id))) return;
        allMeshes.push(o);
        if (!(o.material && (o.material.transparent || o.material.opacity < 1))) blockers.push(o);
      });
      return { blockers, allMeshes, ray: new T.Raycaster() };
    }
    function fitVisible(c, sc, heights = [0.34, 0.12]) {
      return heights.every((hgt) => {
        const to = new T.Vector3(c.x, c.y + hgt, c.z);
        // 用實際的試衣鏡頭距離（縮放後會拉遠，中間可能多出遮擋物）
        const from = new T.Vector3(c.x, c.y, c.z).add(FIT_LIFT).add(fitOffsetFor(c));
        const d = to.clone().sub(from), dist = d.length();
        sc.ray.set(from, d.normalize());
        sc.ray.far = dist - 0.06;
        return sc.ray.intersectObjects(sc.blockers, false).length === 0;
      });
    }
    function fitHeadroom(c, sc) {
      sc.ray.set(new T.Vector3(c.x, c.y + 0.05, c.z), new T.Vector3(0, 1, 0));
      sc.ray.far = 0.6;
      return sc.ray.intersectObjects(sc.blockers, false).length === 0;
    }
    const fitClear = (c, sc) => fitHeadroom(c, sc) && fitVisible(c, sc);
    // 就地換裝：先用角色目前的位置；被樹或建築擋住時，試周圍 0.4／0.8 單位的 8 個方向，找第一個看得見全身的可走地面
    function hereFitSpot() {
      const g = S.fig.group, sc = fitScene();
      const at = { id: 'here', name: '目前位置', x: g.position.x, y: g.position.y, z: g.position.z };
      if (fitClear(at, sc)) return at;
      for (const rad of [0.4, 0.8]) for (let a = 0; a < 8; a++) {
        const x = at.x + Math.cos(a * Math.PI / 4) * rad, z = at.z + Math.sin(a * Math.PI / 4) * rad;
        const y = walkableY(x, z, at.y);
        if (y === null) continue;
        const c = { id: 'here', name: '目前位置附近', x, y, z };
        if (fitClear(c, sc)) return c;
      }
      return null;
    }

    function* computeFitSpot() {
      let slice = performance.now();
      const pause = function* () { if (performance.now() - slice > 6) { yield; slice = performance.now(); } };
      // 實體網格（略過半透明的光暈與陰影）與所有可見網格（偵測地面用）
      const sc = fitScene();
      const { blockers, allMeshes, ray } = sc;
      // 從試衣視角看過去，頭與身體之間不能有東西擋住
      const visible = (c, heights) => fitVisible(c, sc, heights);

      // A) 站方露出的兩個小島端點：走不到的圓形小島，周圍沒有任何路線，最不會有人經過。
      //    在端點附近細掃，找陸地（高度 0~0.6，比主島矮）上離邊緣最遠的平坦點
      const exposedEnds = () => {
        try { const r = hc.debug && hc.debug.routes; const v = typeof r === 'function' ? r() : r; return (v && v.ends) || []; } catch (e) { return []; } // 站方介面改了就略過
      };
      // 地點清單。兩座有特色的小島，頂面（草地、屋頂）有部分射線打不到，位置是用「在場景擺座標標記、對照畫面」量出來的：
      //  · 房屋島：一排五棟紅房子、旗子，站方露出的端點 B 就是它；用端點推算，佈局微調時才不會跑掉
      //  · 燈塔島：站方沒露出座標，驗證燈塔本體還在才使用
      const spots = [];
      const down = (x, z) => {
        if (typeof hc.groundAt === 'function') return hc.groundAt(x, z, 4, 9);
        ray.set(new T.Vector3(x, 4, z), new T.Vector3(0, -1, 0));
        ray.far = 9;
        const h = ray.intersectObjects(allMeshes, false)[0];
        return h ? h.point.y : null;
      };
      const endB = exposedEnds()[1];
      const hx = endB ? endB[0] + 0.05 : 9.45, hz = endB ? endB[1] + 0.6 : -9.0;
      const hy = down(hx, hz);
      if (hy !== null && hy >= 0.15 && hy <= 0.65) spots.push({ id: 'houses', name: '房屋小島', x: hx, y: hy, z: hz }); // 高度以站方 groundAt 為準（實測 0.15~0.20）
      const lhBase = down(12.3, 4.3); // 燈塔本體與草頂都打不到射線，但底座的岩石、沙洲圓盤打得到（水面是 -0.18）
      if (lhBase !== null && lhBase > -0.1) spots.push({ id: 'lighthouse', name: '燈塔小島', x: 11.85, y: 0.16, z: 4.25 }); // 正上方量過：島緣南端 z≈4.85，燈塔在 (11.8, 3.8)
      // 沙灘傘島的頂面同樣打不到射線，位置是用座標標記對照畫面量出來的；驗證附近有任何不是水面的東西（傘、毛巾、岩石）才使用
      // （風車小島試過：風力發電機太高，近看只剩兩根白柱，拉遠又太小，效果不好，已捨棄）
      const landNear = (x, z, r) => {
        for (let dx = -r; dx <= r; dx += 0.5) for (let dz = -r; dz <= r; dz += 0.5) { const y = down(x + dx, z + dz); if (y !== null && y > -0.1) return true; }
        return false;
      };
      if (landNear(9.4, 10.7, 0.8)) spots.push({ id: 'beach', name: '沙灘傘小島', x: 9.4, y: 0.08, z: 10.85 });                 // 兩把傘與彩色毛巾；沙洲很小（約 x 8.7~10.0、z 9.95~11.3）。用正上方視角量過：先前用低角度量成 z 11.6，其實在沙洲南緣外的海上
      if (landNear(-6.6, -10.7, 0.8)) spots.push({ id: 'cottages', name: '雙屋小島', x: -6.6, y: 0.08, z: -10.45, camScale: 1.25 }); // 正上方量過：草地 z -10.5~-10.0，島緣南端 z≈-9.8；兩間小屋之間 x≈-6.6 // 兩間小屋（青綠與橘色屋頂）、中間一塊草地、東側木棧橋
      // 洋流號（卡車小島）：圓形平台，中間一輛橘色小卡車、北側紅色看板。站在卡車南側空地（正上方量過：平台中心 (-11.2,-1.7)、半徑約 1.5，卡車南緣 z≈-1.3），平台面 0.34
      if (landNear(-11.2, -1.2, 0.8)) spots.push({ id: 'truck', name: '洋流號', x: -11.2, y: 0.34, z: -0.95 });
      // 拍照時的可站範圍：以站位為原點的長方形 [x 最小, x 最大, z 最小, z 最大]（正上方畫圈量過，避開房子、卡車、樹與島緣）。
      // 在範圍內點哪就站哪，微調也限制在範圍內。一座島可以有好幾塊；第五個數字是這一塊的站立高度（站在車上這類高處才需要，沒寫就用地面）。
      // 洋流號：車前地面一長條（車頭那側到島緣前為止）＋後面咖啡色車斗（欄杆內；橘色車廂與引擎蓋不能站）
      const RECTS = {
        houses: [[-0.6, 0.6, -0.5, 0.05]], lighthouse: [[-0.55, 0.15, -0.45, 0.15]], beach: [[-0.45, 0.45, -0.15, 0.12]], cottages: [[-0.4, 0.35, -0.12, 0.15]],
        truck: [[-0.4, 0.8, -0.15, 0.17], [-0.36, -0.07, -0.75, -0.35, 0.89]],
      };
      for (const sp of spots) {
        const rs = RECTS[sp.id];
        if (rs) { sp.rects = rs.map((r) => ({ x0: sp.x + r[0], x1: sp.x + r[1], z0: sp.z + r[2], z1: sp.z + r[3], y: r[4] === undefined ? sp.y : r[4] })); }
      }
      // 這些小島座標是依舊地圖量好的：地圖改版後可能被新的建物或抬高的地板蓋住。
      // 腳下地面明顯比預期高（被蓋住）、頭頂有東西、或從鏡頭看不到全身的，一律略過
      const okSpots = spots.filter((sp) => {
        const gy = down(sp.x, sp.z);
        if (gy !== null && gy > sp.y + 0.06) return false;
        return fitClear(sp, sc);
      });
      if (okSpots.length) return okSpots;

      // B) 找不到小島：退回大島上離路線最遠的空地
      // 1) 候選點：每個步道點旁 1.6／2.4／3.2 單位處的 8 個方向；只留下「離所有路線點都 ≥ 1.3 單位」的空地
      //    （路網本身就是由路線合併而成，每個步道點都有路線經過，所以必須離開步道才不會有人走過；
      //     步道幾乎鋪滿整座島，要求 ≥ 2 單位時一個合格的點都找不到）
      const cell = 1.0, grid = new Map(), co = (v) => Math.floor(v / cell);
      for (const r of routes) for (const p of r) {
        const k = co(p.x) + ',' + co(p.z);
        (grid.get(k) || grid.set(k, []).get(k)).push(p);
      }
      const CAP = 3;
      const clearance = (x, z) => {
        let best = CAP;
        const cx = co(x), cz = co(z);
        for (let i = -CAP; i <= CAP; i++) for (let j = -CAP; j <= CAP; j++) {
          const arr = grid.get((cx + i) + ',' + (cz + j));
          if (arr) for (const p of arr) { const d = Math.hypot(p.x - x, p.z - z); if (d < best) best = d; }
        }
        return best;
      };
      const seen = new Set(), cands = [];
      for (const n of net.main) {
        yield* pause();
        for (const rad of [1.6, 2.4, 3.2]) for (let a = 0; a < 8; a++) {
          const x = n.x + Math.cos(a * Math.PI / 4) * rad, z = n.z + Math.sin(a * Math.PI / 4) * rad;
          const key = Math.round(x / 0.6) + ',' + Math.round(z / 0.6);
          if (seen.has(key)) continue;
          seen.add(key);
          const c = clearance(x, z);
          if (c >= 1.3) cands.push({ x, y: n.y, z, c });
        }
      }
      cands.sort((a, b) => b.c - a.c);
      // 2) 腳下要是和步道同高的地面（不是屋頂、樹頂、石頭，也不是水面）
      const onGround = (c) => {
        ray.set(new T.Vector3(c.x, c.y + 2.5, c.z), new T.Vector3(0, -1, 0));
        ray.far = 6;
        const hit = ray.intersectObjects(blockers, false)[0];
        return !!hit && Math.abs(hit.point.y - c.y) < 0.05;
      };
      let tried = 0;
      for (const c of cands) {
        yield* pause();
        if (++tried > 400) break;
        if (onGround(c) && visible(c)) return [{ id: 'open', name: '大島空地', x: c.x, y: c.y, z: c.z }];
      }
      // 找不到「地面＋視線」都合格的空地：退而求其次，只要求腳下有地面，再不行就用最低人流的步道點
      const grounded = cands.find(onGround); // 備援，數量有限，不分段
      if (grounded) return [{ id: 'open', name: '大島空地', x: grounded.x, y: grounded.y, z: grounded.z }];
      const n0 = net.main[0];
      return n0 ? [{ id: 'node', name: '步道', x: n0.x, y: n0.y, z: n0.z }] : [];
    }
    const fitOffsetFor = (spot) => {
      const k = Math.max(spot.camScale || 1, autoCamScale()) * (S.pair ? 1.3 : 1); // 合照時拉遠，兩個人才都入鏡
      return k > 1.02 ? FIT_OFFSET.clone().multiplyScalar(k) : FIT_OFFSET;
    };
    // 試衣中「與領航員合照」：我和領航員分身 在地點上左右並排、一起面向試衣鏡頭。預設我在左、Puma 在右，可左右換邊
    const PAIR_D = 0.15; // 兩人各偏離地點中心 0.15（肩並肩靠近一點）
    function restorePumaFromFit() {
      const sv = S.fitPumaSaved;
      S.fitPumaSaved = null;
      if (!sv || !S.puma) return;
      S.puma.fig.group.visible = sv.vis;
      S.puma.fig.group.position.copy(sv.pos);
      S.puma.fig.group.rotation.y = sv.rotY;
      S.puma.stand = sv.stand;
    }
    // 試衣點的實際地面高度：小島的草頂是 InstancedMesh，要用各自的 raycast 才打得到；腳下取一圈取樣的最高點，不浮空
    function surfaceY(x, z, fallback) {
      if (typeof hc.groundAt === 'function') { // 官網版：站方提供的地面高度（略過行人、協作線、半透明特效）
        const y = hc.groundAt(x, z, fallback + 0.25, 1.2);
        if (y !== null && y > -0.1) return y;
      }
      const skip = [S.fig.group, S.puma && S.puma.fig.group].filter(Boolean);
      const meshes = [];
      cap.scene.traverse((o) => {
        if (!o.isMesh || o.isSkinnedMesh) return;
        for (let p = o; p; p = p.parent) if (!p.visible || skip.includes(p)) return;
        meshes.push(o);
      });
      const ray = new T.Raycaster(), dir = new T.Vector3(0, -1, 0);
      let best = null;
      for (const [dx, dz] of [[0, 0], [0.08, 0], [-0.08, 0], [0, 0.08], [0, -0.08]]) {
        ray.set(new T.Vector3(x + dx, fallback + 0.2, z + dz), dir); // 起點壓低，免得打到樹冠
        ray.far = 1;
        const hits = [];
        for (const m of meshes) m.raycast(ray, hits);
        for (const h of hits) if (h.point.y > -0.1 && (best === null || h.point.y > best)) best = h.point.y;
      }
      return best === null ? fallback : best;
    }
    function applyPair() {
      const spot = S.fitSpots && (S.fitSpots[S.fitIdx] || S.fitSpots[0]);
      if (!S.fitting || !spot) return;
      const yaw = Math.atan2(FIT_OFFSET.x, FIT_OFFSET.z);
      const me = S.fig.group;
      if (S.pair) {
        const pu = ensurePuma();
        if (!S.fitPumaSaved) S.fitPumaSaved = { vis: pu.fig.group.visible, pos: pu.fig.group.position.clone(), rotY: pu.fig.group.rotation.y, stand: pu.stand };
        const sgn = S.pairSwap ? -1 : 1;
        const mx = spot.x - sgn * PAIR_D, px = spot.x + sgn * PAIR_D;
        me.position.set(mx, surfaceY(mx, spot.z, spot.y), spot.z);
        pu.fig.group.position.set(px, surfaceY(px, spot.z, spot.y), spot.z);
        pu.fig.group.visible = true;
        pu.fig.group.rotation.y = yaw;
        pu.stand = null;
      } else {
        me.position.set(spot.x, spotY(spot), spot.z);
        restorePumaFromFit();
      }
      me.rotation.y = yaw;
      followOffset = fitOffsetFor(spot);
      refly();
    }
    const refly = () => { S.follow = null; startFollow(); };
    // 就地點的高度就是角色原本站的高度；固定小島才需要重新量地面
    const spotY = (sp) => (sp.id === 'here' ? sp.y : surfaceY(sp.x, sp.z, sp.y));
    function enterFitting() {
      if (S.fitting) return;
      if (!S.fitIslandSpots) { // 背景還沒算完：接著同一個搜尋一次跑完
        const it = S.fitGen || computeFitSpot();
        S.fitGen = null;
        let r;
        while (!(r = it.next()).done);
        S.fitIslandSpots = r.value;
      }
      // 就地換裝優先；「換一個」可再切到試衣小島
      const here = hereFitSpot();
      S.fitSpots = [here, ...(S.fitIslandSpots || [])].filter(Boolean);
      S.fitIdx = 0;
      const spot = S.fitSpots[0];
      if (!spot) return;
      S.fitting = true;
      S.fitSaved = { walk: S.walk, idle: S.idle, pos: posOf().clone(), rotY: S.fig.group.rotation.y, mark: destMark.visible };
      S.walk = null;
      S.idle = null;
      S.say = null;
      destMark.visible = false;
      posOf().set(spot.x, spotY(spot), spot.z); // 就地換裝時位置不變
      S.fig.group.rotation.y = Math.atan2(FIT_OFFSET.x, FIT_OFFSET.z); // 面向試衣視角的鏡頭
      followOffset = fitOffsetFor(spot);
      followLift = FIT_LIFT;
      // 站方限制了最近距離與最低俯角（約 3 單位、20°），試衣要近一點、平視，暫時放寬，離開時還原
      relaxLimits();
      refly();
      if (S.pair) applyPair();
    }
    function leaveFitting() {
      if (!S.fitting) return;
      const sv = S.fitSaved;
      restorePumaFromFit();
      S.fitting = false;
      S.fitSaved = null;
      followOffset = FOLLOW_OFFSET;
      followLift = new T.Vector3();
      S.walk = sv.walk;
      S.idle = sv.idle;
      destMark.visible = sv.mark;
      if (!sv.walk) { posOf().copy(sv.pos); S.fig.group.rotation.y = sv.rotY; } // 原本是停著的：放回原處（行走中的由 tick 依路徑擺位）
      refly(); // 一律平順飛回一般追隨視角，落地後才還原鏡頭限制
    }
    // 試衣中直接切到「拍照」分頁：不回主島，我和領航員分身 就站在現在的位置（左右並排、面向鏡頭），之後再用拍照功能調整
    function keepFitHere() {
      const spot = S.fitSpots && (S.fitSpots[S.fitIdx] || S.fitSpots[0]);
      if (!S.fitting || !spot) return;
      const yaw = Math.atan2(FIT_OFFSET.x, FIT_OFFSET.z), sgn = S.pairSwap ? -1 : 1;
      const mx = spot.x - sgn * PAIR_D, px = spot.x + sgn * PAIR_D;
      const my = surfaceY(mx, spot.z, spot.y), py = surfaceY(px, spot.z, spot.y);
      const pu = ensurePuma();
      restorePumaFromFit();
      S.fitting = false;
      S.fitSaved = null;
      followOffset = FOLLOW_OFFSET;
      followLift = new T.Vector3();
      S.walk = null; S.idle = null; S.say = null;
      destMark.visible = false;
      setMission({ type: 'stand', label: `定點站立：${spot.name}（選別的行程就會離開）` }); // 會清掉舊的 S.stand，所以站位在它之後設
      S.fig.group.position.set(mx, my, spot.z);
      S.fig.group.rotation.y = yaw;
      S.stand = { x: mx, y: my, z: spot.z, yaw };
      pu.fig.group.visible = true;
      pu.fig.group.position.set(px, py, spot.z);
      pu.fig.group.rotation.y = yaw;
      pu.stand = { x: px, y: py, z: spot.z, yaw };
      refly();
    }
    const stepFollow = (now) => {
      const c = cap.controls, p = subjectPos().clone().add(followLift), f = S.follow;
      // 站方或使用者把鏡頭帶走了（點介紹卡、全景、選居民、右鍵大幅平移）：交還鏡頭；自由操控模式下允許單指／滑鼠自由環繞旋轉與滾輪縮放而不斷開追隨
      const releaseThresh = S.drive ? 2.4 : 0.0025;
      if (f.tgt && c.target.distanceToSquared(f.tgt) > releaseThresh) { stopFollow(); return; }
      const dt = Math.min(0.1, Math.max(0, (now - (f.lastT || now)) / 1000));
      f.lastT = now;
      if (!f.fly) {
        // 飛行參數在起飛時算一次：距離遠就飛久一點。
        // 只有起點與終點都低（近景到近景，例如換試衣地點）、直線會穿過建築時才往上拱；從高處飛下來不另外拱，免得先拉遠再拉近
        const dist = Math.hypot(p.x - f.from.target.x, p.z - f.from.target.z);
        const endY = p.y + followOffset.y, midY = (f.from.pos.y + endY) / 2;
        const clear = Math.max(f.from.target.y, p.y) + Math.min(14, 1.2 + dist * 0.5);
        f.fly = { dur: 900 + Math.min(700, dist * 45), lift: dist > 1.5 ? Math.max(0, clear - midY) : 0 };
      }
      const t = Math.min(1, (now - f.flyStart) / f.fly.dur);
      if (t < 1) {
        const e = t * t * (3 - 2 * t), arc = Math.sin(Math.PI * e) * f.fly.lift;
        c.target.lerpVectors(f.from.target, p, e);
        c.target.y += arc * 0.35;
        cap.camera.position.lerpVectors(f.from.pos, p.clone().add(followOffset), e);
        cap.camera.position.y += arc;
        f.anchor = p.clone();
        f.sm = p.clone();
        f.tgt = c.target.clone();
        return;
      }
      if (!f.landed) { // 飛行結束的第一幀：準確落在終點（掉幀時最後一幀可能還沒到、拱起的高度也還沒歸零）
        f.landed = true;
        c.target.copy(p);
        cap.camera.position.copy(p).add(followOffset);
        f.anchor = p.clone();
        f.sm = p.clone();
        f.bias = null;
        applyPendingLimits();
      }
      // 追隨：鏡頭跟著一個平滑過的瞄準點走。水平方向緊跟；高度變化（橋、階梯、路線節點的高低差）慢慢跟，
      // 鏡頭就不會隨著腳底高度一跳一跳，看起來像在縮放晃動
      if (!f.sm) f.sm = p.clone();
      const kx = 1 - Math.exp(-dt * 12), ky = 1 - Math.exp(-dt * 3);
      f.sm.x += (p.x - f.sm.x) * kx;
      f.sm.z += (p.z - f.sm.z) * kx;
      f.sm.y += (p.y - f.sm.y) * ky;
      const delta = f.sm.clone().sub(f.anchor || f.sm);
      c.target.add(delta);
      cap.camera.position.add(delta);
      f.anchor = f.sm.clone();
      cap.camera.updateMatrixWorld(); // 平移後先更新矩陣，避讓面板的投影才不會用到上一幀的鏡頭（會來回微調而抖動）
      adjustBias(now);
      f.tgt = c.target.clone();
    };

    // 面板展開時，可見區域會被面板切走一塊（手機是下半部、桌面與橫放是右側）。
    // 把鏡頭平移（沿鏡頭的上方與右方），讓角色落在可見區域中央。
    // 鏡頭與 target 一起平移，每個軸用牛頓法逐幀逼近；面板收合或關閉時再平順歸零。
    function adjustBias(now) {
      const c = cap.controls, f = S.follow;
      if (!f.bias) f.bias = new T.Vector3();
      // 沿「鏡頭自己的右方與上方」平移（等同拖曳平移畫面）：角色大小不變，只在畫面上移動。
      // 不能沿地面方向推：俯角很低時那樣只會讓角色往後退變小，幾乎不會上移
      const camRight = new T.Vector3(), camUp = new T.Vector3(), camFwd = new T.Vector3();
      cap.camera.matrixWorld.extractBasis(camRight, camUp, camFwd);
      const r = canvas.getBoundingClientRect();
      // 站方在手機橫放時畫布比視窗高（例如畫布 660、視窗 440），所以「可見區域」要取畫布與視窗的交集，不能用畫布中心（見 freeRegion）
      const cropped = r.bottom > innerHeight + 2 || r.right > innerWidth + 2 || r.top < -2 || r.left < -2;
      const panelOpen = ui.isOpen() && !ui.isMin();
      const want = panelOpen || cropped;
      let shift = new T.Vector3();
      if (want) {
        // 可用區域的中心點（相對 canvas）；名牌要放在角色頭上，所以頂端多留一條名牌的高度
        if (!f.reg || now - f.regAt > 250) { f.reg = freeRegion(); f.regAt = now; } // 版面量測每 250ms 一次就夠
        const reg = f.reg;
        const goalX = (reg.left + reg.right) / 2 - r.left, goalY = (reg.top + TAG_ROOM + reg.bottom) / 2 - r.top;
        const at = (axis, off) => {
          const v = subjectPos().clone();
          v.addScaledVector(axis, -off);
          v.y += 0.2 * subjectGroup().scale.y;
          v.project(cap.camera);
          return { x: (v.x + 1) / 2 * r.width, y: (1 - v.y) / 2 * r.height };
        };
        const step = (axis, key, goal) => {
          const p0 = at(axis, 0)[key], sens = (at(axis, 0.05)[key] - p0) / 0.05;
          if (Math.abs(sens) < 1e-3) return 0;
          return Math.max(-0.3, Math.min(0.3, ((goal - p0) / sens) * 0.2));
        };
        shift.addScaledVector(camUp, step(camUp, 'y', goalY));
        shift.addScaledVector(camRight, step(camRight, 'x', goalX));
      } else if (f.bias.lengthSq() > 1e-8) {
        shift = f.bias.clone().multiplyScalar(-0.15);
      }
      if (shift.lengthSq() > 0) {
        c.target.add(shift);
        cap.camera.position.add(shift);
        f.bias.add(shift);
      }
    }

    // ── 定點站立（拍照用）：把「我的角色」或「Puma（複製）」放到指定位置、指定面向。
    // 流程：點場景選位置 → 調整面向（羅盤、按鈕）與微調位置 → 站在這裡。站定的角色站著不動，直到選別的行程；Puma 是複製的，站方主島領航員 照常走他的路。
    const ensurePuma = () => {
      if (!S.puma) {
        const fig = buildFigure(PUMA_LOOK);
        fig.group.visible = false;
        fig.pin.visible = false; // 拍照用，不要頭頂標記
        applyFigScale(fig);
        cap.scene.add(fig.group);
        S.puma = { fig, stand: null };
      }
      return S.puma;
    };
    const boundsDone = new WeakSet();
    const standMeshes = () => {
      const list = [];
      cap.scene.traverse((o) => {
        if (!o.isMesh || !o.visible || (o.material && (o.material.transparent || o.material.opacity < 1))) return;
        // InstancedMesh 的包圍球若在擺放實例之前算好，射線會整批略過（島頂、廣場點不到）；第一次用到時重算
        if (o.isInstancedMesh && !boundsDone.has(o)) { o.computeBoundingSphere(); boundsDone.add(o); }
        if (S.fig.group.getObjectById(o.id) || destMark.getObjectById(o.id) || aimArrow.getObjectById(o.id)) return;
        if (S.puma && S.puma.fig.group.getObjectById(o.id)) return;
        list.push(o);
      });
      return list;
    };
    // 站得住的地面：從 fromY 往下找第一個實體，高度要落在步道網的高度範圍附近（不是屋頂、水面或高處）
    const groundAt = (meshes, x, z, fromY) => {
      let y;
      if (typeof hc.groundAt === 'function') {
        y = hc.groundAt(x, z, fromY, 3);
        if (y === null) return null;
      } else {
        const ray = new T.Raycaster();
        ray.set(new T.Vector3(x, fromY, z), new T.Vector3(0, -1, 0));
        ray.far = 3;
        const hit = ray.intersectObjects(meshes, false)[0];
        if (!hit) return null;
        y = hit.point.y;
      }
      return y >= net.yMin - 0.25 && y <= net.yMax + 0.45 ? y : null;
    };
    // 鏡頭的地面方向：f = 畫面「遠方」、r = 畫面「右方」（羅盤與微調都以目前鏡頭為準）
    const camGround = () => {
      const rg = new T.Vector3(), up = new T.Vector3(), bk = new T.Vector3();
      cap.camera.matrixWorld.extractBasis(rg, up, bk);
      return { f: new T.Vector2(-bk.x, -bk.z).normalize(), r: new T.Vector2(rg.x, rg.z).normalize() };
    };
    const aimGroup = () => (S.aim.actor === 'puma' ? S.puma.fig.group : S.fig.group);
    const aimTheta = () => { // 目前面向在羅盤上的角度（0 = 畫面遠方，順時針為正）
      const { f, r } = camGround();
      const vx = Math.sin(S.aim.yaw), vz = Math.cos(S.aim.yaw);
      return Math.atan2(vx * r.x + vz * r.y, vx * f.x + vz * f.y);
    };

    // 點場景的位置 → 站位：先看是不是已知的小島站位（草頂射線打不到，高度是量好的），否則用射線找任意位置的地面
    function resolveSpot(cx, cy) {
      for (const sp of S.fitSpots || []) {
        if (sp.id === 'open' || sp.id === 'node' || sp.id === 'here') continue;
        const p = groundPoint(cx, cy, sp.y);
        if (!p) continue;
        if (sp.rects) { // 離任一塊長方形 1 單位內都算點到這座島：各塊用自己的站立高度投影，挑最近的一塊，落點夾進範圍內
          let best = null;
          for (const rc of sp.rects) {
            const q = groundPoint(cx, cy, rc.y);
            if (!q) continue;
            const x = Math.max(rc.x0, Math.min(rc.x1, q.x)), z = Math.max(rc.z0, Math.min(rc.z1, q.z));
            const d = Math.hypot(q.x - x, q.z - z);
            if (d < 1.0 && (!best || d < best.d - 1e-6 || (Math.abs(d - best.d) <= 1e-6 && rc.y > best.rc.y))) best = { rc, x, z, d };
          }
          if (best) return { x: best.x, y: surfaceY(best.x, best.z, best.rc.y), z: best.z, name: sp.name, rect: best.rc, rects: sp.rects };
        } else if (Math.hypot(p.x - sp.x, p.z - sp.z) < 1.4) return { x: sp.x, y: surfaceY(sp.x, sp.z, sp.y), z: sp.z, name: sp.name };
      }
      const meshes = standMeshes();
      const r = canvas.getBoundingClientRect();
      const ray = new T.Raycaster();
      ray.setFromCamera(new T.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1), cap.camera);
      const hit = ray.intersectObjects(meshes, false)[0];
      if (hit) { // 點到牆就站在牆前（往鏡頭退一點，避免卡進牆裡）
        const back = cap.camera.position.clone().sub(hit.point).setY(0).normalize().multiplyScalar(0.14);
        const x = hit.point.x + back.x, z = hit.point.z + back.z;
        const y = groundAt(meshes, x, z, hit.point.y + 0.3);
        if (y !== null) return { x, y, z, name: '指定位置' };
      }
      // 點到屋頂、樹冠這類高處：把視線投影到地面高度，站在它底下
      const p = groundPoint(cx, cy, net.groundY);
      if (p) {
        const y = groundAt(meshes, p.x, p.z, net.yMax + 1.2);
        if (y !== null) return { x: p.x, y, z: p.z, name: '指定位置' };
      }
      return null;
    }

    function startPlace(actor) {
      cancelAim();
      S.actor = actor;
      S.placing = true;
      S.pickMode = false;
      canvas.style.cursor = 'crosshair';
      autoMin();
      ui.render();
    }
    function cancelPlace() {
      if (!S.placing) return;
      S.placing = false;
      canvas.style.cursor = '';
      ui.render();
    }
    // 拍照時兩人的最小間距（貼得很近但不重疊）
    const MIN_GAP = 0.15;
    const otherPose = (actor) => (actor === 'puma' ? S.stand : (S.puma && S.puma.fig.group.visible ? S.puma.stand : null));
    // 這個點能不能站：小島看長方形範圍，其他地方看有沒有和原本差不多高的地面
    function standableAt(x, z, spot, meshes) {
      if (spot.rects) {
        for (const rc of spot.rects) if (x >= rc.x0 - 1e-6 && x <= rc.x1 + 1e-6 && z >= rc.z0 - 1e-6 && z <= rc.z1 + 1e-6) return { y: surfaceY(x, z, rc.y), rect: rc };
        return null;
      }
      const y = groundAt(meshes, x, z, spot.y + 0.6);
      return y !== null && Math.abs(y - spot.y) <= 0.35 ? { y } : null;
    }
    // 以想站的位置為中心，一圈一圈往外找最近的、離另一位至少 MIN_GAP 的可站點
    function findApart(spot, other, meshes) {
      for (let rad = 0.05; rad <= 1.0; rad += 0.05) {
        let best = null;
        for (let k = 0; k < 24; k++) {
          const ang = (k / 24) * Math.PI * 2, x = spot.x + Math.cos(ang) * rad, z = spot.z + Math.sin(ang) * rad;
          if (Math.hypot(other.x - x, other.z - z) < MIN_GAP - 1e-6) continue;
          const ok = standableAt(x, z, spot, meshes);
          if (!ok) continue;
          const d = Math.hypot(other.x - x, other.z - z); // 同一圈裡挑離另一位最遠的，站得更鬆
          if (!best || d > best.d) best = { x, z, y: ok.y, ...(ok.rect ? { rect: ok.rect } : {}), d };
        }
        if (best) { delete best.d; return best; }
      }
      return null;
    }
    function enterAim(spot) {
      const actor = S.actor;
      if (S.fitting) leaveFitting();
      S.placing = false;
      canvas.style.cursor = '';
      const yaw = Math.atan2(cap.camera.position.x - spot.x, cap.camera.position.z - spot.z); // 先面向鏡頭
      const meshes = standMeshes();
      // 另一位（我／Puma 分身）已經站在附近（間距不足 MIN_GAP）：在附近找一個站得住、又夠遠的點，不要疊在一起
      const other = otherPose(actor);
      if (other && Math.hypot(other.x - spot.x, other.z - spot.z) < MIN_GAP) {
        const alt = findApart(spot, other, meshes);
        if (alt) spot = { ...spot, ...alt };
        else showSay('這裡太擠', '附近放不下兩個人，請換個位置。', 2500);
      }
      if (actor === 'puma') {
        const pu = ensurePuma(), g = pu.fig.group;
        S.aim = { actor, x: spot.x, y: spot.y, z: spot.z, name: spot.name, yaw, meshes, rect: spot.rect,
          saved: { vis: g.visible, pos: g.position.clone(), rotY: g.rotation.y, stand: pu.stand } };
        g.visible = true;
        g.position.set(spot.x, spot.y, spot.z);
        g.rotation.y = yaw;
      } else {
        const g = S.fig.group;
        S.aim = { actor, x: spot.x, y: spot.y, z: spot.z, name: spot.name, yaw, meshes, rect: spot.rect,
          saved: { walk: S.walk, idle: S.idle, stand: S.stand, pos: g.position.clone(), rotY: g.rotation.y, mark: destMark.visible } };
        S.walk = null; S.idle = null; S.say = null;
        destMark.visible = false;
        g.position.set(spot.x, spot.y, spot.z);
        g.rotation.y = yaw;
      }
      aimArrow.visible = true;
      followOffset = FOLLOW_OFFSET;
      followLift = new T.Vector3();
      if (isMobile() && ui.isMin()) ui.setMin(false);
      if (S.follow) refly(); else startFollow();
      ui.render();
    }
    function cancelAim() {
      if (!S.aim) return;
      const a = S.aim, sv = a.saved;
      S.aim = null;
      aimArrow.visible = false;
      if (a.actor === 'puma') {
        const pu = S.puma;
        pu.fig.group.visible = sv.vis;
        pu.fig.group.position.copy(sv.pos);
        pu.fig.group.rotation.y = sv.rotY;
        pu.stand = sv.stand;
      } else {
        S.walk = sv.walk; S.idle = sv.idle; S.stand = sv.stand;
        destMark.visible = sv.mark;
        if (!sv.walk) { posOf().copy(sv.pos); S.fig.group.rotation.y = sv.rotY; }
      }
      if (S.follow) refly();
      ui.render();
    }
    function commitAim() {
      if (!S.aim) return;
      const a = S.aim;
      S.aim = null;
      aimArrow.visible = false;
      const pose = { x: a.x, y: a.y, z: a.z, yaw: a.yaw };
      if (a.actor === 'puma') {
        S.puma.stand = pose;
        stopFollow(); // 拍照要固定的畫面：鏡頭停在這裡，不要飛回我們的角色
        showSay('領航員已就位', a.name, 2500);
      } else {
        setMission({ type: 'stand', label: `定點站立：${a.name}（選別的行程就會離開）` });
        S.stand = pose; S.walk = null; S.idle = null;
        destMark.visible = false;
      }
      ui.render();
    }
    function removePuma() {
      if (!S.puma) return;
      S.puma.fig.group.visible = false;
      S.puma.stand = null;
      ui.render();
    }
    const aimSet = (yaw) => { S.aim.yaw = yaw; };
    function aimNudge(dx, dz) { // 以鏡頭為準的前後左右微調，每次 0.15；牆、島邊、高處會擋住
      if (!S.aim) return;
      const a = S.aim, { f, r } = camGround();
      let nx = a.x + (r.x * dx + f.x * dz) * 0.15, nz = a.z + (r.y * dx + f.y * dz) * 0.15;
      const o = otherPose(a.actor); // 不能越靠越近到小於最小間距（已經太近時，往遠離的方向還是可以走）
      const tooClose = (x, z) => !!o && Math.hypot(o.x - x, o.z - z) < MIN_GAP && Math.hypot(o.x - x, o.z - z) < Math.hypot(o.x - a.x, o.z - a.z);
      if (a.rect) { // 小島：限制在可站的長方形內，高度直接量表面
        const rc = a.rect;
        nx = Math.max(rc.x0, Math.min(rc.x1, nx)); nz = Math.max(rc.z0, Math.min(rc.z1, nz));
        if (Math.hypot(nx - a.x, nz - a.z) < 0.01) { showSay('到邊界了', '這座島只能在範圍內調整站位。', 1200); return; }
        if (tooClose(nx, nz)) { showSay('離另一位太近了', '兩個人要隔開一點。', 1200); return; }
        a.x = nx; a.z = nz; a.y = surfaceY(nx, nz, a.y);
        aimGroup().position.set(nx, a.y, nz);
        return;
      }
      const solved = solveWalkPos(nx, nz, a.x, a.z, CHAR_R);
      if (!solved || solved.moved < 0.01) { showSay('走不到那裡', '前面是牆、島邊，或河道。', 1200); return; }
      if (tooClose(solved.x, solved.z)) { showSay('離另一位太近了', '兩個人要隔開一點。', 1200); return; }
      a.x = solved.x; a.y = solved.y; a.z = solved.z;
      aimGroup().position.set(solved.x, solved.y, solved.z);
    }
    function aimFace(kind) {
      if (!S.aim) return;
      const a = S.aim;
      if (kind === 'camera' || kind === 'back') {
        a.yaw = Math.atan2(cap.camera.position.x - a.x, cap.camera.position.z - a.z) + (kind === 'back' ? Math.PI : 0);
      } else if (kind === 'building' && buildings.length) {
        let best = null, bd = Infinity;
        for (const b of buildings) { const d = Math.hypot(b.cx - a.x, b.cz - a.z); if (d < bd) { bd = d; best = b; } }
        a.yaw = Math.atan2(best.cx - a.x, best.cz - a.z);
        showSay(`面向：${best.name}`, '', 1500);
      }
    }
    function aimToward(cx, cy) { // 點場景上的任一處：角色轉過去面對那裡
      const a = S.aim;
      const p = a && groundPoint(cx, cy, a.y);
      if (p && Math.hypot(p.x - a.x, p.z - a.z) > 0.05) aimSet(Math.atan2(p.x - a.x, p.z - a.z));
    }
    function placeAt(cx, cy) {
      const sp = resolveSpot(cx, cy);
      if (!sp) { showSay('這裡不能站', '請點地面：步道旁、建築前、教室黑板前都可以。', 3000); return; }
      enterAim(sp);
    }

    // ── 面板與 API
    const api = {
      update(patch, rerender = true) {
        Object.assign(S.look, patch);
        saveLook(S.look);
        rebuild();
        window.htlSocial?.broadcastLook?.(S.look);
        if (rerender) ui.render();
      },
      setRole(role) { api.update({ role, ...rolePreset(role) }); },
      randomize() {
        const pick = (a) => a[Math.floor(Math.random() * a.length)];
        api.update({
          skin: pick(PALETTE.skin), hair: pick(PALETTE.hair), shirt: pick(PALETTE.shirt), pants: pick(PALETTE.pants),
          hatColor: pick(PALETTE.hatColor), hairStyle: pick(HAIR_STYLES)[0], eyes: pick(EYES)[0], mouth: pick(MOUTHS)[0],
        });
      },
      reset() { api.update({ ...DEFAULT_LOOK, name: S.look.name }); },
      randomNickname,
      // 首次使用時詢問一次名字（可略過）；已詢問過就不再出現
      maybeAskName() { if (!nameAsked()) api.askName(); },
      askName() { openNameCard(api, S); },
      openTransferExport: () => openXferExport(),
      openTransferImport: () => openXferImport(),
      setTab(tab) {
        S.tab = tab;
        if (tab !== 'photo') { cancelPlace(); cancelAim(); }
        if (ui.isOpen()) {
          if (tab === 'photo' && S.fitting) keepFitHere();
          else (tab === 'look' ? enterFitting : leaveFitting)();
        }
        syncLimits();
        ui.render();
      },
      // 換一個試衣地點（只在試衣中）：瞬間移過去，鏡頭跟著飛過去
      nextSpot() {
        if (!S.fitting || !S.fitSpots || S.fitSpots.length < 2) return;
        S.fitIdx = (S.fitIdx + 1) % S.fitSpots.length;
        const sp = S.fitSpots[S.fitIdx];
        posOf().set(sp.x, spotY(sp), sp.z);
        followOffset = fitOffsetFor(sp);
        refly();
        if (S.pair) applyPair();
        ui.render();
      },
      // 預覽方向：面向目前的鏡頭，或背對鏡頭（看背包、書包、馬尾）
      facing(back) {
        const g = S.fig.group;
        g.rotation.y = Math.atan2(cap.camera.position.x - g.position.x, cap.camera.position.z - g.position.z) + (back ? Math.PI : 0);
      },
      pickIsland(id) { S.ui.island = id; ui.render(); },
      setRoute, goBuilding, goIsland,
      // 定點站立（拍照）
      startPlace, cancelPlace, cancelAim, commitAim, removePuma, aimFace, aimNudge,
      aimDial(theta) { // 羅盤：theta 0 = 畫面遠方，順時針為正；依目前鏡頭換成世界朝向
        if (!S.aim) return;
        const { f, r } = camGround();
        aimSet(Math.atan2(f.x * Math.cos(theta) + r.x * Math.sin(theta), f.y * Math.cos(theta) + r.y * Math.sin(theta)));
      },
      aimTurn(deg) { if (S.aim) aimSet(S.aim.yaw + deg * Math.PI / 180); },
      toggleClean() { S.clean = !S.clean; ui.render(); },
      togglePose(side) { if (!S.aim) return; const po = S.pose[S.aim.actor]; po[side] = !po[side]; ui.render(); },
      togglePair() { S.pair = !S.pair; if (S.fitting) applyPair(); ui.render(); },
      swapPair() { S.pairSwap = !S.pairSwap; if (S.fitting && S.pair) applyPair(); ui.render(); },
      leaveStand() { setRoute(S.defaultRoute); },
      toggleDrive(force) {
        const next = typeof force === 'boolean' ? force : !S.drive;
        if (next) setTimeout(() => api.maybeAskName(), 400);
        S.drive = next;
        S.keys = { u: false, d: false, l: false, r: false };
        S.padHold = { u: false, d: false, l: false, r: false };
        if (next) {
          const introEl = document.getElementById('intro');
          if (introEl && !introEl.hidden) {
            if (typeof hc.closeIntro === 'function') hc.closeIntro();
            else introEl.hidden = true;
          }
          if (isMobile()) closeSiteLayers();
          cancelPlace();
          cancelAim();
          if (S.fitting) leaveFitting();
          S.pickMode = false;
          canvas.style.cursor = '';
          S.walk = null;
          S.pause = null;
          S.stand = null;
          destMark.visible = false;
          setMission({ type: 'drive', label: '🕹️ 自由操控模式（WASD／方向鍵／360° 搖桿或點擊地面）' });
          if (!S.follow) startFollow();
          autoMin();
          showSay('🕹️ RPG 實境操控已啟動', '使用 360° 搖桿或 WASD 移動，腳下黃金箭頭指引主線目標，靠近地標或師長按 E 互動！', 4000);
        } else {
          S.joy = { x: 0, z: 0, mag: 0 };
          questCompass.visible = false;
          if (S.mission.type === 'drive') {
            setMission({ type: 'idle', label: '已停止操控（站在原地）' });
          }
        }
        ui.render();
      },
      toggleSprint() {
        S.sprint = !S.sprint;
        ui.syncPad();
      },
      jump() {
        if (S.jumpY <= 0.01) {
          S.jumpVel = 1.45;
          const p = posOf();
          spawnDust(p.x, p.y, p.z, 5, true);
          window.__htlPassport?.sfx?.jump?.();
        }
      },
      cycleCamMode() {
        S.camMode = ((S.camMode || 0) + 1) % CAM_MODES.length;
        const m = CAM_MODES[S.camMode];
        followOffset = m.off;
        followLift = m.lift.clone();
        if (S.camMode === 1) relaxLimits();
        else if (!ui.isOpen()) syncLimits();
        if (S.follow) refly(); else startFollow();
        showSay(`🎥 視角切換：${m.label}`, '可隨時按 V 鍵或點擊視角鈕切換追隨鏡位', 2400);
        ui.syncPad();
      },
      teleportToIsland(islandId) {
        const navIsl = navIslands.find((x) => x.id === islandId);
        const islObj = data?.islandById?.get(islandId) || S.islands?.find((x) => x.id === islandId);
        if (!navIsl && !islObj) return;
        if (!S.drive) api.toggleDrive(true);
        const tx = navIsl ? navIsl.x : islObj.cx;
        const tz = navIsl ? navIsl.z : islObj.cz;
        const ty = surfaceY(tx, tz, 0.25);
        S.walk = null;
        S.pause = null;
        destMark.visible = false;
        posOf().set(tx, ty, tz);
        S.jumpY = 0.22;
        S.jumpVel = 0.65;
        spawnDust(tx, ty, tz, 8, true);
        window.__htlPassport?.sfx?.jump?.();
        const nm = navIsl?.name || (typeof islObj?.name === 'string' ? islObj.name : islObj?.name?.zh) || islandId;
        S.curIslandId = islandId;
        S.curIslandName = nm;
        window.__htlPassport?.visitIsland?.(islandId, false);
        if (S.follow) refly(); else startFollow();
        showSay(`⚡ 瞬間傳送：${nm}`, '已抵達主題島嶼中心！使用 360° 搖桿或 WASD 探索周邊建築與師長。', 3400);
        ui.syncPad();
      },
      walkToQuestTarget(targetOpt) {
        if (!S.drive) api.toggleDrive(true);
        const tp = window.__htlPassport?.getTargetPos?.();
        const tgt = targetOpt || window.__htlPassport?.getActiveChapterInfo?.()?.target;
        if (tgt && tgt.type === 'building') {
          const b = buildings.find((x) => x.id === tgt.id);
          if (b) {
            S.mission.type = 'drive';
            S.mission.label = `🧭 任務導航中：前往「${b.name}」`;
            showSay(`🧭 主線尋路：${b.name}`, '沿步道自動前往任務目標，隨時可推動搖桿或按 WASD 接手！', 3800);
            goTo(b.cx, b.cz, {
              directOk: true,
              speed: 1.75,
              after: () => {
                arrive(b);
                hc.selectBuilding?.(b.id);
              },
            });
            ui.syncPad();
            return;
          }
        }
        if (tgt && tgt.type === 'island' && data?.islandById?.has(tgt.id)) {
          const isl = data.islandById.get(tgt.id);
          const navIsl = navIslands.find((x) => x.id === tgt.id) || { x: isl.cx, z: isl.cz };
          S.mission.type = 'drive';
          S.mission.label = `🧭 任務導航中：前往「${isl.name}」`;
          showSay(`🧭 主線尋路：${isl.name}`, '沿跨島橋樑前往任務主題島，隨時可按 WASD 接手！', 3800);
          goTo(navIsl.x, navIsl.z, {
            directOk: true,
            speed: 1.75,
            after: () => {
              arrive(null);
              hc.selectIsland?.(isl.id);
            },
          });
          ui.syncPad();
          return;
        }
        if (tp) {
          S.mission.type = 'drive';
          S.mission.label = `🧭 任務導航中：前往「${tp.label}」`;
          showSay(`🧭 尋路前往：${tp.label}`, '正在帶領角色前往目標位置！', 3500);
          goTo(tp.x, tp.z, { directOk: true, speed: 1.75, after: () => arrive(null) });
          ui.syncPad();
        }
      },
      toggleWander() {
        if (S.drive) S.drive = false;
        if (S.mission.type === 'wander') { setMission({ type: 'idle', label: '' }); S.pause = null; return; }
        if (!buildings.length) return;
        autoMin();
        setMission({ type: 'wander', label: '自動逛逛中' });
        wanderNext();
      },
      togglePick() {
        if (S.drive) S.drive = false;
        S.pickMode = !S.pickMode;
        canvas.style.cursor = S.pickMode ? 'crosshair' : '';
        if (S.pickMode) autoMin();
        ui.render();
      },
      toggleMin() { ui.setMin(!ui.isMin()); },
      // ride a moving vehicle: getAnchor() → { x, y, z, yaw } every frame until unride(); walking input is paused
      ride(getAnchor) {
        if (typeof getAnchor !== 'function') return false;
        if (!S.drive) api.toggleDrive(true);
        S.walk = null;
        S.pause = null;
        S.vel.x = 0;
        S.vel.z = 0;
        S.ride = { get: getAnchor };
        return true;
      },
      // step off at a walkable point (a pontoon or a harbour island)
      unride(land) {
        if (!S.ride) return false;
        S.ride = null;
        const g = S.fig?.group;
        if (g && land) {
          let y = g.position.y;
          if (typeof hc.groundAt === 'function') {
            const gy = hc.groundAt(land.x, land.z, 3, 6);
            if (gy !== null && gy !== undefined) y = gy;
          }
          g.position.set(land.x, y, land.z);
        }
        return true;
      },
      goToPoint(tx, tz, label = '前往指定位置', afterCb = null) {
        if (!S.drive) api.toggleDrive(true);
        S.mission.type = 'drive';
        S.mission.label = `🧭 ${label}`;
        goTo(tx, tz, {
          directOk: true,
          speed: 1.75,
          after: () => {
            arrive(null);
            if (typeof afterCb === 'function') afterCb();
          },
        });
        ui.syncPad();
      },
      triggerEmote(kind = 'wave') {
        const EMOTE_TEXT = {
          wave: ['👋 揮手致意', '您好！很高興在高餐旅館島遇見您！'],
          bow: ['🙇 禮賓鞠躬', '歡迎蒞臨國立高雄餐旅大學旅館管理系！'],
          cheer: ['🎉 歡呼慶祝', '耶！一起探索五星級旅宿領航島！'],
          coffee: ['☕ 舉杯致意', '請享用迎賓咖啡，祝您有美好的一天！'],
        };
        const now = performance.now();
        S.emote = { kind, start: now, until: now + 2600 };
        const [title, body] = EMOTE_TEXT[kind] || EMOTE_TEXT.wave;
        showSay(title, body, 2600);
        if (kind === 'cheer' && S.jumpY <= 0.01) S.jumpVel = 1.15;
        window.htlSocial?.broadcastEmote?.(kind);
      },
      interactPrimary() {
        if (S.arrived && S.arrived.teacher) {
          if (window.htlSocial?.openTeacherDialogue) {
            window.htlSocial.openTeacherDialogue(S.arrived.teacher);
          } else {
            api.openCard();
          }
          return;
        }
        if (S.extNear) {
          if (S.extNear.kind === 'peer' && window.htlSocial?.openPeerDialogue) {
            window.htlSocial.openPeerDialogue(S.extNear.peerId);
            return;
          }
          if (S.extNear.kind === 'walker' && window.htlSocial?.openWalkerDialogue) {
            window.htlSocial.openWalkerDialogue(S.extNear.walker);
            return;
          }
        }
        if (S.arrived && (S.arrived.building || S.arrived.landmark)) {
          api.openCard();
          return;
        }
        api.triggerEmote('wave');
      },
      openRawCard() {
        if (S.arrived && (S.arrived.teacher || S.arrived.building || S.arrived.landmark)) {
          api.openCard();
          return;
        }
        if (S.extNear && S.extNear.kind === 'walker' && S.extNear.walker && typeof hc.selectWalker === 'function') {
          hc.selectWalker(S.extNear.walker.walkerIndex);
        }
      },
      openCard() {
        if (!S.arrived) return;
        if (S.arrived.teacher) {
          const t = S.arrived.teacher;
          if (t.kind === 'lord' && typeof hc.selectWalker === 'function') {
            hc.selectWalker(t.walkerIndex);
          } else if (t.id) {
            hc.selectTeacher?.(t.id);
            hc.speakTeacher?.(t.id, 'zh');
          }
          return;
        }
        if (S.arrived.landmark) {
          hc.selectLandmark?.(S.arrived.landmark.id, { keepCamera: !!S.drive });
          return;
        }
        if (S.arrived.building) {
          hc.selectBuilding?.(S.arrived.building.id, { keepCamera: !!S.drive });
        }
      },
      // 合照取景：角色站到主體前方、轉身面向鏡頭，鏡頭近距離構圖（角色在下三分之一、主體完整在背後），再開啟合照分享。
      // subject = { x, z, h（主體高度）, r（主體半徑）, place（相框地點名）, dir（偏好站位方向，世界座標單位向量）, stay（原地不動） }
      photoWith(subject = {}) {
        const c = cap.controls;
        if (!c || !Number.isFinite(subject.x)) return;
        if (!S.drive) api.toggleDrive(true);
        if (hc.releaseCamera) hc.releaseCamera();
        const h = Math.max(0.3, subject.h || 0.8),
          r = Math.max(0.15, subject.r || 0.35);
        const cur = posOf();
        // framing: the camera stays ~2 units from the avatar (it fills the lower third); a tall subject is handled by
        // perspective — the avatar steps further out from it until its top also fits inside the vertical field of view
        const fov = ((cap.camera.fov || 32) * Math.PI) / 180;
        const HC = 0.3; // camera height above the ground
        const fits = (ds, da) => Math.atan(Math.max(0, h - HC) / ds) + Math.atan(HC / da) <= fov * 0.8;
        // step out from the subject at most a little; past that the camera backs off instead
        const baseOff = Math.min(r + 1.2, Math.max(r + 0.42, (() => {
          for (let off = r + 0.42; off < r + 1.2; off += 0.1) if (fits(off + 2.0, 2.0)) return off;
          return r + 1.2;
        })()));
        const camDist = (off) => {
          let da = 2.0;
          while (da < 7 && !fits(off + da, da)) da += 0.25;
          return da;
        };
        const frame = (st) => {
          let ux = st.x - subject.x,
            uz = st.z - subject.z;
          const ul = Math.hypot(ux, uz) || 1;
          ux /= ul;
          uz /= ul;
          const da = camDist(ul);
          return { ux, uz, da, ds: ul + da, cam: { x: st.x + ux * da, z: st.z + uz * da } };
        };
        // passers-by standing between the camera and the avatar spoil the shot: count them for each candidate spot
        const people = window.heartCity?.peopleNear?.() || [];
        const blockers = (st, f) => {
          let n = 0;
          const ax = f.cam.x, az = f.cam.z, bx = st.x - ax, bz = st.z - az, L2 = bx * bx + bz * bz || 1;
          for (const [px, pz] of people) {
            const t = Math.max(0, Math.min(1, ((px - ax) * bx + (pz - az) * bz) / L2));
            if (t > 0.9) continue;
            if (Math.hypot(ax + bx * t - px, az + bz * t - pz) < 0.45) n++;
          }
          return n;
        };
        let stand = null;
        if (!subject.stay) {
          // prefer the side facing the current camera (or the given direction) so the view does not swing around
          const camP = cap.camera.position;
          const pref = subject.dir ? Math.atan2(subject.dir.z, subject.dir.x) : Math.atan2(camP.z - subject.z, camP.x - subject.x);
          let best = Infinity, k = 0;
          for (const rOff of [...new Set([baseOff, baseOff + 0.25, Math.max(r + 0.3, baseOff - 0.25), r + 0.42, r + 0.7])]) {
            for (const dAng of [0, 0.4, -0.4, 0.8, -0.8, 1.3, -1.3, Math.PI]) {
              k++;
              const cx = subject.x + Math.cos(pref + dAng) * rOff,
                cz = subject.z + Math.sin(pref + dAng) * rOff;
              const sv = solveWalkPos(cx, cz, cx, cz, CHAR_R);
              if (!sv || Math.hypot(sv.x - cx, sv.z - cz) > 0.12) continue;
              const st = { x: sv.x, z: sv.z };
              const score = blockers(st, frame(st)) * 10 + k * 0.05;
              if (score < best) [best, stand] = [score, st];
            }
          }
        }
        if (!stand) stand = { x: cur.x, z: cur.z };
        S.walk = null;
        S.pause = null;
        destMark.visible = false;
        const ty = surfaceY(stand.x, stand.z, cur.y);
        if (Math.hypot(cur.x - stand.x, cur.z - stand.z) > 0.05) {
          posOf().set(stand.x, ty, stand.z);
          spawnDust(stand.x, ty, stand.z, 6, true);
        }
        const f = frame(stand);
        // the avatar turns its back to the subject (faces the camera)
        S.fig.group.rotation.y = Math.atan2(f.ux, f.uz);
        stopFollow();
        if (!S.baseLimits) S.baseLimits = S.pendingLimits || { minDistance: c.minDistance, maxPolarAngle: c.maxPolarAngle };
        S.pendingLimits = null;
        c.minDistance = Math.min(c.minDistance, 1.2);
        c.maxPolarAngle = Math.max(c.maxPolarAngle, Math.PI / 2 - 0.02);
        const T3 = cap.camera.position.constructor;
        // aim halfway between the avatar's feet and the subject's top
        const top = Math.atan(Math.max(0.2, h - HC) / f.ds),
          bottom = Math.atan(HC / f.da);
        const pitch = (top - bottom) / 2;
        cap.camera.position.set(f.cam.x, ty + HC, f.cam.z);
        c.target.copy(new T3(f.cam.x - f.ux * f.da, ty + HC + f.da * Math.tan(pitch), f.cam.z - f.uz * f.da));
        c.update();
        S.photoClean = S.clean;
        S.clean = true; // no head marker, ground ring or quest beacon in the picture
        S.photoPose = true;
        setTimeout(() => api.triggerEmote('cheer'), 120);
        setTimeout(() => window.htlPhotoShare?.open?.({ place: subject.place || '' }), matchMedia('(prefers-reduced-motion: reduce)').matches ? 200 : 900);
      },
      // 合照視窗關閉：放寬的鏡頭限制交給 pendingLimits，使用者拉遠或角色再走動時才還原
      endPhotoPose() {
        if (!S.photoPose) return;
        S.photoPose = false;
        S.clean = !!S.photoClean;
        if (S.baseLimits) {
          S.pendingLimits = S.baseLimits;
          S.baseLimits = null;
        }
      },
      visitLandmark(lmId, { walkIfNear = false } = {}) {
        const lms = hc.landmarks || [];
        const lm = lms.find((x) => x.id === lmId);
        if (!lm) return;
        if (!S.drive) api.toggleDrive(true);
        if (hc.releaseCamera) hc.releaseCamera();
        const curP = posOf();
        const dist = Math.hypot(lm.x - curP.x, lm.z - curP.z);
        const navIsl = navIslands.find((x) => x.id === lm.island);
        let standX = lm.x, standZ = lm.z + 0.58;
        let found = false;
        const baseAng = navIsl ? Math.atan2(navIsl.z - lm.z, navIsl.x - lm.x) : Math.PI / 2;
        for (const rOff of [0.56, 0.68, 0.46, 0.82]) {
          for (const dAng of [0, 0.5, -0.5, 1.05, -1.05, Math.PI, 1.6, -1.6]) {
            const cx = lm.x + Math.cos(baseAng + dAng) * rOff;
            const cz = lm.z + Math.sin(baseAng + dAng) * rOff;
            const sv = solveWalkPos(cx, cz, cx, cz, CHAR_R);
            if (sv && Math.hypot(sv.x - cx, sv.z - cz) <= 0.14) {
              standX = sv.x;
              standZ = sv.z;
              found = true;
              break;
            }
          }
          if (found) break;
        }
        const lmTitle = lm.name?.zh || lm.name || '高餐校園地標';
        if (walkIfNear && dist <= 4.6) {
          S.mission.type = 'drive';
          S.mission.label = `🏛️ 走向地標：${lmTitle}`;
          goTo(standX, standZ, {
            directOk: true,
            speed: 1.85,
            after: () => {
              S.fig.group.rotation.y = Math.atan2(lm.x - posOf().x, lm.z - posOf().z);
              S.nearBuilding = lm.id;
              S.nearTeacher = null;
              S.arrived = { landmark: lm };
              hc.selectLandmark?.(lm.id, { keepCamera: true });
              ui.syncPad();
            },
          });
          if (!S.follow) resumeFollowInPlace();
          showSay(`${lm.badge || '🏛️'} 前往地標：${lmTitle}`, '隨時可按 WASD 自由漫遊接手！', 2800);
          ui.syncPad();
          return;
        }
        const ty = surfaceY(standX, standZ, TOP_Y + 0.02);
        S.walk = null;
        S.pause = null;
        destMark.visible = false;
        posOf().set(standX, ty, standZ);
        S.fig.group.rotation.y = Math.atan2(lm.x - standX, lm.z - standZ);
        S.jumpY = 0.2;
        S.jumpVel = 0.62;
        spawnDust(standX, ty, standZ, 7, true);
        window.__htlPassport?.sfx?.jump?.();
        S.curIslandId = lm.island;
        const islMeta = data?.islandById?.get(lm.island);
        if (islMeta) S.curIslandName = islMeta.name;
        window.__htlPassport?.visitIsland?.(lm.island, false);
        S.nearBuilding = lm.id;
        S.nearTeacher = null;
        S.arrived = { landmark: lm };
        hc.selectLandmark?.(lm.id, { keepCamera: true });
        if (S.follow) refly();
        else startFollow();
        showSay(`${lm.badge || '🏛️'} 拜訪地標：${lmTitle}`, '已抵達地標廣場！可隨時用 WASD 繞行欣賞或按 L 巡禮下一處地標。', 3600);
        ui.syncPad();
      },
      cycleNextLandmark() {
        const lms = hc.landmarks || [];
        if (!lms.length) return;
        const curIdx = lms.findIndex((x) => x.id === S.nearBuilding || x.id === S.arrived?.landmark?.id);
        const nxt = lms[(curIdx + 1) % lms.length];
        api.visitLandmark(nxt.id);
      },
      visitBuildingInDrive(bId) {
        const b = buildings.find((x) => x.id === bId);
        if (!b) {
          hc.selectBuilding?.(bId);
          return;
        }
        if (!S.drive) api.toggleDrive(true);
        if (hc.releaseCamera) hc.releaseCamera();
        const curP = posOf();
        const dist = Math.hypot(b.cx - curP.x, b.cz - curP.z);
        if (dist <= 5.5) {
          S.mission.type = 'drive';
          S.mission.label = `🧭 前往「${b.name}」`;
          goTo(b.cx, b.cz, {
            directOk: true,
            speed: 1.85,
            after: () => {
              arrive(b);
              hc.selectBuilding?.(b.id, { keepCamera: true });
            },
          });
          if (!S.follow) resumeFollowInPlace();
          hc.selectBuilding?.(b.id, { keepCamera: true });
          ui.syncPad();
          return;
        }
        let standX = b.cx, standZ = b.cz + 0.62;
        for (const [ox, oz] of [[0, 0.62], [0, -0.62], [0.62, 0], [-0.62, 0], [0.48, 0.48], [-0.48, 0.48]]) {
          const sv = solveWalkPos(b.cx + ox, b.cz + oz, b.cx + ox, b.cz + oz, CHAR_R);
          if (sv && Math.hypot(sv.x - (b.cx + ox), sv.z - (b.cz + oz)) <= 0.18) {
            standX = sv.x;
            standZ = sv.z;
            break;
          }
        }
        const ty = surfaceY(standX, standZ, TOP_Y + 0.02);
        S.walk = null;
        S.pause = null;
        destMark.visible = false;
        posOf().set(standX, ty, standZ);
        S.fig.group.rotation.y = Math.atan2(b.cx - standX, b.cz - standZ);
        S.jumpY = 0.2;
        S.jumpVel = 0.6;
        spawnDust(standX, ty, standZ, 7, true);
        S.curIslandId = b.island?.id || S.curIslandId;
        if (b.island?.name) S.curIslandName = b.island.name;
        S.nearBuilding = b.id;
        S.arrived = { building: b };
        hc.selectBuilding?.(b.id, { keepCamera: true });
        if (S.follow) refly();
        else startFollow();
        showSay(`🏨 抵達：${b.name}`, '可直接使用 WASD 自由漫步周邊大道！', 3200);
        ui.syncPad();
      },
      open() {
        if (isMobile()) closeSiteLayers();
        ui.setOpen(true);
        ui.render();
        ensureDock();
        if (S.tab === 'look' && !S.drive) enterFitting();
        syncLimits();
        ui.render(); // 試衣地點的名稱要等 enterFitting 算出來才有
        if (!S.follow) startFollow();
      },
      close() { ui.setOpen(false); cancelPlace(); cancelAim(); leaveFitting(); syncLimits(); restoreSidebar(); },
      toggle() { (ui.isOpen() ? api.close : api.open)(); },
    };
    const ui = buildUI(api, S);

    let lastHeadScreen = { x: innerWidth / 2, y: innerHeight / 2, vis: false };
    const spawnXpPopup = (text) => {
      const pop = h('div', { class: 'hm-xp-pop' }, text);
      const sx = lastHeadScreen.vis ? lastHeadScreen.x : innerWidth / 2;
      const sy = lastHeadScreen.vis ? Math.max(70, lastHeadScreen.y - 18) : innerHeight * 0.42;
      pop.style.left = `${sx}px`;
      pop.style.top = `${sy}px`;
      document.body.append(pop);
      setTimeout(() => pop.remove(), 1500);
    };
    const onXpEvent = (ev) => {
      ui.syncPad();
      const d = ev.detail || {};
      if (d.gained && d.gained.length) {
        const g = d.gained[d.gained.length - 1];
        spawnXpPopup(`✦ +${g.xp} XP · ${g.label}`);
      } else if (d.freshChapters && d.freshChapters.length) {
        spawnXpPopup(`🎉 章節通關 +${d.freshChapters[0].xp} XP`);
      }
      if (S.drive && S.jumpY <= 0.01) {
        S.jumpVel = 1.05;
      }
    };
    window.addEventListener('htl:xp', onXpEvent);

    rebuild();
    ensureControls();

    // 預設行程：沿最長那條站方路線來回走
    const longest = routes.reduce((a, r, i) => (r.length > routes[a].length ? i : a), 0);
    S.defaultRoute = longest;
    setMission({ type: 'route', routeIdx: longest, flow: S.routeInfo[longest].flow, label: '自由漫步中' });
    beginLoop(longest);
    posOf().set(routes[longest][0].x, routes[longest][0].footY, routes[longest][0].z);
    ui.render();

    // ── 點擊小人：按在小人身上時在 capture 階段吃掉這次按放，站方的選取與 OrbitControls 都不會被觸發，避免搶鏡頭
    const hitTest = (cx, cy) => {
      const r = canvas.getBoundingClientRect();
      const v = posOf().clone();
      v.y += 0.2 * S.fig.group.scale.y;
      v.project(cap.camera);
      if (v.z > 1) return false;
      const sx = (v.x + 1) / 2 * r.width + r.left, sy = (1 - v.y) / 2 * r.height + r.top;
      return Math.hypot(cx - sx, cy - sy) < (matchMedia('(pointer:coarse)').matches ? 40 : 26);
    };
    let down = null, grabbed = false;
    const onDown = (e) => {
      down = { x: e.clientX, y: e.clientY };
      grabbed = !!cap.controls && !S.aim && !S.placing && hitTest(e.clientX, e.clientY);
      if (grabbed) e.stopImmediatePropagation();
    };
    const onUp = (e) => {
      if (!down) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y) > (e.pointerType === 'touch' ? 16 : 6);
      const wasGrab = grabbed;
      down = null;
      grabbed = false;
      if (S.placing || S.aim) {
        // 放置與調整期間：只吃掉「點一下」（站方收不到，免得選到建築、開介紹卡；手機上卡片一開還會把我的面板關掉）。
        // OrbitControls 已在 pointerdown 開始追蹤這個指標，所以補送 pointercancel（它有監聽）讓它正常收尾；拖曳則完全放行，鏡頭照常旋轉
        if (moved) return;
        e.stopImmediatePropagation();
        canvas.dispatchEvent(new PointerEvent('pointercancel', { pointerId: e.pointerId, pointerType: e.pointerType, isPrimary: e.isPrimary, bubbles: true }));
        if (S.placing) placeAt(e.clientX, e.clientY);
        else aimToward(e.clientX, e.clientY);
        return;
      }
      if (wasGrab) {
        e.stopImmediatePropagation();
        if (!moved) (S.follow ? stopFollow : startFollow)();
        return;
      }
      if (moved) return;
      if (hitTest(e.clientX, e.clientY)) { (S.follow ? stopFollow : startFollow)(); return; }
      if (S.pickMode) { pickGround(e.clientX, e.clientY); return; }
      if (S.drive) {
        // 點擊 3D 師長、學長姐 NPC 或其他線上玩家時，直接走過去開啟對話
        if (window.htlSocial?.handleCanvasTap?.(e.clientX, e.clientY)) {
          e.stopImmediatePropagation();
          return;
        }
        // 雙擊地面觸發自動尋路；單擊則放行給站方光線投射，讓玩家在 WASD 模式也能直接點擊拜訪任何 3D 校園地標、實習旅館或空中飛行器！
        const nowTap = performance.now();
        const isDoubleTap = (nowTap - S.lastTapAt < 340) && Math.hypot(e.clientX - S.lastTapX, e.clientY - S.lastTapY) < 28;
        S.lastTapAt = nowTap;
        S.lastTapX = e.clientX;
        S.lastTapY = e.clientY;
        if (isDoubleTap) {
          e.stopImmediatePropagation();
          pickGround(e.clientX, e.clientY);
          S.mission.type = 'drive';
          S.mission.label = '🕹️ 自由操控模式（走向指定地點中，隨時可推搖桿或按 WASD 接手）';
          ui.syncPad();
        }
        return;
      }
      if (S.follow) stopFollow();
    };
    // 2026-11-13：焦點在滑桿（例如陀螺遊戲的拉繩，方向鍵纏繩／甩出）或陀螺浮層裡時，方向鍵留給它，不拿來走路
    const isTypingTarget = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable || el.getAttribute?.('role') === 'slider' || !!el.closest?.('.ht-overlay'));
    const keyMap = { KeyW: 'u', KeyS: 'd', KeyA: 'l', KeyD: 'r', ArrowUp: 'u', ArrowDown: 'd', ArrowLeft: 'l', ArrowRight: 'r' };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (window.htlSocial?.closeTopModal?.()) { e.preventDefault(); return; }
        if (S.placing) { cancelPlace(); return; }
        if (S.aim) { cancelAim(); return; }
        if (S.drive) { api.toggleDrive(false); return; }
        if (S.pickMode) api.togglePick();
        else if (ui.isOpen()) api.close();
        else if (S.follow) stopFollow();
        return;
      }
      if (isTypingTarget(e.target)) return;
      if (e.target && e.target.tagName === 'SELECT') {
        e.target.blur();
      }
      if (S.drive) {
        if (e.code === 'KeyE' || e.key === 'e' || e.key === 'E') {
          e.preventDefault();
          api.interactPrimary();
          return;
        }
        if (e.code === 'KeyC') {
          e.preventDefault();
          window.htlSocial?.toggleChat?.();
          return;
        }
        if (e.code === 'Digit1' || e.code === 'Digit2' || e.code === 'Digit3' || e.code === 'Digit4') {
          e.preventDefault();
          const ems = { Digit1: 'wave', Digit2: 'bow', Digit3: 'cheer', Digit4: 'coffee' };
          api.triggerEmote(ems[e.code]);
          return;
        }
        if (e.code === 'Space') {
          e.preventDefault();
          api.jump();
          return;
        }
        if (e.code === 'KeyQ') {
          e.preventDefault();
          api.walkToQuestTarget();
          return;
        }
        if (e.code === 'KeyL') {
          e.preventDefault();
          api.cycleNextLandmark();
          return;
        }
        if (e.code === 'KeyV') {
          e.preventDefault();
          api.cycleCamMode();
          return;
        }
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
          S.sprint = true;
          ui.syncPad();
          return;
        }
      }
      const dir = keyMap[e.code];
      if (!dir) return;
      if (hc.state?.tourActive) return;
      // 按下 WASD 或方向鍵時（若歡迎視窗開啟亦自動關閉）立即啟動自由操控模式，隨時隨地無縫漫遊全島與拜訪地標
      if (!S.drive) {
        api.toggleDrive(true);
      }
      e.preventDefault();
      e.stopPropagation();
      if (e.shiftKey) S.sprint = true;
      S.keys[dir] = true;
      ui.syncPad();
    };
    const onKeyUp = (e) => {
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        S.sprint = false;
        ui.syncPad();
        return;
      }
      const dir = keyMap[e.code];
      if (!dir) return;
      if (S.keys[dir]) {
        S.keys[dir] = false;
        ui.syncPad();
      }
    };
    const onBlur = () => {
      S.keys = { u: false, d: false, l: false, r: false };
      S.padHold = { u: false, d: false, l: false, r: false };
      S.joy = { x: 0, z: 0, mag: 0 };
      ui.syncPad();
    };
    const onWheel = (e) => {
      if (!e.deltaY || !S.follow || S.follow.landed) return;
      const c = cap.controls, p = subjectPos().clone().add(followLift);
      S.follow.landed = true;
      S.follow.anchor = p.clone();
      S.follow.sm = p.clone();
      if (c) S.follow.tgt = c.target.clone();
      applyPendingLimits();
    };
    canvas.addEventListener('pointerdown', onDown, true);
    canvas.addEventListener('pointerup', onUp, true);
    canvas.addEventListener('wheel', onWheel, { passive: true, capture: true });
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    window.addEventListener('blur', onBlur);

    // shutdown 時：把我們放進場景與頁面的東西全部收掉（動畫迴圈由 tick 開頭的 dead 檢查停止）
    undo.push(() => {
      canvas.removeEventListener('pointerdown', onDown, true);
      canvas.removeEventListener('pointerup', onUp, true);
      canvas.removeEventListener('wheel', onWheel, true);
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('htl:xp', onXpEvent);
      canvas.style.cursor = '';
      restoreSidebar();
      applyPendingLimits();
      for (const obj of [S.fig.group, destMark, aimArrow, questCompass, ...dustPool.map((p) => p.mesh)]) {
        cap.scene.remove(obj);
        disposeFigure(obj);
      }
      if (S.puma) {
        cap.scene.remove(S.puma.fig.group);
        disposeFigure(S.puma.fig.group);
      }
      S.follow = null;
      ui.destroy();
      delete window.heartIslandAvatar;
    });

    // 自由操控地面高度與可行走範圍判定（整合六角島嶼邊界、橋樑走廊與 3D 建築碰撞）
    const walkableY = (x, z, curY) => {
      const s = solveWalkPos(x, z, x, z, CHAR_R);
      if (s && Math.hypot(s.x - x, s.z - z) <= 0.025 && Math.abs(s.y - curY) <= 0.42) {
        return s.y;
      }
      return null;
    };

    // ── 每幀：行走、擺手腳、依鏡頭距離縮放、名牌與對話泡泡跟隨
    const proj = new T.Vector3(), projFeet = new T.Vector3();
    const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
    let prevSiteOpen = siteLayerOpen();
    // 版面量測（面板停靠、畫布位置、名牌可用區域）每幀都量會反覆強制重排；改成每 250ms 或視窗改變時才重量
    let measuredAt = -1e9, cachedRect = null, cachedFree = null;
    const remeasure = () => { measuredAt = -1e9; };
    window.addEventListener('resize', remeasure);
    undo.push(() => window.removeEventListener('resize', remeasure));
    const tick = (now) => {
      if (dead) return;
      const fig = S.fig, g = fig.group;
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;

      // 還原上一幀跳躍高度差，確保地面碰撞計算永遠以真實腳底高度為基準
      if (S.jumpY > 0) {
        g.position.y -= S.jumpY;
      }

      // 1. 檢查玩家鍵盤／D-Pad／360° 類比搖桿自由操控輸入
      const kbX = ((S.keys.r || S.padHold.r) ? 1 : 0) - ((S.keys.l || S.padHold.l) ? 1 : 0);
      const kbZ = ((S.keys.u || S.padHold.u) ? 1 : 0) - ((S.keys.d || S.padHold.d) ? 1 : 0);
      const useJoy = S.joy && S.joy.mag > 0.08;
      const mx = useJoy ? S.joy.x : kbX;
      const mz = useJoy ? S.joy.z : kbZ;
      let manualWalk = false;
      const joyFast = useJoy && S.joy.mag > 0.82;
      const isFast = S.sprint || joyFast;
      if (S.drive && !S.ride) {
        let targetVx = 0, targetVz = 0;
        if (mx !== 0 || mz !== 0) {
          S.walk = null;
          S.pause = null;
          S.stand = null;
          S.emote = null;
          destMark.visible = false;
          if (hc.releaseCamera) hc.releaseCamera();
          if (!S.follow) resumeFollowInPlace();
          const len = Math.hypot(mx, mz) || 1;
          const { f, r } = camGround();
          const dirX = (r.x * mx + f.x * mz) / len;
          const dirZ = (r.y * mx + f.y * mz) / len;
          const joyScale = useJoy ? Math.min(1, Math.max(0.32, S.joy.mag)) : 1;
          const maxSpd = (isFast ? 2.65 : 1.58) * joyScale;
          targetVx = dirX * maxSpd;
          targetVz = dirZ * maxSpd;
        }
        const kVel = 1 - Math.exp(-dt * ((mx !== 0 || mz !== 0) ? 15 : 12));
        S.vel.x += (targetVx - S.vel.x) * kVel;
        S.vel.z += (targetVz - S.vel.z) * kVel;
        const curSpd = Math.hypot(S.vel.x, S.vel.z);
        if (curSpd > 0.035) {
          const stepDist = curSpd * dt;
          const ux = S.vel.x / curSpd, uz = S.vel.z / curSpd;
          const curX = g.position.x, curY = g.position.y, curZ = g.position.z;
          const nextPos = stepCharacter(curX, curY, curZ, ux, uz, stepDist);
          g.position.set(nextPos.x, nextPos.y, nextPos.z);
          const wantYaw = Math.atan2(ux, uz);
          g.rotation.y += wrap(wantYaw - g.rotation.y) * Math.min(1, dt * 14);
          manualWalk = true;
          if (isFast && curSpd > 1.8 && now - lastStepDust > 110) {
            lastStepDust = now;
            spawnDust(nextPos.x, nextPos.y, nextPos.z, 1, false);
          }
        } else {
          S.vel.x = 0;
          S.vel.z = 0;
        }
      } else {
        S.vel.x = 0;
        S.vel.z = 0;
      }

      // 搭乘中（遊艇碼頭 marina.js）：角色固定在載具上的座位，步行操控暫停，鏡頭照常跟隨
      if (S.ride) {
        try {
          const a = S.ride.get();
          if (a) {
            g.position.set(a.x, a.y, a.z);
            g.rotation.y = a.yaw;
          }
        } catch {}
      }
      const w = S.ride ? null : S.walk;
      let walking = manualWalk;
      if (w && !manualWalk) {
        w.dist += w.dir * w.speed * dt;
        if (w.kind === 'loop') {
          if (w.dist > w.total) { w.dist = w.total; w.dir = -1; }
          if (w.dist < 0) { w.dist = 0; w.dir = 1; }
        } else if (w.dist >= w.total) w.dist = w.total;
        let i = 0, rest = w.dist;
        while (i < w.seg.length - 1 && rest > w.seg[i]) { rest -= w.seg[i]; i++; }
        const a = w.pts[i], b = w.pts[Math.min(i + 1, w.pts.length - 1)], k = w.seg[i] ? rest / w.seg[i] : 0;
        g.position.set(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k, a.z + (b.z - a.z) * k);
        if (b.x !== a.x || b.z !== a.z) g.rotation.y = Math.atan2((b.x - a.x) * w.dir, (b.z - a.z) * w.dir);
        walking = true;
        if (w.kind === 'once' && w.dist >= w.total) {
          S.walk = null;
          if (w.after) w.after();
        }
      }

      // 2. 在 RPG 自由操控模式下：即時更新所在島嶼名稱，並感應附近 3D 專任師長／群賢館長與 3D 地標建築
      if (S.drive) {
        const { island: nearIsl, dist: islD } = nearestIsland(g.position.x, g.position.z);
        if (nearIsl && islD <= islR(nearIsl) + 0.35 && S.curIslandId !== nearIsl.id) {
          const hadPrevIsl = !!S.curIslandId;
          S.curIslandId = nearIsl.id;
          const islMeta = data?.islandById?.get(nearIsl.id);
          S.curIslandName = islMeta ? islMeta.name : nearIsl.name || nearIsl.id;
          if (hadPrevIsl) {
            try {
              window.dispatchEvent(
                new CustomEvent('htl:avatar-island', {
                  detail: { id: nearIsl.id, name: S.curIslandName, playerName: S.look?.name || '' },
                })
              );
            } catch {}
          }
          window.__htlPassport?.checkProximityNow?.();
          ui.syncPad();
        }
        // 偵測附近 3D 專任師長與彩蛋群賢館長（< 0.78）或 3D 建築（< 0.70）
        let bestT = null, bestTD = 0.78;
        const facList = hc.getFacultyPositions?.() || [];
        for (const f of facList) {
          const d = Math.hypot(f.x - g.position.x, f.z - g.position.z);
          if (d < bestTD) { bestTD = d; bestT = f; }
        }
        let bestB = null, bestBD = 0.96;
        for (const b of buildings) {
          const d = Math.hypot(b.cx - g.position.x, b.cz - g.position.z);
          if (d < bestBD) { bestBD = d; bestB = b; }
        }
        let bestL = null, bestLD = 1.12;
        for (const lm of hc.landmarks || []) {
          const d = Math.hypot(lm.x - g.position.x, lm.z - g.position.z);
          if (d < bestLD) { bestLD = d; bestL = lm; }
        }
        if (bestT && (!bestB || bestTD <= bestBD + 0.08) && (!bestL || bestTD <= bestLD + 0.06)) {
          if (S.nearTeacher !== bestT.id) {
            S.nearTeacher = bestT.id;
            S.nearBuilding = null;
            S.arrived = { teacher: bestT };
            const tLabel = bestT.shortTitle?.zh || bestT.name?.zh || '師長';
            showSay(`🎙️ 遇見：${tLabel}`, '按 E 鍵或點下方按鈕向老師請益並聆聽語音導覽！', 3800);
            ui.syncPad();
          }
        } else if (bestL && (!bestB || bestLD <= bestBD + 0.04)) {
          if (S.nearBuilding !== bestL.id || S.nearTeacher) {
            S.nearBuilding = bestL.id;
            S.nearTeacher = null;
            S.arrived = { landmark: bestL };
            showSay(`${bestL.badge || '🏛️'} 高餐地標：${bestL.name?.zh || bestL.name}`, '按 E 鍵或點下方按鈕查看作品卡片！', 3800);
            ui.syncPad();
          }
        } else if (bestB) {
          if (S.nearBuilding !== bestB.id || S.nearTeacher) {
            S.nearBuilding = bestB.id;
            S.nearTeacher = null;
            S.arrived = { building: bestB };
            showSay(`📍 ${bestB.name}`, bestB.facts[0] || '按 E 鍵或點下方按鈕查看介紹卡', 3800);
            ui.syncPad();
          }
        } else if (S.nearBuilding || S.nearTeacher) {
          S.nearBuilding = null;
          S.nearTeacher = null;
          S.arrived = null;
          ui.syncPad();
        }
        // 感應身旁學長姐／實習生 NPC 與線上真實玩家
        const ext = window.htlSocial?.senseNearby?.(g.position.x, g.position.z) || null;
        const extKey = ext ? `${ext.kind}:${ext.id}` : '';
        if (extKey !== S.extNearKey) {
          S.extNear = ext;
          S.extNearKey = extKey;
          ui.syncPad();
        } else if (ext) {
          S.extNear = ext;
        }
      } else if (S.extNear) {
        S.extNear = null;
        S.extNearKey = '';
      }

      // 3. 處理 3D 角色跳躍物理與星塵粒子動畫
      const baseFootY = g.position.y;
      if (S.jumpVel !== 0 || S.jumpY > 0) {
        S.jumpY += S.jumpVel * dt;
        S.jumpVel -= 4.8 * dt;
        if (S.jumpY <= 0) {
          S.jumpY = 0;
          S.jumpVel = 0;
          spawnDust(g.position.x, baseFootY, g.position.z, 4, false);
        } else {
          g.position.y = baseFootY + S.jumpY;
        }
      }
      for (const p of dustPool) {
        if (p.life <= 0) continue;
        p.life -= dt;
        if (p.life <= 0) {
          p.mesh.visible = false;
          continue;
        }
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        const ratio = p.life / p.maxLife;
        p.mesh.scale.setScalar((0.024 + (1 - ratio) * 0.025) * g.scale.x);
        p.mat.opacity = ratio * 0.85;
      }

      // 4. 更新角色腳下 3D 黃金任務羅盤箭頭（即時指向下一主線任務目標）
      const qTarget = S.drive && !S.clean ? window.__htlPassport?.getTargetPos?.() : null;
      if (qTarget && Math.hypot(qTarget.x - g.position.x, qTarget.z - g.position.z) > 0.45) {
        questCompass.visible = true;
        questCompass.position.set(g.position.x, baseFootY + 0.015, g.position.z);
        questCompass.scale.setScalar(g.scale.x);
        const targetYaw = Math.atan2(qTarget.x - g.position.x, qTarget.z - g.position.z);
        questCompass.rotation.y += wrap(targetYaw - questCompass.rotation.y) * Math.min(1, dt * 10);
        const pulse = 1 + Math.sin(now / 220) * 0.12;
        qArrowMesh.scale.set(0.075 * pulse, 0.15 * pulse, 0.075 * pulse);
      } else {
        questCompass.visible = false;
      }

      applyFigScale(fig);
      // 定點站立：面向由我們指定，不再自動轉向鏡頭
      if (S.aim && S.aim.actor === 'me') g.rotation.y = S.aim.yaw;
      else if (S.stand && !S.walk && !manualWalk && !S.fitting && !S.aim) g.rotation.y = S.stand.yaw;
      if (S.puma && S.puma.fig.group.visible) { // 領航員分身：大小隨鏡頭距離，面向照指定
        const pf = S.puma.fig, pg = pf.group;
        applyFigScale(pf);
        if (S.aim && S.aim.actor === 'puma') pg.rotation.y = S.aim.yaw;
        else if (S.puma.stand) pg.rotation.y = S.puma.stand.yaw;
      }

      if (S.emote && now > S.emote.until) S.emote = null;
      g.rotation.x = 0;
      let emoteArmZ = false;
      if (S.jumpY > 0.02) {
        // 空中歡呼跳躍姿勢：雙手高舉、雙腿微曲
        fig.legs[0].rotation.x = 0.45;
        fig.legs[1].rotation.x = -0.35;
        fig.arms[0].rotation.x = -2.6;
        fig.arms[1].rotation.x = -2.6;
      } else if (walking) {
        const stride = manualWalk ? (isFast ? 14 : 10) : (S.walk ? S.walk.stride : 8);
        const s = Math.sin(now / 1000 * stride) * (manualWalk && isFast ? 0.78 : 0.62);
        fig.legs[0].rotation.x = s;  fig.legs[1].rotation.x = -s;
        fig.arms[0].rotation.x = -s; fig.arms[1].rotation.x = s;
        g.rotation.x = manualWalk && isFast ? 0.1 : 0.035; // 走路微微前傾，跑步更明顯
      } else if (S.emote) {
        const elap = (now - S.emote.start) / 1000;
        const rem = (S.emote.until - now) / 1000;
        const env = Math.min(1, elap / 0.2) * Math.min(1, rem / 0.25);
        fig.legs[0].rotation.x = fig.legs[1].rotation.x = 0;
        if (S.emote.kind === 'bow') {
          g.rotation.x = 0.25 * env;
          fig.arms[0].rotation.x = -0.58 * env;
          fig.arms[1].rotation.x = -0.58 * env;
          fig.arms[0].rotation.z = 0.32 * env;
          fig.arms[1].rotation.z = -0.32 * env;
          emoteArmZ = true;
        } else if (S.emote.kind === 'cheer') {
          const wv = Math.sin(now / 110) * 0.28;
          fig.arms[0].rotation.x = -2.65 + wv;
          fig.arms[1].rotation.x = -2.65 - wv;
          fig.arms[0].rotation.z = -0.22;
          fig.arms[1].rotation.z = 0.22;
          emoteArmZ = true;
        } else if (S.emote.kind === 'coffee') {
          fig.arms[0].rotation.x = 0;
          fig.arms[1].rotation.x = (-1.55 + Math.sin(now / 260) * 0.12) * env;
        } else {
          fig.arms[0].rotation.x = 0;
          fig.arms[1].rotation.x = -2.55 + Math.sin(now / 130) * 0.42;
        }
      } else if (S.fitting || (S.aim && S.aim.actor === 'me') || S.stand || S.drive) {
        // 試衣、調整面向、定點站立、自由操控停步時：站著、雙手自然垂下，隨呼吸輕微前後擺動
        fig.legs[0].rotation.x = fig.legs[1].rotation.x = 0;
        const br = Math.sin(now / 900) * 0.045;
        fig.arms[0].rotation.x = br;
        fig.arms[1].rotation.x = -br;
      } else {
        // 抵達後面向鏡頭揮手
        const toCam = Math.atan2(cap.camera.position.x - g.position.x, cap.camera.position.z - g.position.z);
        g.rotation.y += wrap(toCam - g.rotation.y) * Math.min(1, dt * 6);
        fig.legs[0].rotation.x = fig.legs[1].rotation.x = 0;
        fig.arms[0].rotation.x = 0;
        fig.arms[1].rotation.x = -2.5 + Math.sin(now / 160) * 0.35;
      }
      // 舉手姿勢（拍照用）
      // 角色面向 +z 時，自己的左手是 +x 側（arms[1]）、右手是 -x 側（arms[0]）；往外側（z 軸）轉到頭上
      const raise = (f, po, on) => {
        for (const [i, k, sg] of [[0, 'r', -1], [1, 'l', 1]]) {
          const a = f.arms[i];
          if (on && po[k]) { a.rotation.x = 0; a.rotation.z = sg * POSE_UP; } else a.rotation.z = 0;
        }
      };
      if (!emoteArmZ) raise(fig, S.pose.me, !S.walk && !!(S.stand || (S.aim && S.aim.actor === 'me')));
      if (S.puma) raise(S.puma.fig, S.pose.puma, true);
      // 氣球維持直立：手的旋轉恆為手臂旋轉的反向（走路擺手、揮手、舉手都適用）
      const upright = (f) => { for (let i = 0; i < 2; i++) f.hands[i].quaternion.copy(f.arms[i].quaternion).invert(); };
      upright(fig);
      if (S.puma) upright(S.puma.fig);
      fig.pin.position.y = fig.pinY + Math.sin(now / 400) * 0.02;
      blinkFigure(fig, now);
      if (S.puma) blinkFigure(S.puma.fig, now);
      // 調整面向：貼地箭頭與羅盤指針；拍照模式：隱藏頭頂標記與底圈
      aimArrow.visible = !!S.aim;
      if (S.aim) {
        const ag = aimGroup();
        aimArrow.position.copy(ag.position);
        aimArrow.rotation.y = S.aim.yaw;
        aimArrow.scale.setScalar(ag.scale.x);
        const nd = document.querySelector('.hm-dial-needle');
        if (nd) nd.style.transform = `rotate(${aimTheta()}rad)`;
      }
      fig.pin.visible = !S.clean;
      fig.ring.visible = !!S.follow && !S.clean && subjectGroup() === g;
      destMark.children[1].position.set(0, 0.2 + Math.sin(now / 300) * 0.03, 0);

      const measure = now - measuredAt > 250;
      if (measure) ui.layout();
      ui.setSub(S.placing ? '點場景選一個位置（步道旁、建築前、黑板前都可以）' : S.aim ? '調整面向與位置，再按「站在這裡」' : S.mission.label);
      // 手機：站方的抽屜或介紹卡剛打開時，收起我的面板
      const siteOpen = siteLayerOpen();
      if (siteOpen && !prevSiteOpen && isMobile() && ui.isOpen()) api.close();
      if (siteOpen !== prevSiteOpen) remeasure();
      prevSiteOpen = siteOpen;
      if (S.pause && now >= S.pause.until && !S.fitting && !S.aim) { const f = S.pause.then; S.pause = null; f(); }
      if (S.follow && cap.controls) stepFollow(now);
      else if (S.pendingLimits) applyPendingLimits(true);
      // 鏡頭剛被移動：先照 OrbitControls 的方式對準目標並更新矩陣，名牌的投影才會和這一幀畫出來的畫面一致
      if (S.follow && cap.controls) { cap.camera.lookAt(cap.controls.target); cap.camera.updateMatrixWorld(); }
      window.htlSocial?.onLocalTick?.(now, {
        x: g.position.x,
        y: baseFootY,
        z: g.position.z,
        yaw: g.rotation.y,
        jumpY: S.jumpY,
        moving: walking,
        sprint: isFast,
        active: !!(S.drive || S.follow || ui.isOpen()),
        clean: !!S.clean,
      });

      // 名牌與對話泡泡是浮在最上層的 DOM，要避開站方 UI 與我自己的面板：
      // 夾在可用區域內，頂端避開 LOGO／工具列，被底部圖層占住時就隱藏
      if (S.say && now > S.say.until) S.say = null;
      if (S.say) {
        const k = `${S.say.title}\n${S.say.text}`;
        if (ui.say.dataset.k !== k) {
          ui.say.dataset.k = k;
          ui.say._sz = null;
          ui.say.replaceChildren(h('b', {}, S.say.title), S.say.text.length > 60 ? S.say.text.slice(0, 58) + '…' : S.say.text);
        }
      }
      if (measure || !cachedRect) {
        cachedRect = canvas.getBoundingClientRect();
        cachedFree = freeBounds(cachedRect);
        measuredAt = now;
      }
      const r = cachedRect, free = cachedFree;
      proj.copy(g.position);
      proj.y += (S.fig.pinY + 0.18) * g.scale.y;
      proj.project(cap.camera);
      // 名牌錨點（腳上方 0.8）在鏡頭拉近時會跑出畫面，但名牌本來就會被夾進可用區域；所以改用「角色本人（腳）在不在畫面內」判斷
      projFeet.copy(g.position).project(cap.camera);
      const inView = projFeet.z < 1 && Math.abs(projFeet.x) < 1.1 && Math.abs(projFeet.y) < 1.1;
      const ax = (proj.x + 1) / 2 * r.width, ay = (1 - proj.y) / 2 * r.height;
      lastHeadScreen = { x: r.left + ax, y: r.top + ay, vis: inView };
      const fit = (el, bottomY) => { // 回傳夾好的 x、bottom y（元素以底邊中點定位）
        if (measure || !el._sz) el._sz = [el.offsetWidth, el.offsetHeight]; // 尺寸只在重量時讀
        const w = el._sz[0] || 90, hh = el._sz[1] || 22;
        const x = free.R - free.L < w ? (free.L + free.R) / 2 : Math.min(Math.max(ax, free.L + w / 2), free.R - w / 2);
        return { x, y: Math.max(bottomY, free.T + hh), hh };
      };
      const showTag = inView && camDist() < 26 && !S.clean;
      const canShowSay = inView && !!S.say && !S.clean;
      const sz = (el, d) => { if (measure || !el._sz) el._sz = [el.offsetWidth, el.offsetHeight]; return el._sz[1] || d; };
      const sayH = canShowSay ? sz(ui.say, 40) + 6 : 0;
      const tagFit = fit(ui.tag, Math.max(ay, free.T + sayH + sz(ui.tag, 22)));
      const tagOn = showTag && tagFit.y <= free.B;
      ui.tag.style.display = tagOn ? 'block' : 'none';
      if (tagOn) ui.tag.style.transform = `translate(${r.left + tagFit.x}px, ${r.top + tagFit.y}px) translate(-50%, -100%)`;
      const sayBottom = tagOn ? tagFit.y - tagFit.hh - 6 : ay;
      const sayFit = fit(ui.say, sayBottom);
      const sayOn = canShowSay && sayFit.y <= free.B;
      ui.say.style.display = sayOn ? 'block' : 'none';
      if (sayOn) ui.say.style.transform = `translate(${r.left + sayFit.x}px, ${r.top + sayFit.y}px) translate(-50%, -100%)`;
      if (!hooked) requestAnimationFrame(tick);
      return true;
    };
    // 站方有提供每幀掛鉤時，排在站方的鏡頭控制與繪製之前執行：角色、鏡頭、名牌都對齊同一幀，移動時不抖不閃。
    // 舊版站方沒有掛鉤才退回自己的 requestAnimationFrame（會比繪製晚一幀）
    const hooked = typeof hc.onFrame === 'function';
    const safeTick = (now) => {
      try {
        return tick(now);
      } catch (err) {
        LOG('tick error', err);
        return true;
      }
    };
    if (hooked) undo.push(hc.onFrame(safeTick));
    else requestAnimationFrame(tick);

    // 試衣位置要掃小島與整張路網，總共要發上千條射線；載入完成後分段在背景算好，第一次打開面板才不會卡住
    setTimeout(() => {
      if (dead || S.fitIslandSpots || S.fitGen) return;
      const it = S.fitGen = computeFitSpot();
      const step = () => {
        if (dead || S.fitGen !== it) return; // 已被 enterFitting 接手跑完
        try {
          const r = it.next();
          if (r.done) { S.fitIslandSpots = r.value; S.fitGen = null; } else requestAnimationFrame(step);
        } catch (e) { LOG('試衣位置預先計算失敗，打開面板時再算：', e); S.fitGen = null; }
      };
      step();
    }, 3000);

    // 介紹對話框關閉後詢問名字（只問一次）；若介紹在本模組載入前就已關閉，現在補問
    window.addEventListener('htl:intro-closed', () => setTimeout(() => api.maybeAskName(), 300));
    if (window.__htlIntroClosed) setTimeout(() => api.maybeAskName(), 300);
    // 舊網址搬家提示：介紹對話框開著時等它關閉再顯示
    {
      const intro = document.getElementById('intro');
      if (intro && !intro.hidden) window.addEventListener('htl:intro-closed', () => setTimeout(showMoveNotice, 600), { once: true });
      else setTimeout(showMoveNotice, 1200);
    }
    window.heartIslandAvatar = { S, api, ui, net, buildings, cap, T, startFollow, stopFollow, buildFigure, blinkFigure, disposeFigure, applyFigScale, showSay, walkableY, DEFAULT_LOOK, ROLE_LABEL };
    if (new URLSearchParams(location.search).get('drive') === '1') {
      setTimeout(() => api.toggleDrive(true), 250);
    }
    LOG('ready', { nodes: net.main.length, buildings: buildings.length, routes: routes.length });
  }

  // 頁面會設上游 userscript 的站方關閉旗標，讓訪客自己裝的那份讓位。它每 0.5 秒檢查一次旗標，
  // 收掉時會刪除它在 prototype 上加的包裝；我們若比它早包，會被一起刪掉，所以等它收完才安裝。
  const HOOK_DELAY_MS = 50;
  const HOOK_RETRY_MS = 2000;

  const pageLoaded = () => new Promise((res) => {
    if (document.readyState === 'complete') res();
    else window.addEventListener('load', () => res(), { once: true });
  });

  function syncFromHeartCity() {
    const hc = window.heartCity;
    if (!hc) return;
    if (hc.scene && !cap.scene) cap.scene = hc.scene;
    if (hc.camera && !cap.camera) cap.camera = hc.camera;
    if (hc.controls && !cap.controls) cap.controls = hc.controls;
  }

  async function boot() {
    await loadThree();
    await pageLoaded();
    await new Promise((res) => setTimeout(res, HOOK_DELAY_MS));
    if (dead) return;
    syncFromHeartCity();
    hook();
    // 估計的延遲不夠時，userscript 收尾可能已把我們的包裝刪掉：還沒抓到就再裝一次
    setTimeout(() => { syncFromHeartCity(); if (!dead && (!cap.scene || !cap.camera)) hook(); }, HOOK_RETRY_MS);
    // 站方若是按需重繪，送一個 resize 逼它畫一幀
    setTimeout(() => { syncFromHeartCity(); if (!dead && !cap.scene) window.dispatchEvent(new Event('resize')); }, 800);
    await whenReady(() => {
      syncFromHeartCity();
      return dead || (cap.scene && cap.camera && window.heartCity && window.heartCity.pedestrianRoutes
        && window.heartCity.pedestrianRoutes.length && document.body && document.querySelector('canvas'));
    });
    if (dead) return;
    let data = null;
    try { data = await loadData(); } catch (e) { console.warn('[heart-me] policies.json 讀取失敗，只提供地圖指定：', e); }
    if (dead) return;
    spawn(data);
  }

  boot().catch((e) => console.warn('[heart-me] boot failed:', e));
})();
