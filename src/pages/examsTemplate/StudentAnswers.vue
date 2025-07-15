<script setup>

import { HostURL } from "@/config";
import { FilterMatchMode } from '@primevue/core/api';
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useToast } from "primevue/usetoast";

import studentAnswersApi from "@/apis/studentAnswers";


const toast = useToast();
const route = useRoute();
const router = useRouter();

const errors = ref({});
const studentAnswers = ref(null);
const actionOcrDialog = ref(false);
const selectedRecords = ref(null);
const dt = ref(null);
const ocrSubmitted = ref(false);

const ocrProcessTotal = ref(0);
const ocrPending = ref(0);

const progress = computed(() => {
    if (ocrProcessTotal.value === 0) return 0;
    return ((ocrProcessTotal.value - ocrPending.value) / ocrProcessTotal.value) * 100;
});



const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
});

onMounted(() => {
    studentAnswersApi.findAllStudentAnswers(route.params.id)
        .then((response) => {
            if (response.status === 200) {
                studentAnswers.value = response.data;
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

const findIndexById = (id) => {
    let index = -1;
    for (let i = 0; i < studentAnswers.value.length; i++) {
        if (studentAnswers.value[i]._id === id) {
            index = i;
            break;
        }
    }
    return index;
};

const confirmOcrSelected = () => {
    actionOcrDialog.value = true;
};


const doOcrSelectedRecords = async () => {
    const ids = selectedRecords.value.map(su => su._id);

    if (!ids.length) {
        actionOcrDialog.value = false;
        selectedRecords.value = null;
        ocrSubmitted.value = false;
        return;
    }

    ocrSubmitted.value = true;
    ocrPending.value = ids.length;
    errors.value = {};

    // Use route param properly:
    const exam_id = route.params.id;

    await doOcrRecursive(exam_id, ids, true);
};


const doOcrRecursive = async (exam_id, ids, resetFlag) => {
    try {
        const payload = { ids, resetFlag };
        const response = await studentAnswersApi.ocrRequest(exam_id, payload);

        if (response.status === 200) {
            const processedAnswer = response.data.studentAnswer;
            const index = findIndexById(processedAnswer._id);

            if (index !== -1) {
                studentAnswers.value.splice(index, 1, processedAnswer);
            }

            console.log(response.data)
            if (response.data.ocrPending && response.data.ocrPending !== 0) {

                ocrPending.value = response.data.ocrPending
                ocrProcessTotal.value = response.data.ocrProcessTotal

                // Recursive call with reset ocr test false flag
                await doOcrRecursive(exam_id, ids, false);
            } else {
                // All done
                resetOcrState(response);
            }
        } else {
            throw new Error("Unexpected response status: " + response.status);
        }
    } catch (err) {
        errors.value.general = err.response?.data?.message || "An error occurred. Please try again later.";

        actionOcrDialog.value = false;
        selectedRecords.value = null;
        ocrSubmitted.value = false;

        toast.add({
            severity: "error",
            summary: "Error",
            detail: errors.value.general,
            life: 3000,
        });

        resetOcrState({ response: { data: { message: "An error occurred." } } });
    }
};

const resetOcrState = (response) => {
    ocrProcessTotal.value = 0;
    ocrPending.value = 0;
    actionOcrDialog.value = false;
    selectedRecords.value = null;
    ocrSubmitted.value = false;

    toast.add({
        severity: "success",
        summary: "Successful",
        detail: response.data.message || "OCR processing complete",
        life: 3000,
    });
}

const viewOcrResult = (studentAnswer) => {
    router.push({ name: "viewOcrResult", params: { id: route.params.id, answerId: studentAnswer._id } })
}


</script>



<template>
    <div class="grid">
        <div class="col-12">
            <div class="card main-card">
                <Toolbar class="mb-4">
                    <template v-slot:start>
                        <div class="my-2">

                            <Button type="button" label="Back" icon="pi pi-arrow-left" class="mr-2"
                                @click="router.push({ name: 'examTemplates' })" />
                            <Button label="Mark OCR Test" icon="pi pi-check" severity="success"
                                @click="confirmOcrSelected" :disabled="!selectedRecords || !selectedRecords.length" />
                        </div>
                    </template>


                </Toolbar>

                <DataTable ref="dt" stripedRows :value="studentAnswers" v-model:selection="selectedRecords"
                    dataKey="_id" :paginator="true" :rows="100" v-model:filters="filters" filterDisplay="row"
                    :globalFilterFields="['name', 'email', 'role', 'status']"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    :rowsPerPageOptions="[100, 200, 300]"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} studentAnswers">
                    <template #header>
                        <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                            <h5 class="m-0">Manage Student Answers</h5>
                            <IconField iconPosition="left" class="block mt-2 md:mt-0">
                                <InputIcon class="pi pi-search" />
                                <InputText class="w-full sm:w-auto" v-model="filters['global'].value"
                                    placeholder="Search..." />
                            </IconField>
                        </div>
                    </template>

                    <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
                    <Column field="processedImagesUrl" header="Answer Image" :sortable="true" headerStyle="">
                        <template #body="slotProps">
                            <div class="flex flex-wrap gap-2">


                                <Image v-for="(img, index) in slotProps.data.processedImagesUrl" :key="index"
                                    alt="Image" preview>
                                    <template #previewicon>
                                        <i class="pi pi-search"></i>
                                    </template>
                                    <template #image>
                                        <img :src="`${HostURL}/${img}`" alt="image"
                                            style="width: 80px; height: auto; border-radius: 4px;" />
                                    </template>
                                    <template #preview="slotProps">
                                        <img :src="`${HostURL}/${img}`" alt="preview" :style="slotProps.style"
                                            @click="slotProps.onClick" />
                                    </template>
                                </Image>

                            </div>
                        </template>
                    </Column>



                    <Column field="status" header="OCR Status" :sortable="true" headerStyle="">
                        <template #body="slotProps">
                            {{ slotProps.data.status }}
                        </template>
                    </Column>

                    <Column headerStyle="width: 3rem" v-show="false">
                        <template #body="slotProps">
                            <Button icon="pi pi-eye" class="mr-2" severity="info" rounded
                                @click="viewOcrResult(slotProps.data)" v-tooltip.bottom="'View OCR Result'"
                                :disabled="slotProps.data.status == 'pending'" />
                        </template>
                    </Column>


                    <Column field="createdAt" :hidden="true"></Column>
                    <Column field="updatedAt" :hidden="true"></Column>
                </DataTable>



                <Dialog v-model:visible="actionOcrDialog" :style="{ width: '50rem' }"
                    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }" header="Confirmation" :modal="true">
                    <div class="flex align-items-center justify-content-center my-3">
                        <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                        <span>Are you sure you want to do OCR and check result for selected student
                            answers?</span>
                    </div>

                    <div v-if="ocrSubmitted || ocrPending != 0">
                        <ProgressBar :value="progress" showValue />
                        <p>{{ progress.toFixed(0) }}%</p>
                    </div>

                    <template #footer>
                        <Button label="No" icon="pi pi-times" @click="actionOcrDialog = false" severity="secondary" />
                        <Button label="Yes" icon="pi pi-check" @click="doOcrSelectedRecords" severity="success" />
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
