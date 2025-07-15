<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import authApi from "@/apis/auth";


const email = ref('');
const password = ref('');
const errors = ref({});
const userStore = useUserStore();
const router = useRouter();

onMounted(() => {

  if (userStore.isAuthenticated) {
    router.push({ name: 'home' });
  }

});

const validateAndLogin = () => {
  errors.value = {};
  if (!email.value) errors.value.email = 'email is required';
  if (!password.value) errors.value.password = 'Password is required';
  if (!errors.value.email && !errors.value.password) {

    authApi.login({ email: email.value, password: password.value })
      .then((response) => {

        if (response.status === 200) {

          localStorage.setItem('token', response.data.token)
          localStorage.setItem('user', response.data.user)
          localStorage.setItem('isAuthenticated', true)
          const userStore = useUserStore()
          userStore.login({ user: response.data.user, token: response.data.token })

          // if (userRole == "administrator") {
          //   router.push({ name: 'dashboard' });
          // } else if (userRole == "teacher") {
          //   router.push({ name: 'schedule', params: { machine: 'machineM1' } });
          // } else {
          //   router.push({ name: 'machine', params: { machine: 'machineM1' } });
          // }

          router.push({ name: 'home' });
        }
      })
      .catch((err) => {
        if (err && (err.response.status === 400 || err.response.status === 500)) {
          errors.value.general = err.response.data.message;
        } else {
          errors.value.general = "An error occurred. Please try again later.";
        }
      });

  }
};


</script>

<template>
  <div class="surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden">
    <div class="flex flex-column align-items-center justify-content-center">
      <div style="border-radius: 56px; padding: 0.3rem; background: var(--primary-color)">
        <div class="w-full surface-card py-8 px-5 sm:px-8" style="border-radius: 53px">
          <div class="text-center mb-5">
            <div class="text-900 text-3xl font-medium mb-3">Welcome back!</div>
            <span class="text-600 font-medium">Sign in to continue</span>
          </div>
          <form @keyup.enter="validateAndLogin">
            <div>
              <label for="email" class="block text-900 font-medium text-xl mb-2">Email</label>
              <InputText id="email" name="email" type="text" placeholder="email" class="w-full md:w-30rem "
                style="padding: 1rem" v-model="email" />
              <Message v-if="errors.email" severity="error" size="small" variant="simple" class="pt-1">{{ errors.email
              }}
              </Message>

              <label for="password" class="block text-900 font-medium text-xl mb-2 mt-4">Password</label>
              <Password id="password" name="password" v-model="password" placeholder="Password" :toggleMask="true"
                :feedback="false" class="w-full " inputClass="w-full" :inputStyle="{ padding: '1rem' }"></Password>
              <Message v-if="errors.password" severity="error" size="small" variant="simple" class="pt-1">{{
                errors.password }}
              </Message>
              <Message v-if="errors.general" severity="error" size="small" variant="simple" class="pt-1">{{
                errors.general
              }}
              </Message>
              <Button label="Sign In" class="w-full p-3 text-xl mt-5" @click="validateAndLogin"></Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>


<style scoped>
.pi-eye {
  transform: scale(1.6);
  margin-right: 1rem;
}

.pi-eye-slash {
  transform: scale(1.6);
  margin-right: 1rem;
}
</style>