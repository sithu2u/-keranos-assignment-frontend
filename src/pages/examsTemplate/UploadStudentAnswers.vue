<script setup>
import { ref, onMounted } from "vue";
import examTemplatesApi from '@/apis/examTemplates';
import LoadingLayout from '@/components/LoadingLayout.vue';

import { useToast } from "primevue/usetoast";

import examTemplateApi from "@/apis/examTemplates";
import { useRoute, useRouter } from "vue-router";



const route = useRoute();
const router = useRouter();

const isLoading = ref(false);
const toast = useToast();
const examTemplate = ref({});
const answerDocuments = ref([]);
const errors = ref({});
const submitted = ref(false);
const fileUploadRef = ref(null);
const clearUploadCallback = ref(null);

const storeClearCallback = (callback) => {
    clearUploadCallback.value = callback;
};

const backToExamTemplate = () => {
    router.push({ name: "examTemplates" })
}


const onDocumentSelect = (event) => {
    answerDocuments.value = event.files;
};


const saveExamTemplate = () => {
    errors.value = {};
    submitted.value = true;

    if (answerDocuments.value.length === 0) { errors.value.answerDocuments = 'Student Answer Document is required'; return }

    let formData = new FormData();

    answerDocuments.value.forEach(file => {
        formData.append("files", file); // multiple files under the same key
    });

    examTemplateApi.uploadStudentAnswers(route.params.id, formData)
        .then((response) => {
            if (response.status === 201) {
                clearUploadCallback.value?.();

                const result = response.data;
                toast.add({
                    severity: "success",
                    summary: "Successful",
                    detail: result.data.message,
                    life: 3000,
                });
                answerDocuments.value = [];

                // router.push({ name: "createRegion", params: { id: result.data._id } });

            }
        })
        .catch((err) => {
            console.log(err)
            if (err && (err.response.status === 400 || err.response.status === 500)) {
                errors.value.general = err.response.data.message;
            } else {
                errors.value.general = "An error occurred. Please try again later.";
            }
        });


}

onMounted(() => {
    isLoading.value = true;
    if (!route.params.id) router.push({ name: "examTemplates" });

    examTemplatesApi.getOneExamTemplate(route.params.id)
        .then((response) => {
            if (response.status === 200) {
                examTemplate.value = response.data.data;

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

                <h4 class="mb-5">Upload Studnet Answers</h4>

                <div class="flex items-center gap-4 py-2">
                    <label for="title" class="font-medium" style="width: 90px;">Exam Info</label>
                    <div>
                        {{ examTemplate.title }}
                    </div>
                </div>

                <div class="flex items-center gap-4  py-2">
                    <label for="title" class="font-medium" style="width: 90px;">No of Pages</label>
                    <div>
                        {{ examTemplate.pages }}
                    </div>
                </div>



                <div class="flex items-center gap-4  py-2 mb-4">
                    <label for="title" class="font-medium" style="width: 90px;">Status</label>
                    <div>
                        {{ examTemplate.status }}
                    </div>
                </div>

                <div class="flex items-center gap-4 mb-4">
                    <label for="document" class="font-medium mt-2" style="width: 90px;">Student Answers</label>
                    <div class="flex flex-column flex-auto gap-1">

                        <!--  -->
                        <div class="">



                            <div class="answer-fileupload">
                                <FileUpload name="answerDocuments" accept="image/jpg, image/jpeg, image/png"
                                    :maxFileSize="1000000" chooseLabel="Browse" :multiple="true" :auto="false"
                                    @select="onDocumentSelect" customUpload ref="fileUploadRef">
                                    <template #header="{ chooseCallback, clearCallback }">
                                        <div class="flex gap-2" style="width: 100%;">
                                            <Button @click="chooseCallback" label="Choose" icon="pi pi-images"
                                                outlined></Button>


                                            <span v-if="storeClearCallback(clearCallback)" style="display: none"></span>
                                        </div>
                                    </template>

                                </FileUpload>
                            </div>

                            <small v-if="submitted && errors.answerDocuments" class="p-error">{{
                                errors.answerDocuments
                            }}</small>
                        </div>
                        <!--  -->
                    </div>
                </div>

                <div class="field">
                    <small v-if="submitted && errors.general" class="p-error">{{
                        errors.general
                    }}</small>
                </div>


                <Button label="Submit" class="p-3 mt-5" @click="saveExamTemplate"></Button>

            </div>
        </div>
    </div>
</template>

<style>
.answer-fileupload .p-fileupload-file-badge,
.answer-fileupload .p-progressbar-determinate {
    display: none !important;
    /* hides default action buttons */
}
</style>
