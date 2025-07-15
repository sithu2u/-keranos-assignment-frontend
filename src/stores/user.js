import { defineStore } from "pinia";

export const useUserStore = defineStore("user", {
  state: () => ({
    isAuthenticated: localStorage.getItem("isAuthenticated") || false,
    user: localStorage.getItem("user") || null,
    token: localStorage.getItem("token") || false,
  }),
  actions: {
    login(payload) {
      this.isAuthenticated = true;
      this.user = payload.user;
      this.token = payload.token;
    },
    logout() {
      this.isAuthenticated = false;
      this.user = null;
      this.token = null;
    },
  },
});
