<script>
  export let message = "";
</script>

<div class="relative group inline-block">
  <!-- Info Icon -->
  <span
    class="text-gray-600 hover:text-gray-800 cursor-pointer select-none"
    aria-label="info"
  >
    🛈
  </span>

  <div
    class="absolute bottom-full left-1/2 mb-2 w-max max-w-xs px-2 py-1 text-sm text-white bg-gray-800 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity"
  >
    {message}
  </div>
</div>
