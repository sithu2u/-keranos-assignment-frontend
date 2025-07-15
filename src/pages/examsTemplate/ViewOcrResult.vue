<script setup>
import { HostURL } from "@/config";
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import studentAnswersApiApi from '@/apis/studentAnswers';
import LoadingLayout from '@/components/LoadingLayout.vue';

const route = useRoute();
const router = useRouter();
const isLoading = ref(false);
const ocrResult = ref({});
const studentAnswer = ref({});
const errors = ref({});
const dt = ref(null);

onMounted(() => {
    isLoading.value = true;
    if (!route.params.id) router.push({ name: "examTemplates" });

    studentAnswersApiApi.getStudentAnswerOcrResult(route.params.id, route.params.answerId)
        .then((response) => {
            if (response.status === 200) {
                ocrResult.value = response.data.ocrResult;
                studentAnswer.value = response.data.studentAnswer;

                isLoading.value = false;
            }
        })
        .catch((err) => {
            if (err && (err.response.status === 400 || err.response.status === 500)) {
                errors.value.general = err.response.data.message;
            } else {
                errors.value.general = "An error occurred. Please try again later.";

                isLoading.value = false;
            }
        });
});

const typeLabel = (type) => {
    switch (type) {
        case "multiple_choice":
            return "Multiple Choice";
        case "short_answer":
            return "Short Answer";
        case "long_answer":
            return "Long Answer"
        default:
            return type;
    }

}

const backToExamTemplate = () => {
    router.push({ name: "studentAnswers", params: { id: route.params.id } })
}

</script>


<template>

    <div v-if="isLoading">
        <LoadingLayout></LoadingLayout>
    </div>
    <div v-else class="grid">
        <div class="col-12">
            <div class="card main-card">

                <Toolbar class="mb-4">
                    <template v-slot:start>
                        <div class="my-2">

                            <Button type="button" label="Back" icon="pi pi-arrow-left" @click="backToExamTemplate" />

                        </div>

                    </template>

                    <template v-slot:end>

                    </template>
                </Toolbar>


                <div class="flex items-center gap-4 py-2 mb-5">
                    <label for="title" class="">Answer Image</label>
                    <div>
                        <div class="flex flex-wrap gap-2">
                            <div v-for="(ans, key) in studentAnswer.processedImagesUrl" :key="key">
                                <Image alt="Image" preview style="border: 1px solid #ccc;">
                                    <template #previewicon>
                                        <i class="pi pi-search"></i>
                                    </template>
                                    <template #image>
                                        <img :src="`${HostURL}/${ans}`" alt="image" width="80" />
                                    </template>
                                    <template #preview="slotProps">
                                        <img :src="`${HostURL}/${ans}`" alt="preview" :style="slotProps.style"
                                            @click="slotProps.onClick" />
                                    </template>
                                </Image>
                            </div>
                        </div>
                    </div>
                </div>

                <DataTable ref="dt" stripedRows :value="ocrResult.ocrRegions" dataKey="_id" :paginator="true"
                    :rows="100"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    :rowsPerPageOptions="[100, 200, 300]"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} users">
                    <template #header>
                        <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                            <h5 class="m-0">OCR Result Detail</h5>
                        </div>
                    </template>

                    <Column field="region" header="region" headerStyle="">
                        <template #body="slotProps">
                            Page {{ slotProps.data.page }} - {{ slotProps.data.regionLabel }}
                        </template>
                    </Column>


                    <Column field="type" header="type" headerStyle="">
                        <template #body="slotProps">
                            {{ typeLabel(slotProps.data.type) }}
                        </template>
                    </Column>


                    <Column field="detectAnswer" header="Detect Answer" headerStyle="">
                        <template #body="slotProps">
                            <div style="white-space: pre-line;">{{ slotProps.data.detectAnswer }}</div>

                            <a :href="`${HostURL}/uploads/ocr_regions/${studentAnswer.examTemplate}/${studentAnswer._id}/${slotProps.data.regionId}.jpg`"
                                target="_blank">
                                <Button label="image" size="small" severity="info" />
                            </a>
                        </template>
                    </Column>


                    <Column field="confidence" header="Confidence" headerStyle="">
                        <template #body="slotProps">
                            {{ slotProps.data.confidence }}
                        </template>
                    </Column>


                    <Column field="isCorrect" header="isCorrect" headerStyle="">
                        <template #body="slotProps">
                            {{ slotProps.data.isCorrect }}
                        </template>
                    </Column>


                    <Column field="pointsAwarded" header="Points Awarded" headerStyle="">
                        <template #body="slotProps">
                            {{ slotProps.data.pointsAwarded }}
                        </template>
                    </Column>


                </DataTable>

            </div>
        </div>
    </div>

</template>
