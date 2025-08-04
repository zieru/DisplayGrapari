
<script lang="ts" setup>
import { computed } from 'vue';

import { preferences } from '@vben/preferences';
import { $t } from '#/locales';


const appName = computed(() => preferences.app.name);
const logo = computed(() => preferences.logo.source);
</script>

<template>
</template>
