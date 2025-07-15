<template>
    <h3 class="text-left m-0 mb-4">Assignment</h3>
    <div class="flex flex-column gap-2">
        <router-link to="/" class="p-button p-button-sm w-full text-left no-underline
" @click="$emit('navigate')">Home</router-link>
        <router-link to="/exam-templates" class="p-button p-button-sm w-full text-left no-underline
" @click="$emit('navigate')">Exam Templates</router-link>
        <router-link to="/users" class="p-button p-button-sm w-full text-left no-underline
" @click="$emit('navigate')">Users</router-link>
        <Button class="p-button p-button-sm w-full text-left" @click="logoutUser">Logout</Button>
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
