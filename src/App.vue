<template>
  <q-no-ssr>
    <router-view v-slot="{ Component }">
      <Suspense>
        <template #default>
          <div class="relative">
            <component :is="Component" />

          </div>
        </template>
        <template #fallback>
          <div class="flex items-center justify-center h-full">
            <q-spinner-dots color="primary" size="50px" />
          </div>
        </template>
      </Suspense>
    </router-view>
  </q-no-ssr>
</template>
