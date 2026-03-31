<script lang="ts">
  interface Props {
    numeral: string;
    titleLa: string;
    titleEn: string;
  }

  let { numeral, titleLa, titleEn }: Props = $props();
</script>

<div class="section-head">
  <span class="numeral">{numeral}</span>
  <span class="title-la">{titleLa}</span>
  <span class="title-en">{titleEn}</span>
</div>

<style>
  .section-head {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 10px;
    padding-bottom: 6px;
    border-bottom: 1px solid #c4a254;
  }

  .numeral {
    font-size: 13px;
    color: #9a7a3a;
    font-variant: small-caps;
    min-width: 18px;
  }

  .title-la {
    font-size: clamp(18px, 5.5vw, 22px);
    font-style: italic;
    color: #1e0f08;
  }

  .title-en {
    font-size: clamp(12px, 3.2vw, 13px);
    color: #7a5c14;
    font-variant: small-caps;
    letter-spacing: 0.5px;
  }
</style>
