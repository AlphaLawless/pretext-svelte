<script lang="ts">
  import DemoMensura from '$lib/components/DemoMensura.svelte';
  import DemoPagina from '$lib/components/DemoPagina.svelte';
  import DemoFluxu from '$lib/components/DemoFluxu.svelte';
  import DemoCompressione from '$lib/components/DemoCompressione.svelte';
</script>

<svelte:head>
  <title>Præ­textus — Demonstratio Typographiæ Computatæ</title>
</svelte:head>

<main>
  <header>
    <div class="orn">❧ ✦ ❧</div>
    <h1>Præ<span class="sc">textus</span></h1>
    <p class="tagline-la">Demonstratio Typographiæ Computatæ</p>
    <p class="tagline-en">DOM-free text layout — measured once, arithmetic ever after</p>
  </header>

  <DemoMensura />
  <DemoPagina />
  <DemoFluxu />
  <DemoCompressione />

  <footer>
    <div class="orn">⁂</div>
    <p>
      Built with <strong>@chenglou/pretext</strong> —
      canvas <code>measureText</code> for shaping,
      <code>Intl.Segmenter</code> for boundaries,
      pure arithmetic for layout.
    </p>
  </footer>
</main>

<style>
  main {
    max-width: 760px;
    margin: 0 auto;
    padding: 0 24px 80px;
  }

  /* ── Header ─────────────────────────────────────── */
  header {
    text-align: center;
    padding: 56px 0 40px;
    border-bottom: 1px solid #9a7a3a;
    margin-bottom: 52px;
  }

  .orn {
    font-size: 20px;
    color: #7a5c14;
    letter-spacing: 8px;
    margin-bottom: 12px;
  }

  h1 {
    font-size: clamp(36px, 7vw, 52px);
    font-weight: normal;
    letter-spacing: 2px;
    color: #1e0f08;
    line-height: 1;
    margin-bottom: 8px;
  }

  .sc {
    font-variant: small-caps;
  }

  .tagline-la {
    font-size: 14px;
    font-style: italic;
    color: #7a5c14;
    letter-spacing: 1px;
    margin-bottom: 4px;
  }

  .tagline-en {
    font-size: 15px;
    color: #5c3d1f;
  }

  /* ── Footer ─────────────────────────────────────── */
  footer {
    text-align: center;
    border-top: 1px solid #9a7a3a;
    padding-top: 32px;
    margin-top: 16px;
    font-size: 14px;
    color: #5c3d1f;
  }

  footer p {
    margin-top: 10px;
  }

  code {
    font-family: 'Courier New', monospace;
    font-size: 13px;
    background: rgba(0, 0, 0, 0.07);
    padding: 1px 5px;
    border-radius: 2px;
    color: #1e0f08;
  }
</style>
