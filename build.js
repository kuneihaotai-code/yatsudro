#!/usr/bin/env node
/**
 * build.js — ヤツドロ。記事ビルドスクリプト
 *
 * 使い方:
 *   node build.js
 *
 * _posts/ 内の .md ファイルを読み込み、
 *   - news.html（一覧ページ）を再生成
 *   - posts/記事ID.html（記事詳細ページ）を生成
 */

const fs   = require('fs');
const path = require('path');

// ── Markdown パーサー（frontmatterだけ自前でパース）──────────────────────────
function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };
  const meta = {};
  match[1].split('\n').forEach(line => {
    const [k, ...v] = line.split(':');
    if (k) meta[k.trim()] = v.join(':').trim().replace(/^["']|["']$/g, '');
  });
  return { meta, body: match[2] };
}

// シンプルなMarkdown→HTML変換
function mdToHtml(md) {
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]+?<\/li>)/g, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hubi]|<block|<ul)(.+)$/gm, '$1')
    .replace(/<\/p><p>/g, '</p>\n<p>')
    .split('\n\n').map(p => {
      if (p.startsWith('<h') || p.startsWith('<ul') || p.startsWith('<blockquote')) return p;
      return `<p>${p}</p>`;
    }).join('\n');
}

// ── 記事を読み込む ─────────────────────────────────────────────────────────────
const postsDir = path.join(__dirname, '_posts');
if (!fs.existsSync(postsDir)) {
  fs.mkdirSync(postsDir);
  console.log('_posts/ フォルダを作成しました。記事を追加してください。');
}

const files = fs.readdirSync(postsDir)
  .filter(f => f.endsWith('.md'))
  .sort()
  .reverse(); // 新しい順

const posts = files.map((file, i) => {
  const raw  = fs.readFileSync(path.join(postsDir, file), 'utf-8');
  const { meta, body } = parseFrontmatter(raw);
  const slug = file.replace(/\.md$/, '');
  const date = (meta.date || slug.slice(0, 10)).replace(/-/g, '.');
  const tagMap = { news: 'お知らせ', blog: 'ブログ', report: '飛行レポート' };
  const tagClassMap = { news: 'tag-news', blog: 'tag-blog', report: 'tag-report' };
  return {
    id:       slug,
    index:    i,
    date,
    category: meta.category || 'news',
    tagLabel: tagMap[meta.category] || 'お知らせ',
    tagClass: tagClassMap[meta.category] || 'tag-news',
    emoji:    meta.emoji || '🚁',
    title:    meta.title || '（タイトルなし）',
    excerpt:  meta.excerpt || '',
    bodyHtml: mdToHtml(body.trim()),
  };
});

// ── 共通ナビ・フッターHTML ────────────────────────────────────────────────────
const NAV = `
<button class="menu-btn" id="menuBtn" aria-label="メニュー">
  <span></span><span></span><span></span>
</button>
<nav class="nav-overlay" id="navOverlay">
  <ul>
    <li><a href="/service.html">サービス</a></li>
    <li><a href="/area.html">対応エリア</a></li>
    <li><a href="/news.html">お知らせ</a></li>
    <li><a href="/contact.html">お問い合わせ</a></li>
  </ul>
  <div class="nav-overlay-sub">YATSUGATAKE DRONE LOGISTICS</div>
</nav>
<nav id="nav">
  <a href="/index.html" class="logo">
    <img src="/icon.png" class="logo-img" alt="ヤツドロ">
    <span class="logo-text">
      <span class="logo-name">ヤ ツ ド ロ。</span>
      <span class="logo-sub">YATSUGATAKE DRONE LOGISTICS</span>
    </span>
  </a>
</nav>`;

const FOOTER = `
<footer>
  <div class="footer-logo">
    <a href="/index.html" style="text-decoration:none;display:flex;align-items:center;gap:.75rem;">
      <img src="/icon.png" width="36" height="36" alt="ヤツドロ" style="filter:brightness(0) invert(1);display:block;">
      <span style="display:flex;flex-direction:column;line-height:1;gap:5px;align-items:center;">
        <span style="font-family:'Semamojikana',sans-serif;font-size:1rem;color:#fff;letter-spacing:.05em;">ヤ ツ ド ロ。</span>
        <span style="font-family:'Noto Sans JP',sans-serif;font-size:.5rem;color:rgba(255,255,255,.65);letter-spacing:.2em;font-weight:300;">YATSUGATAKE DRONE LOGISTICS</span>
      </span>
    </a>
  </div>
  <p>〒408-0000 山梨県北杜市　© 2026 ヤツドロ。</p>
</footer>`;

const NAV_JS = `
<script>
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 20));
const menuBtn = document.getElementById('menuBtn');
const navOverlay = document.getElementById('navOverlay');
menuBtn.addEventListener('click', () => {
  menuBtn.classList.toggle('open');
  navOverlay.classList.toggle('open');
  document.body.style.overflow = navOverlay.classList.contains('open') ? 'hidden' : '';
});
navOverlay.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  menuBtn.classList.remove('open'); navOverlay.classList.remove('open'); document.body.style.overflow = '';
}));
</script>`;

// ── CSS（共通） ───────────────────────────────────────────────────────────────
const COMMON_CSS = `
<link href="https://fonts.googleapis.com/css2?family=Shippori+Mincho+B1:wght@400;700;800&family=Noto+Sans+JP:wght@300;400;500;700&display=swap" rel="stylesheet">
<style>
@font-face { font-family:'Semamojikana'; src:url('/Semamojikana-Bold.woff') format('woff'); }
:root {
  --white:#fff; --snow:#f4f7fb; --mist:#e4ecf5; --ridge:#c8d8ea;
  --sky:#4a7fa8; --deep:#1d3a5c; --peak:#0d2240; --gold:#b8996a;
  --text:#2c3e52; --sub:#6b7f96;
}
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Noto Sans JP',sans-serif;background:var(--white);color:var(--text);overflow-x:hidden;}
nav{position:fixed;top:0;width:100%;z-index:100;padding:1.1rem 3rem;display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,.94);backdrop-filter:blur(16px);border-bottom:1px solid var(--mist);transition:box-shadow .3s;}
nav.scrolled{box-shadow:0 2px 24px rgba(29,58,92,.1);}
.logo{font-family:'Shippori Mincho B1',serif;font-size:1.05rem;font-weight:700;color:var(--deep);text-decoration:none;display:flex;align-items:center;gap:.6rem;}
.logo-img{height:38px;width:38px;object-fit:contain;flex-shrink:0;border-radius:50%;}
.logo-text{display:flex;flex-direction:column;line-height:1;align-items:center;}
.logo-name{font-family:'Semamojikana',sans-serif;font-size:1.05rem;font-weight:700;letter-spacing:.05em;}
.logo-sub{font-size:.55rem;color:var(--sky);font-weight:300;letter-spacing:.18em;margin-top:2px;white-space:nowrap;}
.menu-btn{position:fixed;top:1.1rem;right:1.5rem;z-index:200;width:50px;height:50px;background:var(--deep);border:none;cursor:pointer;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:5px;transition:background .3s,transform .3s;box-shadow:0 4px 20px rgba(13,34,64,.28);}
.menu-btn:hover{background:var(--peak);transform:scale(1.05);}
.menu-btn span{display:block;width:22px;height:1.5px;background:#fff;transition:transform .4s cubic-bezier(.23,1,.32,1),opacity .3s;transform-origin:center;}
.menu-btn.open span:nth-child(1){transform:translateY(6.5px) rotate(45deg);}
.menu-btn.open span:nth-child(2){opacity:0;transform:scaleX(0);}
.menu-btn.open span:nth-child(3){transform:translateY(-6.5px) rotate(-45deg);}
.nav-overlay{position:fixed;top:0;right:0;bottom:0;z-index:150;background:var(--peak);width:260px;padding:5.5rem 2rem 2.5rem;transform:translateX(100%);transition:transform .45s cubic-bezier(.77,0,.175,1);pointer-events:none;box-shadow:-8px 0 40px rgba(13,34,64,.28);display:flex;flex-direction:column;}
.nav-overlay.open{transform:translateX(0);pointer-events:all;}
.nav-overlay ul{list-style:none;}
.nav-overlay ul li{border-bottom:1px solid rgba(255,255,255,.07);}
.nav-overlay ul li:first-child{border-top:1px solid rgba(255,255,255,.07);}
.nav-overlay ul a{font-size:.82rem;font-weight:500;color:rgba(255,255,255,.65);text-decoration:none;padding:1rem 0;letter-spacing:.14em;display:flex;align-items:center;gap:.6rem;transform:translateX(18px);opacity:0;transition:color .25s,transform .45s cubic-bezier(.23,1,.32,1),opacity .45s cubic-bezier(.23,1,.32,1);}
.nav-overlay ul a::before{content:'';display:inline-block;width:14px;height:1px;background:var(--sky);flex-shrink:0;transition:width .3s;}
.nav-overlay ul a:hover{color:#fff;}
.nav-overlay.open ul a{transform:translateX(0);opacity:1;}
.nav-overlay ul li:nth-child(1) a{transition-delay:.10s;}
.nav-overlay ul li:nth-child(2) a{transition-delay:.17s;}
.nav-overlay ul li:nth-child(3) a{transition-delay:.24s;}
.nav-overlay ul li:nth-child(4) a{transition-delay:.31s;}
.nav-overlay-sub{margin-top:auto;padding-top:2rem;font-size:.58rem;letter-spacing:.22em;color:rgba(255,255,255,.16);opacity:0;transition:opacity .4s .36s;}
.nav-overlay.open .nav-overlay-sub{opacity:1;}
footer{background:var(--peak);padding:2rem 3rem;display:flex;justify-content:space-between;align-items:center;border-top:1px solid rgba(255,255,255,.05);}
footer p{font-size:.72rem;color:rgba(255,255,255,.55);}
.section-eyebrow{font-size:.64rem;letter-spacing:.35em;color:var(--sky);text-transform:uppercase;margin-bottom:.8rem;display:flex;align-items:center;gap:.7rem;}
.section-eyebrow::before{content:'';display:inline-block;width:20px;height:1px;background:var(--sky);}
.news-tag{font-size:.62rem;letter-spacing:.1em;padding:.22rem .7rem;font-weight:500;}
.tag-news{background:var(--mist);color:var(--sky);}
.tag-blog{background:rgba(184,153,106,.12);color:var(--gold);}
.tag-report{background:rgba(74,127,168,.1);color:var(--sky);}
@keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
.reveal{opacity:0;transform:translateY(24px);transition:opacity .65s cubic-bezier(.23,1,.32,1),transform .65s cubic-bezier(.23,1,.32,1);}
.reveal.visible{opacity:1;transform:translateY(0);}
@media(max-width:768px){nav{padding:1rem 1.5rem;}footer{flex-direction:column;gap:.8rem;text-align:center;}}
</style>`;

// ── news.html を生成 ──────────────────────────────────────────────────────────
function buildNewsList() {
  const featured = posts.slice(0, 2);
  const rest     = posts.slice(2);

  const featuredHtml = featured.map(p => `
    <a href="/posts/${p.id}.html" class="news-card featured reveal" data-category="${p.category}">
      <div class="news-card-img">${p.emoji}</div>
      <div class="news-meta">
        <span class="news-date">${p.date}</span>
        <span class="news-tag ${p.tagClass}">${p.tagLabel}</span>
      </div>
      <div class="news-card-title">${p.title}</div>
      <p class="news-card-excerpt">${p.excerpt}</p>
    </a>`).join('');

  const rowsHtml = rest.map(p => `
    <a href="/posts/${p.id}.html" class="news-row reveal" data-category="${p.category}">
      <span class="news-row-date">${p.date}</span>
      <div class="news-row-body">
        <div class="news-meta" style="margin-bottom:.4rem;">
          <span class="news-tag ${p.tagClass}">${p.tagLabel}</span>
        </div>
        <div class="news-row-title">${p.title}</div>
        <p class="news-row-excerpt">${p.excerpt}</p>
      </div>
      <span class="news-row-arrow">→</span>
    </a>`).join('');

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<link rel="icon" type="image/png" href="/favicon.png">
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>お知らせ・ブログ | ヤツドロ。</title>
${COMMON_CSS}
<style>
.page-header{padding:10rem 3rem 5rem;background:var(--snow);position:relative;overflow:hidden;}
.page-header::after{content:'';position:absolute;bottom:0;left:0;right:0;height:80px;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 80'%3E%3Cpolygon points='0,80 1440,80 1440,0 1200,52 960,22 720,58 480,16 240,50 0,80' fill='%23ffffff'/%3E%3C/svg%3E") bottom/cover no-repeat;}
.page-title{font-family:'Shippori Mincho B1',serif;font-size:clamp(2rem,4vw,3.2rem);font-weight:800;color:var(--peak);line-height:1.25;margin-bottom:1rem;animation:fadeUp .8s .2s both ease-out;}
.page-desc{font-size:.9rem;line-height:2;color:var(--sub);max-width:480px;animation:fadeUp .8s .4s both ease-out;}
.filter-bar{padding:3rem 3rem 0;display:flex;gap:.5rem;flex-wrap:wrap;}
.filter-btn{padding:.5rem 1.4rem;font-size:.75rem;letter-spacing:.1em;font-family:'Noto Sans JP',sans-serif;border:1.5px solid var(--mist);background:transparent;color:var(--sub);cursor:pointer;transition:all .2s;}
.filter-btn:hover{border-color:var(--sky);color:var(--sky);}
.filter-btn.active{background:var(--deep);color:#fff;border-color:var(--deep);}
.news-section{padding:2.5rem 3rem 7rem;}
.news-featured{display:grid;grid-template-columns:1fr 1fr;gap:1.5px;background:var(--mist);border:1.5px solid var(--mist);margin-bottom:1.5px;}
.news-card{background:var(--white);padding:2.2rem 2rem;transition:background .3s;text-decoration:none;color:inherit;display:block;}
.news-card:hover{background:var(--snow);}
.news-card.featured{padding:2.8rem 2.5rem;}
.news-card-img{width:100%;height:200px;display:flex;align-items:center;justify-content:center;font-size:3.5rem;background:linear-gradient(135deg,var(--mist),var(--ridge));margin-bottom:1.4rem;}
.news-meta{display:flex;align-items:center;gap:.8rem;margin-bottom:.8rem;}
.news-date{font-size:.68rem;color:var(--sub);letter-spacing:.12em;}
.news-card-title{font-family:'Shippori Mincho B1',serif;font-size:1.05rem;font-weight:700;color:var(--peak);line-height:1.55;margin-bottom:.7rem;transition:color .2s;}
.news-card:hover .news-card-title{color:var(--sky);}
.news-card.featured .news-card-title{font-size:1.25rem;}
.news-card-excerpt{font-size:.82rem;line-height:1.9;color:var(--sub);}
.news-list{border:1.5px solid var(--mist);border-top:none;}
.news-row{display:flex;align-items:flex-start;gap:1.8rem;padding:1.6rem 2rem;border-bottom:1px solid var(--mist);text-decoration:none;color:inherit;background:var(--white);transition:background .25s;}
.news-row:last-child{border-bottom:none;}
.news-row:hover{background:var(--snow);}
.news-row-date{font-size:.7rem;color:var(--sub);letter-spacing:.1em;white-space:nowrap;padding-top:.15rem;min-width:90px;}
.news-row-body{flex:1;}
.news-row-title{font-family:'Shippori Mincho B1',serif;font-size:.97rem;font-weight:700;color:var(--peak);line-height:1.6;margin-bottom:.2rem;transition:color .2s;}
.news-row:hover .news-row-title{color:var(--sky);}
.news-row-excerpt{font-size:.78rem;color:var(--sub);line-height:1.8;}
.news-row-arrow{font-size:.9rem;color:var(--ridge);padding-top:.2rem;align-self:center;transition:transform .2s,color .2s;}
.news-row:hover .news-row-arrow{transform:translateX(4px);color:var(--sky);}
.news-empty{padding:5rem 2rem;text-align:center;color:var(--sub);font-size:.88rem;line-height:2.2;border:1.5px solid var(--mist);display:none;}
@media(max-width:768px){.page-header{padding:8rem 1.5rem 4.5rem;}.filter-bar{padding:2rem 1.5rem 0;}.news-section{padding:2rem 1.5rem 5rem;}.news-featured{grid-template-columns:1fr;}.news-row{flex-direction:column;gap:.5rem;padding:1.3rem 1.5rem;}.news-row-date{min-width:unset;}.news-row-arrow{display:none;}}
</style>
</head>
<body>
${NAV}
<header class="page-header">
  <div>
    <div class="section-eyebrow">News &amp; Blog</div>
    <h1 class="page-title">お知らせ・ブログ</h1>
    <p class="page-desc">最新のサービス情報や飛行レポート、山小屋との取り組みなどをお届けします。</p>
  </div>
</header>
<div class="filter-bar" id="filterBar">
  <button class="filter-btn active" data-filter="all">すべて</button>
  <button class="filter-btn" data-filter="news">お知らせ</button>
  <button class="filter-btn" data-filter="blog">ブログ</button>
  <button class="filter-btn" data-filter="report">飛行レポート</button>
</div>
<section class="news-section">
  <div class="news-featured" id="featuredGrid">${featuredHtml}</div>
  <div class="news-list" id="newsList">${rowsHtml}</div>
  <div class="news-empty" id="newsEmpty"><p>該当する記事がありません。</p></div>
</section>
${FOOTER}
<script>
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const f = btn.dataset.filter;
    let count = 0;
    document.querySelectorAll('[data-category]').forEach(el => {
      const show = f === 'all' || el.dataset.category === f;
      el.style.display = show ? '' : 'none';
      if (show) count++;
    });
    document.getElementById('newsEmpty').style.display = count === 0 ? 'block' : 'none';
  });
});
const obs = new IntersectionObserver(entries => {
  entries.forEach((e,i) => { if(e.isIntersecting){ setTimeout(()=>e.target.classList.add('visible'),i*60); obs.unobserve(e.target); } });
},{threshold:.08});
document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
</script>
${NAV_JS}
</body>
</html>`;

  fs.writeFileSync(path.join(__dirname, 'news.html'), html, 'utf-8');
  console.log('✅ news.html を生成しました');
}

// ── 記事詳細ページを生成 ──────────────────────────────────────────────────────
function buildPostPages() {
  const outDir = path.join(__dirname, 'posts');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  posts.forEach((p, i) => {
    const prev = posts[i + 1];
    const next = posts[i - 1];
    const prevHtml = prev
      ? `<a href="/posts/${prev.id}.html" class="prev"><span class="post-nav-label">← 前の記事</span><span class="post-nav-title">${prev.title}</span></a>`
      : `<span class="prev" style="opacity:.3;pointer-events:none;padding:1.5rem 1.8rem;"><span class="post-nav-label">← 前の記事</span><span class="post-nav-title">—</span></span>`;
    const nextHtml = next
      ? `<a href="/posts/${next.id}.html" class="next"><span class="post-nav-label">次の記事 →</span><span class="post-nav-title">${next.title}</span></a>`
      : `<span class="next" style="opacity:.3;pointer-events:none;padding:1.5rem 1.8rem;text-align:right;"><span class="post-nav-label">次の記事 →</span><span class="post-nav-title">—</span></span>`;

    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<link rel="icon" type="image/png" href="/favicon.png">
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${p.title} | ヤツドロ。</title>
${COMMON_CSS}
<style>
.article-wrap{max-width:760px;margin:0 auto;padding:8rem 2rem 7rem;}
.breadcrumb{display:flex;align-items:center;gap:.5rem;font-size:.7rem;color:var(--sub);letter-spacing:.08em;margin-bottom:2.5rem;animation:fadeUp .7s .1s both ease-out;}
.breadcrumb a{color:var(--sky);text-decoration:none;}
.breadcrumb a:hover{text-decoration:underline;}
.breadcrumb span{opacity:.4;}
.article-meta{display:flex;align-items:center;gap:.8rem;margin-bottom:1.2rem;animation:fadeUp .7s .18s both ease-out;}
.article-date{font-size:.72rem;color:var(--sub);letter-spacing:.12em;}
.article-tag{font-size:.64rem;letter-spacing:.1em;padding:.25rem .8rem;font-weight:500;}
.article-title{font-family:'Shippori Mincho B1',serif;font-size:clamp(1.6rem,3.5vw,2.4rem);font-weight:800;color:var(--peak);line-height:1.45;margin-bottom:2.5rem;animation:fadeUp .7s .26s both ease-out;}
.article-hero-img{width:100%;height:320px;display:flex;align-items:center;justify-content:center;font-size:5rem;background:linear-gradient(135deg,var(--mist),var(--ridge));margin-bottom:3rem;animation:fadeUp .7s .34s both ease-out;}
.article-body{font-size:.95rem;line-height:2.15;color:var(--text);animation:fadeUp .7s .42s both ease-out;}
.article-body p{margin-bottom:1.6em;}
.article-body h2{font-family:'Shippori Mincho B1',serif;font-size:1.3rem;font-weight:700;color:var(--peak);margin:2.8em 0 1em;padding-left:1rem;border-left:3px solid var(--sky);}
.article-body h3{font-family:'Shippori Mincho B1',serif;font-size:1.05rem;font-weight:700;color:var(--deep);margin:2em 0 .7em;}
.article-body ul,.article-body ol{padding-left:1.5rem;margin-bottom:1.6em;}
.article-body li{margin-bottom:.5em;line-height:1.9;}
.article-body blockquote{border-left:3px solid var(--ridge);padding:1rem 1.5rem;margin:2em 0;background:var(--snow);color:var(--sub);font-size:.9rem;}
.article-body strong{color:var(--deep);font-weight:700;}
.article-body a{color:var(--sky);}
.article-divider{width:40px;height:1px;background:var(--ridge);margin:3.5rem 0;}
.post-nav{display:grid;grid-template-columns:1fr 1fr;gap:1.5px;background:var(--mist);border:1.5px solid var(--mist);margin-top:4rem;}
.post-nav a,.post-nav span{background:var(--white);padding:1.5rem 1.8rem;text-decoration:none;color:inherit;transition:background .25s;display:block;}
.post-nav a:hover{background:var(--snow);}
.post-nav-label{font-size:.64rem;letter-spacing:.2em;color:var(--sub);margin-bottom:.5rem;display:block;}
.post-nav-title{font-family:'Shippori Mincho B1',serif;font-size:.9rem;color:var(--deep);line-height:1.55;}
.post-nav .next,.post-nav span:last-child{text-align:right;}
.back-link{display:inline-flex;align-items:center;gap:.5rem;margin-top:3rem;font-size:.78rem;color:var(--sky);text-decoration:none;letter-spacing:.1em;transition:gap .2s;}
.back-link:hover{gap:.8rem;}
@media(max-width:768px){.article-wrap{padding:7rem 1.5rem 5rem;}.article-hero-img{height:200px;font-size:3.5rem;}.post-nav{grid-template-columns:1fr;}}
</style>
</head>
<body>
${NAV}
<div class="article-wrap">
  <nav class="breadcrumb">
    <a href="/index.html">HOME</a><span>/</span>
    <a href="/news.html">お知らせ・ブログ</a><span>/</span>
    <span>${p.title}</span>
  </nav>
  <div class="article-meta">
    <span class="article-date">${p.date}</span>
    <span class="article-tag ${p.tagClass}">${p.tagLabel}</span>
  </div>
  <h1 class="article-title">${p.title}</h1>
  <div class="article-hero-img">${p.emoji}</div>
  <div class="article-body">${p.bodyHtml}</div>
  <div class="article-divider"></div>
  <div class="post-nav">${prevHtml}${nextHtml}</div>
  <a href="/news.html" class="back-link">← お知らせ一覧へ戻る</a>
</div>
${FOOTER}
${NAV_JS}
</body>
</html>`;

    fs.writeFileSync(path.join(outDir, `${p.id}.html`), html, 'utf-8');
    console.log(`✅ posts/${p.id}.html を生成しました`);
  });
}

// ── 実行 ─────────────────────────────────────────────────────────────────────
buildNewsList();
buildPostPages();
console.log('\n🎉 ビルド完了！');
