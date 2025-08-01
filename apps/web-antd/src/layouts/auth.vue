
<script lang="ts" setup>
import { computed } from 'vue';

import { preferences } from '@vben/preferences';
import { $t } from '#/locales';

import Authbase from '#/layouts/authbase.vue';

const appName = computed(() => preferences.app.name);
const logo = computed(() => preferences.logo.source);
</script>

<template>
  <Authbase
    :app-name="appName"
    :logo="logo"
    :page-description="$t('authentication.pageDesc')"
    :page-title="$t('authentication.pageTitle')"
  >
    <span>Testing</span>
  </Authbase>
</template>
