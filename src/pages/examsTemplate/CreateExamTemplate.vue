<script setup>
import { ref } from "vue";

import { useToast } from "primevue/usetoast";

import examTemplateApi from "@/apis/examTemplates";
import router from "@/router";

const toast = useToast();
const examTemplateId = ref('');
const title = ref('');
const examDocument = ref({});
const examDocumentPaths = ref({});
const errors = ref({});
const submitted = ref(false);
const defaultImage = ref('/images/noimage.png')


const refreshFiles = (chooseCallback, clearCallback) => {
    clearCallback();
    chooseCallback();
};


const removeSelectedImage = (clearCallback) => {
    clearCallback();
    examDocument.value = null;
    examDocumentPaths.value = null;
};

const backToExamTemplate = () => {
    router.push({ name: "examTemplates" })
}


//for select image
const onDocumentSelect = (event) => {
    examDocument.value = event.files[event.files.length - 1];

    const file = event.files[event.files.length - 1];
    if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
            examDocumentPaths.value = {
                thumbnail: e.target.result,
                normal: e.target.result,
            };

            // imageSrc.value = e.target.result;
        };
        reader.readAsDataURL(file);
    } else {

        examDocumentPaths.value = null;
        defaultImage.value = "/images/pdf.png"
    }
};

const saveExamTemplate = () => {
    errors.value = {};
    submitted.value = true;



    if (!title.value) errors.value.title = 'Exam Template Title is required';
    if (!examDocument.value) errors.value.examDocument = 'Document is required';
    if (!errors.value.title && !errors.value.examDocument) {


        let formData = new FormData();
        formData.append("title", title.value);
        formData.append("file", examDocument.value);

        examTemplateApi.addExamTemplate(formData)
            .then((response) => {
                if (response.status === 201) {

                    const result = response.data;
                    toast.add({
                        severity: "success",
                        summary: "Successful",
                        detail: result.data.message,
                        life: 3000,
                    });

                    title.value = "";
                    examDocument.value = null;
                    examDocumentPaths.value = null;

                    router.push({ name: "createRegion", params: { id: result.data._id } });

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


}

</script>

<template>
    <div class="grid">
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

                <h4 class="mb-5">Create Exam Template</h4>

                <div class="flex items-center gap-4 mb-4">
                    <label for="title" class="font-medium mt-2" style="width: 150px;">Exam Template Title</label>
                    <div class="flex flex-column flex-auto gap-1">
                        <InputText v-model.trim="title" :invalid="submitted && ('title' in errors)" placeholder="Title"
                            id="title" class="w-full" autocomplete="off" />
                        <Message v-if="submitted && errors.title" severity="error" size="small" variant="simple">
                            {{ errors.title }}
                        </Message>
                    </div>
                </div>


                <div class="flex items-center gap-4 mb-4">
                    <label for="document" class="font-medium mt-2" style="width: 150px;">Document</label>
                    <div class="flex flex-column flex-auto gap-1">

                        <div class="">

                            <div class="exam-template-fileupload">
                                <FileUpload name="examDocument" accept="image/*,application/pdf" :maxFileSize="1000000"
                                    chooseLabel="Browse" :multiple="false" :auto="false" @select="onDocumentSelect"
                                    customUpload>
                                    <template #header="{ chooseCallback, clearCallback }">
                                        <div class="flex gap-2" style="width: 100%;">
                                            <Button @click="refreshFiles(chooseCallback, clearCallback)" label="Choose"
                                                icon="pi pi-images" outlined></Button>
                                            <Button label="Cancel" icon="pi pi-times"
                                                @click="removeSelectedImage(clearCallback)" outlined severity="danger"
                                                :disabled="!examDocument" />

                                        </div>


                                    </template>
                                    <template #content>&nbsp;</template>
                                </FileUpload>
                            </div>
                            <p v-if="examDocument">
                                {{ examDocument.name }}
                            </p>
                            <div class="my-3" v-if="
                                examDocumentPaths &&
                                examDocumentPaths.thumbnail != null
                            ">
                                <Image alt="Image" preview>
                                    <template #indicatoricon>
                                        <i class="pi pi-search"></i>
                                    </template>
                                    <template #image>
                                        <div style="height: 300px">
                                            <img :src="examDocumentPaths.thumbnail" alt="image" style="
                              width: 100%;
                              border: 1px solid #ccc;
                              padding: 3px;
                              height: 300px;
                            " />
                                        </div>
                                    </template>
                                    <template #preview="slotProps">
                                        <img :src="examDocumentPaths.normal" alt="preview" :style="slotProps.style"
                                            @click="slotProps.onClick" />
                                    </template>
                                </Image>
                            </div>
                            <div class="my-3" v-else>
                                <img :src="defaultImage" alt="image"
                                    style="border: 1px solid #ccc; padding: 3px; height: 300px" />
                            </div>
                            <small v-if="submitted && errors.examDocument" class="p-error">{{
                                errors.examDocument
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


                <Button label="Submit" class="p-3 text-xl mt-5" @click="saveExamTemplate"></Button>

            </div>
        </div>
    </div>
</template>


<style scoped>
.p-fileupload-advanced {
    border: 0 none;
}
</style>

<style>
.exam-template-fileupload .p-fileupload-header {
    padding: 0 !important;
}

.exam-template-fileupload .p-fileupload-content {
    display: none;
}
</style>
