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
            <q-avatar class="">
              <q-img src="/app.png" alt="Logo" class="" />
            </q-avatar>
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
