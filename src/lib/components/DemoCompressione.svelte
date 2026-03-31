<script lang="ts">
  import { onMount } from 'svelte';
  import { prepareWithSegments, layoutWithLines, walkLineRanges } from '@chenglou/pretext';
  import SectionHead from './SectionHead.svelte';

  interface QuoteEntry {
    text: string;
    attr: string;
    dir?: 'ltr' | 'rtl';
  }

  interface ShrinkItem extends QuoteEntry {
    width: number;
    lines: string[];
  }

  const QUOTES: QuoteEntry[] = [
    { text: 'Cogito, ergo sum.', attr: 'Descartes · 1637' },
    { text: 'E pur si muove.', attr: 'Galilei · c. 1633' },
    { text: '春眠不覺曉，處處聞啼鳥。', attr: 'Meng Haoran · 689' },
    { text: 'Vanity of vanities; all is vanity.', attr: 'KJV Ecclesiastes · 1611' },
    {
      text: 'مَنْ عَاشَ مَاتَ، وَمَنْ مَاتَ فَاتَ.',
      attr: 'Arabic proverb',
      dir: 'rtl',
    },
    {
      text: 'Homo sum, humani nihil a me alienum puto.',
      attr: 'Terence · 163 BC',
    },
  ];

  const FONT = '16px "IM Fell English"';
  const LINE_H = 26;
  const MAX_W = 300;

  let items = $state<ShrinkItem[]>([]);

  onMount(async () => {
    await document.fonts.ready;
    build();
  });

  function build() {
    items = QUOTES.map((q) => {
      const prepared = prepareWithSegments(q.text, FONT);

      let maxLineW = 0;
      walkLineRanges(prepared, MAX_W, (line) => {
        if (line.width > maxLineW) maxLineW = line.width;
      });
      const shrinkW = Math.ceil(maxLineW) + 28;

      const { lines } = layoutWithLines(prepared, shrinkW, LINE_H);
      return { ...q, width: shrinkW, lines: lines.map((l) => l.text) };
    });
  }
</script>

<section>
  <SectionHead numeral="IV." titleLa="De Compressione" titleEn="On Compression" />

  <p class="desc">
    <code>walkLineRanges()</code> returns each line's width without building text strings.
    Here it finds the tightest container that still fits each quote — the "shrink-wrap"
    that CSS has always lacked for multiline text, across any script.
  </p>

  <div class="grid">
    {#each items as item}
      <div class="card" style="width: min({item.width}px, 100%);" dir={item.dir ?? 'ltr'}>
        <div class="text">
          {#each item.lines as line}
            <div>{line}</div>
          {/each}
        </div>
        <div class="footer">
          <span class="attr">{item.attr}</span>
          <span class="badge">{item.width}px</span>
        </div>
      </div>
    {/each}
  </div>
</section>

<style>
  section {
    margin-bottom: 64px;
  }

  .desc {
    font-size: 16px;
    line-height: 1.7;
    color: #3d2010;
    margin-bottom: 24px;
  }

  code {
    font-family: 'Courier New', monospace;
    font-size: 13px;
    background: rgba(0, 0, 0, 0.07);
    padding: 1px 5px;
    border-radius: 2px;
    color: #1e0f08;
  }

  @media (max-width: 480px) {
    .desc { font-size: 17px; }
    code  { font-size: 14px; }
  }

  /* ── Grid ────────────────────────────────── */
  .grid {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    /* Align cards to the start so short cards don't stretch */
    align-items: flex-start;
  }

  /* ── Card ────────────────────────────────── */
  .card {
    background: #f0e4c0;
    border: 1px solid #c4a254;
    padding: 12px 14px 8px;
    box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.08);
    position: relative;
    /* min() in the inline style already caps width to 100%, but this
       ensures the card never exceeds its grid row on tiny screens. */
    max-width: 100%;
    overflow: hidden;
    /* Prevent card from collapsing below its content */
    min-width: 0;
  }

  /* ── Quote text ──────────────────────────── */
  .text {
    font-family: 'IM Fell English', Georgia, serif;
    font-size: 16px;
    line-height: 26px;
    color: #1e0f08;
    /* pretext sized the card — let the text overflow-scroll rather than
       reflow, which would make the measured width incorrect. */
    white-space: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  /* ── Footer row ──────────────────────────── */
  .footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 8px;
    margin-top: 6px;
    border-top: 1px solid #c4a254;
    padding-top: 4px;
    /* Allow footer to wrap if both pieces of text are long */
    flex-wrap: wrap;
  }

  .attr {
    font-size: 11px;
    font-style: italic;
    color: #7a5c14;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }

  .badge {
    font-size: 11px;
    font-variant-numeric: tabular-nums;
    font-variant: small-caps;
    color: #9a7a3a;
    white-space: nowrap;
    flex-shrink: 0;
  }

  @media (max-width: 480px) {
    .attr  { font-size: 13px; }
    .badge { font-size: 12px; }
  }
</style>
