<script setup>

import { FilterMatchMode } from '@primevue/core/api';
import { ref, onMounted, onBeforeMount } from "vue";

import { useToast } from "primevue/usetoast";

import UserAPI from "@/apis/user";

const toast = useToast();

const errors = ref({});
const users = ref(null);
const userDialog = ref(false);
const deleteUsersDialog = ref(false);
const user = ref({});
const selectedUsers = ref(null);
const dt = ref(null);
const submitted = ref(false);

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
});

onMounted(() => {
    UserAPI.getUsers()
        .then((response) => {
            if (response.status === 200) {
                users.value = response.data;
            }
        })
        .catch((err) => {
            if (err && (err.response.status === 400 || err.response.status === 500)) {
                errors.value.general = err.response.data.message;
            } else {
                errors.value.general = "An error occurred. Please try again later.";
            }
        });
});

const openNew = () => {
    user.value = { role: "administrator", status: "active" };
    submitted.value = false;
    userDialog.value = true;
};

const editUser = (editUser) => {
    user.value = { ...editUser };
    submitted.value = false;
    userDialog.value = true;
};

const hideDialog = () => {
    userDialog.value = false;
    submitted.value = false;
};

const findIndexById = (id) => {
    let index = -1;
    for (let i = 0; i < users.value.length; i++) {
        if (users.value[i]._id === id) {
            index = i;
            break;
        }
    }
    return index;
};

const validateUser = () => {
    errors.value = {};
    let valid = true;


    if (!user.value.name) {
        errors.value.name = "Name is required";
        valid = false;
    }

    if (!user.value.email) {
        errors.value.email = "email is required";
        valid = false;
    }

    if (!user.value._id && !user.value.password) {
        errors.value.password = "Password is required";
        valid = false;
    }

    if (user.value.email != undefined && user.value.email != "") {
        if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(user.value.email)) {
            errors.value.email = "Invalid Email Address";
            valid = false;
        }
    }

    return valid;
};

const saveUser = () => {
    submitted.value = true;
    if (validateUser()) {
        if (user.value._id) {
            const payload = {
                name: user.value.name,
                email: user.value.email,
                password: user.value.password,
                role: user.value.role,
                status: user.value.status,
            };
            UserAPI.updateUser(user.value._id, payload)
                .then((response) => {
                    console.log(response)
                    if (response.status === 200) {
                        delete user.value.password;

                        const result = response.data;

                        user.value.createdAt = result.data.createdAt;
                        user.value.updatedAt = result.data.updatedAt;
                        users.value[findIndexById(user.value._id)] = user.value;
                        toast.add({
                            severity: "success",
                            summary: "Successful",
                            detail: response.data.message,
                            life: 3000,
                        });

                        userDialog.value = false;
                        user.value = {};
                    }
                })
                .catch((err) => {
                    if (err && (err.response.status === 400)) {
                        console.log(err)
                        if (err.response.data.errors && err.response.data.errors.length > 0) {
                            for (const errMessage of err.response.data.errors) {
                                if (errMessage.key == "name") {
                                    errors.value.name = errMessage.message;
                                } else if (errMessage.key == "email") {
                                    errors.value.email = errMessage.message;
                                } else if (errMessage.key == "password") {
                                    errors.value.password = errMessage.message;;
                                } else {
                                    errors.value.general = errMessage.message;
                                }
                            }
                        }
                    } else {
                        errors.value.general = "An error occurred. Please try again later.";
                    }
                });
        } else {
            UserAPI.addUser(user.value)
                .then((response) => {
                    if (response.status === 201) {
                        delete user.value.password;

                        const result = response.data;

                        user.value._id = result.data._id;
                        user.value.createdAt = result.data.createdAt;
                        user.value.updatedAt = result.data.updatedAt;

                        users.value.push(user.value);
                        toast.add({
                            severity: "success",
                            summary: "Successful",
                            detail: response.data.message,
                            life: 3000,
                        });

                        userDialog.value = false;
                        user.value = {};
                    }
                })
                .catch((err) => {
                    if (err && (err.response.status === 400)) {
                        console.log(err)
                        if (err.response.data.errors && err.response.data.errors.length > 0) {
                            for (const errMessage of err.response.data.errors) {
                                if (errMessage.key == "name") {
                                    errors.value.name = errMessage.message;
                                } else if (errMessage.key == "email") {
                                    errors.value.email = errMessage.message;
                                } else if (errMessage.key == "password") {
                                    errors.value.password = errMessage.message;;
                                } else {
                                    errors.value.general = errMessage.message;
                                }
                            }
                        }
                    } else {
                        errors.value.general = "An error occurred. Please try again later.";
                    }
                });
        }
    }
};

const exportCSV = () => {
    dt.value.exportCSV();
};

const confirmDeleteSelected = () => {
    deleteUsersDialog.value = true;
};
const deleteSelectedUsers = () => {
    errors.value = {};
    if (selectedUsers.value.length > 0) {
        const payload = { ids: selectedUsers.value.map((su) => su._id) };

        UserAPI.softDeleteUsers(payload)
            .then((response) => {
                if (response.status === 200) {
                    users.value = users.value.filter((val) => !selectedUsers.value.includes(val));
                    deleteUsersDialog.value = false;
                    selectedUsers.value = null;
                    toast.add({
                        severity: "success",
                        summary: "Successful",
                        detail: response.data.message,
                        life: 3000,
                    });
                }
            })
            .catch((err) => {
                if (
                    err &&
                    (err.response.status === 400 ||
                        err.response.status === 404 ||
                        err.response.status === 500)
                ) {
                    errors.value.general = err.response.data.message;
                } else {
                    errors.value.general = "An error occurred. Please try again later.";
                }

                deleteUsersDialog.value = false;
                selectedUsers.value = null;

                toast.add({
                    severity: "error",
                    summary: "Error",
                    detail: errors.value.general,
                    life: 3000,
                });
            });
    } else {
        deleteUsersDialog.value = false;
        selectedUsers.value = null;
    }
};

// const initFilters = () => {
//     filters.value = {
//         global: { value: null, matchMode: FilterMatchMode.CONTAINS },
//     };
// };

</script>



<template>
    <div class="grid">
        <div class="col-12">
            <div class="card main-card">
                <Toolbar class="mb-4">
                    <template v-slot:start>
                        <div class="my-2">
                            <Button label="New" icon="pi pi-plus" class="mr-2" severity="success" @click="openNew" />
                            <Button label="Delete" icon="pi pi-trash" severity="danger" @click="confirmDeleteSelected"
                                :disabled="!selectedUsers || !selectedUsers.length" />
                        </div>
                    </template>

                    <template v-slot:end>
                        <Button label="Export" icon="pi pi-upload" severity="help" @click="exportCSV($event)" />
                    </template>
                </Toolbar>

                <DataTable ref="dt" stripedRows :value="users" v-model:selection="selectedUsers" dataKey="_id"
                    :paginator="true" :rows="100" v-model:filters="filters" filterDisplay="row"
                    :globalFilterFields="['name', 'email', 'role', 'status']"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    :rowsPerPageOptions="[100, 200, 300]"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} users">
                    <template #header>
                        <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                            <h5 class="m-0">Manage Users</h5>
                            <IconField iconPosition="left" class="block mt-2 md:mt-0">
                                <InputIcon class="pi pi-search" />
                                <InputText class="w-full sm:w-auto" v-model="filters['global'].value"
                                    placeholder="Search..." />
                            </IconField>
                        </div>
                    </template>

                    <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
                    <Column field="name" header="name" :sortable="true" headerStyle="">
                        <template #body="slotProps">
                            {{ slotProps.data.name }}
                        </template>
                    </Column>


                    <Column field="email" header="Email" :sortable="true" headerStyle="">
                        <template #body="slotProps">
                            {{ slotProps.data.email }}
                        </template>
                    </Column>

                    <Column field="role" header="Role" :sortable="true" headerStyle="">
                        <template #body="slotProps">
                            {{ slotProps.data.role }}
                        </template>
                    </Column>

                    <Column field="role" header="Status" :sortable="true" headerStyle="">
                        <template #body="slotProps">
                            {{ slotProps.data.status }}
                        </template>
                    </Column>


                    <Column headerStyle="width: 3rem" v-show="false">
                        <template #body="slotProps">
                            <Button icon="pi pi-pencil" class="mr-2" severity="success" rounded
                                @click="editUser(slotProps.data)" v-tooltip.bottom="'Edit User'" />
                        </template>
                    </Column>

                    <Column field="createdAt" :hidden="true"></Column>
                    <Column field="updatedAt" :hidden="true"></Column>
                </DataTable>

                <Dialog v-model:visible="userDialog" :style="{ width: '50rem' }"
                    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
                    :header="user._id ? 'Update User' : 'Add New User'" :modal="true" class="">

                    <div class="flex items-center gap-4 mb-4">
                        <label for="name" class="font-medium mt-2" style="width: 75px;">Name</label>
                        <div class="flex flex-column flex-auto gap-1">
                            <InputText v-model.trim="user.name" :invalid="submitted && ('name' in errors)"
                                placeholder="Name" id="name" class="w-full" autocomplete="off" />
                            <Message v-if="submitted && errors.name" severity="error" size="small" variant="simple">
                                {{ errors.name }}
                            </Message>
                        </div>
                    </div>

                    <div class="flex items-center gap-4 mb-4">
                        <label for="email" class="font-medium mt-2" style="width: 75px;">Email</label>
                        <div class="flex flex-column flex-auto gap-1">
                            <InputText v-model.trim="user.email" :invalid="submitted && ('email' in errors)"
                                placeholder="Email" id="email" class="w-full" autocomplete="off" />
                            <Message v-if="submitted && errors.email" severity="error" size="small" variant="simple">
                                {{ errors.email }}
                            </Message>
                        </div>
                    </div>


                    <div class="flex items-center gap-4 mb-4">
                        <label for="password" class="font-medium mt-2" style="width: 75px;">Password</label>
                        <div class="flex flex-column flex-auto gap-1">
                            <Password v-model.trim="user.password" :invalid="submitted && ('password' in errors)"
                                placeholder="Password" id="password" class="w-full" autocomplete="off"
                                :feedback="false" />
                            <Message v-if="submitted && errors.password" severity="error" size="small" variant="simple">
                                {{ errors.password }}
                            </Message>
                        </div>
                    </div>

                    <div class="flex items-center gap-4 mb-4">
                        <label for="role" class="font-medium " style="width: 75px;">Role</label>
                        <div class="flex flex-column flex-auto gap-1">
                            <div class="flex flex-wrap gap-4">
                                <div class="flex items-center gap-2">
                                    <RadioButton v-model="user.role" inputId="student" name="role" value="student" />
                                    <label for="student">Student</label>
                                </div>
                                <div class="flex items-center gap-2">
                                    <RadioButton v-model="user.role" inputId="teacher" name="role" value="teacher" />
                                    <label for="teacher">Teacher</label>
                                </div>
                                <div class="flex items-center gap-2">
                                    <RadioButton v-model="user.role" inputId="administrator" name="role"
                                        value="administrator" />
                                    <label for="administrator">Administrator</label>
                                </div>
                            </div>

                            <Message v-if="submitted && errors.role" severity="error" size="small" variant="simple">
                                {{ errors.role }}
                            </Message>
                        </div>
                    </div>

                    <div class="flex items-center gap-4 mb-4">
                        <label for="role" class="font-medium " style="width: 75px;">Status</label>
                        <div class="flex flex-column flex-auto gap-1">
                            <div class="flex flex-wrap gap-4">
                                <div class="flex items-center gap-2">
                                    <RadioButton v-model="user.status" inputId="active" name="status" value="active" />
                                    <label for="active">Active</label>
                                </div>
                                <div class="flex items-center gap-2">
                                    <RadioButton v-model="user.status" inputId="inactive" name="status"
                                        value="inactive" />
                                    <label for="inactive">Inactive</label>
                                </div>
                            </div>

                            <Message v-if="submitted && errors.role" severity="error" size="small" variant="simple">
                                {{ errors.role }}
                            </Message>
                        </div>
                    </div>


                    <div class="field">
                        <small v-if="submitted && errors.general" class="p-error">{{
                            errors.general
                        }}</small>
                    </div>

                    <template #footer>
                        <Button label="Cancel" icon="pi pi-times" @click="hideDialog" severity="secondary" />
                        <Button :label="user._id ? 'Update' : 'Save'" icon="pi pi-check" @click="saveUser" />
                    </template>
                </Dialog>

                <Dialog v-model:visible="deleteUsersDialog" :style="{ width: '50rem' }"
                    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }" header="Confirmation" :modal="true">
                    <div class="flex align-items-center justify-content-center my-3">
                        <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                        <span v-if="user">Are you sure you want to delete the selected users?</span>
                    </div>
                    <template #footer>
                        <Button label="No" icon="pi pi-times" @click="deleteUsersDialog = false" severity="secondary" />
                        <Button label="Yes" icon="pi pi-check" @click="deleteSelectedUsers" severity="danger" />
                    </template>
                </Dialog>
            </div>
        </div>
    </div>
</template>

<style scoped>
.p-fluid .p-button-group {
    min-height: 80px;
}
</style>
