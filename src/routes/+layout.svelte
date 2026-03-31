<script lang="ts">
  import favicon from '$lib/assets/favicon.svg';

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link
    href="https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&display=swap"
    rel="stylesheet"
  />
</svelte:head>

{@render children()}

<style>
  /* ── Global reset ───────────────────────────────── */
  :global(*),
  :global(*::before),
  :global(*::after) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  /* ── Base typography ────────────────────────────── */
  /* font-family / font-size / line-height here must match
     BODY_FONT and BODY_LINE_H in src/lib/constants.ts   */
  :global(body) {
    background: #e8d8a8;
    color: #2c1810;
    font-family: 'IM Fell English', Georgia, serif;
    font-size: 18px;
    line-height: 1.6;
    overflow-x: hidden;
  }

  /* IM Fell English has thin strokes — it needs generous sizing to stay
     legible on narrow screens. Bump the baseline up, not down. */
  @media (max-width: 480px) {
    :global(body) {
      font-size: 17px;
      line-height: 1.65;
    }
  }
</style>
