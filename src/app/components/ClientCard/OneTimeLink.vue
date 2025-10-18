<template>
  <div v-if="client.oneTimeLink !== null" class="text-xs text-gray-400">    
    <a :href="'./cnf/' + client.oneTimeLink.oneTimeLink">{{ path }}</a>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig();  // Получаем config

const baseURL0 = config.public.appbaseURL;

let SubFolder = baseURL0;
if (SubFolder.length > 1 && !SubFolder.startsWith('/')) {
  SubFolder = '/' + SubFolder;
};

if (SubFolder.length > 1 && !SubFolder.endsWith('/')) {
  SubFolder = SubFolder + '/';
}

const props = defineProps<{ client: LocalClient }>();

const path = ref('Loading...');
const timer = ref<NodeJS.Timeout | null>(null);

const { localeProperties } = useI18n();

onMounted(() => {
  timer.value = setIntervalImmediately(() => {
    if (props.client.oneTimeLink === null) {
      return;
    }

    const timeLeft =
      new Date(props.client.oneTimeLink.expiresAt).getTime() - Date.now();

    if (timeLeft <= 0) {
      path.value = `${document.location.protocol}//${document.location.host}${SubFolder}cnf/${props.client.oneTimeLink.oneTimeLink} (00:00)`;
      return;
    }

    const formatter = new Intl.DateTimeFormat(localeProperties.value.language, {
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });

    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);

    const date = new Date(0);
    date.setMinutes(minutes);
    date.setSeconds(seconds);

    path.value = `${document.location.protocol}//${document.location.host}${SubFolder}cnf/${props.client.oneTimeLink.oneTimeLink} (${formatter.format(date)})`;
  }, 1000);
});

onUnmounted(() => {
  if (timer.value) {
    clearTimeout(timer.value);
  }
});
</script>
