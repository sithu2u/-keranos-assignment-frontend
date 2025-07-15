<template>
    <div class="p-4">
        <h1 class="text-xl mb-4">Welcome to Administrator Dashboard</h1>
        <Button label="Logout" icon="pi pi-check" @click="logoutUser" />
    </div>
</template>

<script setup>
import { useUserStore } from '@/stores/user';
import { useRouter } from 'vue-router';

const router = useRouter();
const userStore = useUserStore()


const logoutUser = () => {
    userStore.logout();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    router.push({ name: 'login' });
}
</script>
