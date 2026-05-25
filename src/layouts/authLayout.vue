<template>
  <q-layout view="lHh Lpr lff">
    <q-page-container>
      <q-page
        class="min-h-screen relative overflow-hidden flex items-center justify-center p-4 sm:p-6 bg-[linear-gradient(180deg,#f8fbff_0%,#eef4fb_100%)]">
        <!-- Abstract background pattern -->
        <div
          class="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.14)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.14)_1px,transparent_1px)] bg-size-[56px_56px] mask-[radial-gradient(circle_at_center,black_56%,transparent_100%)] opacity-[0.18] pointer-events-none">
        </div>

        <!-- Glows -->
        <div
          class="absolute top-[-12%] left-[-12%] w-[34vw] h-[34vw] rounded-full blur-[120px] pointer-events-none opacity-70 bg-blue-500/15">
        </div>
        <div
          class="absolute bottom-[-12%] right-[-12%] w-[32vw] h-[32vw] rounded-full blur-[120px] pointer-events-none opacity-70 bg-sky-500/10">
        </div>

        <div class="relative z-10 w-full max-w-md flex flex-col items-center">
          <!-- Brand Badge -->
          <div
            class="flex items-center gap-3 mx-auto mb-4 sm:mb-5 w-fit px-3.5 py-2.5 border border-slate-400/20 rounded-2xl bg-white/80 backdrop-blur-md shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <div
              class="w-10 h-10 rounded-xl grid place-items-center text-blue-600 bg-blue-600/10 border border-blue-600/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div>
              <div class="text-subtitle1 text-weight-bold text-slate-800 leading-tight">TakeLog</div>
              <div class="text-caption text-slate-500">Espace de connexion</div>
            </div>
          </div>

          <!-- Content -->
          <div class="w-full flex justify-center">
            <router-view />
          </div>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
</script>
