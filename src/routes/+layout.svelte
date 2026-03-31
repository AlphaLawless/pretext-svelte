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
    line-height: 1.55;
    /* Prevents a horizontal scrollbar if any child overflows.
       Individual scroll containers handle their own overflow. */
    overflow-x: hidden;
  }
</style>
