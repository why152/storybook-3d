import { useCallback, useEffect, useMemo, useState } from 'react';
import { Storybook3D } from './engine/Storybook3D';
import { defaultVariables, demoStory, resolveText, type StoryVariables } from './data/story';

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

function App() {
  const [variables, setVariables] = useState<StoryVariables>(defaultVariables);
  const [current, setCurrent] = useState(0);
  const [turningIndex, setTurningIndex] = useState<number | null>(null);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [webgl] = useState(supportsWebGL);

  const pages = useMemo(
    () => demoStory.map((page) => ({
      ...page,
      title: resolveText(page.title, variables),
      message: resolveText(page.message, variables),
    })),
    [variables],
  );

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReducedMotion(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const navigate = useCallback((direction: -1 | 1) => {
    if (turningIndex !== null) return;
    const next = current + direction;
    if (next < 0 || next >= pages.length) return;
    if (webgl) setTurningIndex(direction === 1 ? current : current - 1);
    setCurrent(next);
  }, [current, pages.length, turningIndex, webgl]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === 'ArrowRight') navigate(1);
      if (event.key === 'ArrowLeft') navigate(-1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  const onTurnFinished = useCallback((index: number) => {
    setTurningIndex((active) => active === index ? null : active);
  }, []);

  const update = (key: keyof StoryVariables, value: string) => {
    setVariables((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="app-shell">
      <header className="header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">✳</span>
          <span>little<span className="brand-em">story</span>.studio</span>
        </div>
        <span className="top-pill"><span className="pill-dot" /> INTERACTIVE PROTOTYPE · v0.1</span>
      </header>

      <main className="main">
        <section className="intro" aria-labelledby="main-title">
          <div className="eyebrow"><span className="line" /> A STORY YOU CAN TOUCH</div>
          <h1 id="main-title">把心意，<em>翻成故事。</em></h1>
          <p>一封可以亲手翻开的祝福。可替换的文字与独立图层，让同一套 3D 绘本讲述不同的故事。</p>
        </section>

        <section className="workspace" aria-label="3D 绘本演示及自定义编辑">
          <div className="preview-panel">
            <div className="preview-topline">
              <span><i className="view-dot" /> LIVE PREVIEW</span>
              <span>WEBGL · DOUBLE-SIDED PAGES</span>
            </div>
            <div className="stage">
              <div className="stage-orbit" aria-hidden="true" />
              {webgl ? (
                <Storybook3D
                  pages={pages}
                  current={current}
                  turningIndex={turningIndex}
                  reducedMotion={reducedMotion}
                  onTurnFinished={onTurnFinished}
                />
              ) : (
                <div className="static-fallback" role="status">
                  <h2>{pages[Math.min(current, pages.length - 1)].title}</h2>
                  <p>{pages[Math.min(current, pages.length - 1)].message}</p>
                  <small>此浏览器无法启用 WebGL，已切换为静态阅读。</small>
                </div>
              )}
            </div>
            <div className="preview-controls">
              <div className="nav-buttons">
                <button
                  className="circle-button"
                  type="button"
                  onClick={() => navigate(-1)}
                  disabled={current === 0 || turningIndex !== null}
                  aria-label="上一页"
                >←</button>
                <button
                  className="circle-button primary"
                  type="button"
                  onClick={() => navigate(1)}
                  disabled={current === pages.length - 1 || turningIndex !== null}
                  aria-label="下一页"
                >→</button>
              </div>
              <div className="page-progress" aria-live="polite">
                <span>{String(current + 1).padStart(2, '0')}</span>
                <div className="progress-track"><div style={{ width: `${(current / (pages.length - 1)) * 100}%` }} /></div>
                <span>{String(pages.length).padStart(2, '0')}</span>
              </div>
              <div className="hint">点击箭头或使用 ← → 翻页</div>
            </div>
          </div>

          <aside className="editor-panel" aria-label="自定义绘本内容">
            <div className="editor-head">
              <span className="small-tag">01 / CUSTOMIZE</span>
              <h2>写给特别的人</h2>
              <p>试着修改下方内容，书里的文字会实时更新。这是以后模板定制功能的最小验证。</p>
            </div>
            <label htmlFor="receiver">收礼人的名字</label>
            <input
              id="receiver"
              maxLength={12}
              autoComplete="off"
              value={variables.name}
              placeholder="例如：小明"
              onChange={(event) => update('name', event.target.value)}
            />
            <label htmlFor="wish">最后一页的祝福</label>
            <textarea
              id="wish"
              rows={4}
              maxLength={54}
              value={variables.wish}
              onChange={(event) => update('wish', event.target.value)}
            />
            <div className="editor-foot">
              <span className="sparkle">✦</span>
              <div>
                <strong>现在只是一张技术样稿。</strong>
                <p>插画由代码绘制，之后可替换成 AI 生成的原创分层素材。</p>
              </div>
            </div>
          </aside>
        </section>

        <footer>
          <span>MADE TO TELL SOMETHING MEANINGFUL.</span>
          <span>STORYBOOK ENGINE / PRIVATE DEMO</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
