<template>
    <Toast />





    <div class="flex h-screen">
        <!-- Sidebar (Desktop) -->
        <div class="hidden md:flex flex-column bg-gray-100 p-4 w-16rem shrink-0 sticky top-0 overflow-y-auto shadow">
            <SidebarMenu />
        </div>

        <!-- Mobile Top Bar -->
        <div class="flex md:hidden items-center justify-between bg-gray-200 p-3 fixed top-0 left-0 right-0 z-50">

            <Button icon="pi pi-bars" text @click="mobileMenuVisible = true" />
            <div class="font-bold" style="line-height: 40px;">My App</div>
        </div>

        <!-- Slide-in Sidebar (Mobile) -->
        <div v-if="mobileMenuVisible"
            class="fixed top-0 left-0 h-full w-16rem bg-gray-200 shadow-2 z-50 p-4 transition-transform"
            style="transform: translateX(0);z-index: 50;">
            <div class="flex justify-end mb-3">
                <Button icon="pi pi-times" text @click="mobileMenuVisible = false" />
            </div>
            <SidebarMenu @navigate="mobileMenuVisible = false" />
        </div>

        <!-- Main Content -->
        <div class="flex-1 overflow-auto p-4 w-full mt-5 md:mt-0">
            <RouterView />
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import SidebarMenu from './SidebarMenu.vue'

const mobileMenuVisible = ref(false)
</script>
