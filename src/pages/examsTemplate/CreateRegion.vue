<template>

    <div v-if="isLoading">
        <LoadingLayout></LoadingLayout>
    </div>
    <div v-else class="grid">
        <div class="col-12">
            <div class="card main-card">

                <ImageRegionMarker v-if="docFileExtension === 'image'" :documentPath="examTemplate.documentUrl"
                    :regionsFromServer="examTemplate.regions ?? []" @saveRegion="handleRegionUpdate" />

                <PdfRegionMarker v-if="docFileExtension === 'pdf'" :documentPath="examTemplate.documentUrl"
                    :regionsFromServer="examTemplate.regions ?? []" @saveRegion="handleRegionUpdate" />
            </div>
        </div>
    </div>

</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import PdfRegionMarker from '@/components/PdfRegionMarker.vue'
import ImageRegionMarker from '@/components/ImageRegionMarker.vue';
import examTemplatesApi from '@/apis/examTemplates';
import LoadingLayout from '@/components/LoadingLayout.vue';
import { useToast } from "primevue/usetoast";

const toast = useToast();
const route = useRoute();
const router = useRouter();
const isLoading = ref(false);
const examTemplate = ref({});
const docFileExtension = ref(null);
const errors = ref({});

onMounted(() => {
    isLoading.value = true;
    if (!route.params.id) router.push({ name: "examTemplates" });

    examTemplatesApi.getOneExamTemplate(route.params.id)
        .then((response) => {
            if (response.status === 200) {
                examTemplate.value = response.data.data;
                const fileExtension = getFileExtensionFromUrl(examTemplate.value.documentUrl);

                if (fileExtension && fileExtension !== '') {
                    docFileExtension.value = getFileType(fileExtension)
                }
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

function getFileExtensionFromUrl(urlString) {
    try {
        const url = new URL(urlString);
        const pathname = url.pathname;
        const lastDotIndex = pathname.lastIndexOf('.');
        if (lastDotIndex > 0) {
            return pathname.substring(lastDotIndex + 1);
        }
    } catch (e) {
        console.error('Invalid URL:', e.message);
    }
    return '';
}

function getFileType(extension) {
    const lowerCaseExt = extension.toLowerCase();

    const imageExtensions = [
        'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tif', 'tiff'
    ];

    const pdfExtensions = [
        'pdf'
    ];

    if (imageExtensions.includes(lowerCaseExt)) {
        return 'image';
    } else if (pdfExtensions.includes(lowerCaseExt)) {
        return 'pdf';
    } else {
        return 'other';
    }
}


const handleRegionUpdate = (regions) => {

    examTemplatesApi.updateExamRegion(route.params.id, { regions: regions.value })
        .then((response) => {
            if (response.status === 200) {

                const result = response.data;
                toast.add({
                    severity: "success",
                    summary: "Region Update Success",
                    detail: result.data.message,
                    life: 3000,
                });

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



</script>
