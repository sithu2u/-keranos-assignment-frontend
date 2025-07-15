import { createApp } from "vue";
import PrimeVue from "primevue/config";
import Aura from "@primeuix/themes/aura";
import "primeflex/primeflex.css";
import "primeicons/primeicons.css";
import "@/assets/style.css";
import App from "./App.vue";
import router from "./router";
import { createPinia } from "pinia";
import { useUserStore } from "./stores/user";
import { primevueComponents } from "@/utils/primeVueComponents";

import ToastService from "primevue/toastservice";
import Tooltip from "primevue/tooltip";

const app = createApp(App);

const pinia = createPinia();
app.use(pinia);

app.use(router);

const userStore = useUserStore();
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !userStore.isAuthenticated) {
    next("/login");
  } else {
    next();
  }
});

app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: false || "none",
    },
  },
});

app.use(ToastService);

app.directive("tooltip", Tooltip);

// Register components globally
for (const [name, component] of Object.entries(primevueComponents)) {
  app.component(name, component);
}

app.mount("#app");
