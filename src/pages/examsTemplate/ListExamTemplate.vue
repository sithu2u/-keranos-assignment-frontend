<script setup>

import { FilterMatchMode } from '@primevue/core/api';
import { ref, onMounted, onBeforeMount } from "vue";

import { useToast } from "primevue/usetoast";

import examTemplateApi from "@/apis/examTemplates";
import router from '@/router';

const toast = useToast();

const errors = ref({});
const examTemplates = ref(null);
const dataFormDialog = ref(false);
const deleteRecordDialog = ref(false);
const examTemplate = ref({});
const selectedRecords = ref(null);
const dt = ref(null);
const submitted = ref(false);

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
});

onMounted(() => {
    examTemplateApi.getExamTemplates()
        .then((response) => {
            if (response.status === 200) {
                examTemplates.value = response.data;
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
    // submitted.value = false;
    // dataFormDialog.value = true;
    router.push({ name: "createExamTemplate" })
};

const editRecord = (editRecord) => {
    examTemplate.value = { ...editRecord };
    submitted.value = false;
    dataFormDialog.value = true;
};

const hideDialog = () => {
    dataFormDialog.value = false;
    submitted.value = false;
};

const findIndexById = (id) => {
    let index = -1;
    for (let i = 0; i < examTemplates.value.length; i++) {
        if (examTemplates.value[i]._id === id) {
            index = i;
            break;
        }
    }
    return index;
};

const saveRecord = () => {
    submitted.value = true;
    if (examTemplate.value._id) {

        if (examTemplate.value.title.trim() === "") {
            errors.value.title = "title is required";
            return
        }

        const payload = {
            title: examTemplate.value.title,
        };
        examTemplateApi.updateExamInfo(examTemplate.value._id, payload)
            .then((response) => {
                if (response.status === 200) {
                    const result = response.data;
                    examTemplate.value.createdAt = result.data.createdAt;
                    examTemplate.value.updatedAt = result.data.updatedAt;
                    examTemplates.value[findIndexById(examTemplate.value._id)] = examTemplate.value;
                    toast.add({
                        severity: "success",
                        summary: "Successful",
                        detail: result.data.message,
                        life: 3000,
                    });

                    dataFormDialog.value = false;
                    examTemplate.value = {};
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

const exportCSV = () => {
    dt.value.exportCSV();
};

const confirmDeleteSelected = () => {
    deleteRecordDialog.value = true;
};
const deleteSelectedUsers = () => {
    errors.value = {};
    if (selectedRecords.value.length > 0) {
        const payload = { ids: selectedRecords.value.map((su) => su._id) };

        UserAPI.softDeleteUsers(payload)
            .then((response) => {
                if (response.status === 200) {
                    examTemplates.value = examTemplates.value.filter((val) => !selectedRecords.value.includes(val));
                    deleteRecordDialog.value = false;
                    selectedRecords.value = null;
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

                deleteRecordDialog.value = false;
                selectedRecords.value = null;

                toast.add({
                    severity: "error",
                    summary: "Error",
                    detail: errors.value.general,
                    life: 3000,
                });
            });
    } else {
        deleteRecordDialog.value = false;
        selectedRecords.value = null;
    }
};

const updateRegion = (editRecord) => {

    examTemplate.value = { ...editRecord };
    router.push({ name: "createRegion", params: { id: examTemplate.value._id } })
}

const updateStudentAnswers = (editRecord) => {
    examTemplate.value = { ...editRecord };
    router.push({ name: "uploadStudentAnswers", params: { id: examTemplate.value._id } })
}

const listStudentAnswers = (editRecord) => {
    examTemplate.value = { ...editRecord };
    router.push({ name: "studentAnswers", params: { id: examTemplate.value._id } })
}

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
                                :disabled="!selectedRecords || !selectedRecords.length" />
                        </div>
                    </template>

                    <template v-slot:end>
                        <Button label="Export" icon="pi pi-upload" severity="help" @click="exportCSV($event)" />
                    </template>
                </Toolbar>

                <DataTable ref="dt" stripedRows :value="examTemplates" v-model:selection="selectedRecords" dataKey="_id"
                    :paginator="true" :rows="100" v-model:filters="filters" filterDisplay="row"
                    :globalFilterFields="['name', 'email', 'role', 'status']"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    :rowsPerPageOptions="[100, 200, 300]"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} exam templates">
                    <template #header>
                        <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                            <h5 class="m-0">Manage Exam Template</h5>
                            <IconField iconPosition="left" class="block mt-2 md:mt-0">
                                <InputIcon class="pi pi-search" />
                                <InputText class="w-full sm:w-auto" v-model="filters['global'].value"
                                    placeholder="Search..." />
                            </IconField>
                        </div>
                    </template>

                    <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
                    <Column field="title" header="Template ID" :sortable="true" headerStyle="">
                        <template #body="slotProps">
                            {{ slotProps.data.title }}
                        </template>
                    </Column>



                    <Column field="status" header="Status" :sortable="true" headerStyle="">
                        <template #body="slotProps">
                            {{ slotProps.data.status }}
                        </template>
                    </Column>

                    <Column field="craetedBy" header="Created By" :sortable="true" headerStyle="">
                        <template #body="slotProps">
                            {{ slotProps.data.createdBy.name }}
                        </template>
                    </Column>


                    <Column headerStyle="" v-show="false">
                        <template #body="slotProps">
                            <Button icon="pi pi-pencil" class="mr-2" severity="success" rounded
                                @click="editRecord(slotProps.data)" v-tooltip.bottom="'Edit Exam Template'" />
                            <Button icon="pi pi-map-marker" class="mr-2" severity="info" rounded
                                @click="updateRegion(slotProps.data)" v-tooltip.bottom="'Set Answer Region'" />
                            <Button icon="pi pi-upload" class="mr-2" severity="help" rounded
                                @click="updateStudentAnswers(slotProps.data)"
                                v-tooltip.bottom="'Upload Student Answer'" />
                            <Button icon="pi pi-cog" class="mr-2" rounded @click="listStudentAnswers(slotProps.data)"
                                v-tooltip.bottom="'Manage/OCR Answers'" />
                        </template>
                    </Column>

                    <Column field="createdAt" :hidden="true"></Column>
                    <Column field="updatedAt" :hidden="true"></Column>
                </DataTable>

                <Dialog v-model:visible="dataFormDialog" :style="{ width: '50rem' }"
                    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
                    :header="examTemplate._id ? 'Update Exam Template' : 'Add New Exam Template'" :modal="true"
                    class="">

                    <div class="flex items-center gap-4 mb-4">
                        <label for="title" class="font-medium mt-2" style="width: 90px;">Template Id</label>
                        <div class="flex flex-column flex-auto gap-1">
                            <InputText v-model.trim="examTemplate.title" :invalid="submitted && ('title' in errors)"
                                placeholder="Name" id="title" class="w-full" autocomplete="off" />
                            <Message v-if="submitted && errors.title" severity="error" size="small" variant="simple">
                                {{ errors.title }}
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
                        <Button :label="examTemplate._id ? 'Update' : 'Save'" icon="pi pi-check" @click="saveRecord" />
                    </template>
                </Dialog>

                <Dialog v-model:visible="deleteRecordDialog" :style="{ width: '50rem' }"
                    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }" header="Confirmation" :modal="true">
                    <div class="flex align-items-center justify-content-center my-3">
                        <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                        <span v-if="examTemplate">Are you sure you want to delete the selected exam templates?</span>
                    </div>
                    <template #footer>
                        <Button label="No" icon="pi pi-times" text @click="deleteRecordDialog = false"
                            severity="secondary" />
                        <Button label="Yes" icon="pi pi-check" text @click="deleteSelectedUsers" severity="danger" />
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
