<script setup>
import { ref, reactive, onMounted, defineProps, defineEmits } from 'vue'
import { useRouter } from 'vue-router'
import * as pdfjsLib from 'pdfjs-dist'

// IMPORTANT: Set the worker source!
// Option 1: Using a CDN (recommended for simplicity, especially for basic use cases)
// pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// Option 2: If you've copied the worker file to your public/assets folder
// Assuming it's accessible at /pdf.worker.min.mjs
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

// Option 3: If your bundler handles importing workers as modules (e.g., modern Webpack/Vite)
// This might require specific bundler configurations.
// import PdfWorker from 'pdfjs-dist/build/pdf.worker.mjs'; // Or .min.mjs
// pdfjsLib.GlobalWorkerOptions.workerSrc = PdfWorker; // Some bundlers might return a URL for this import

const props = defineProps({
    documentPath: String,
    regionsFromServer: Object
})

const emit = defineEmits(['saveRegion'])


function sendToParent() {
    emit('saveRegion', regions)
}
const router = useRouter();

// const pdfUrl = '/uploads/template.pdf'
const scale = ref(1)
const pages = ref([])
const canvasRefs = []
const regions = ref(props.regionsFromServer) // page-indexed regions

const selectedRegion = ref(null)
const drawing = ref(false)
const dragging = ref(false)
const currentPageIndex = ref(null)
const startPoint = reactive({ x: 0, y: 0 })


const updateRegionDialog = ref(false)
const submitted = ref(false)
const errors = ref({})

const currentDocumentPath = ref(props.documentPath);

const renderPdf = async () => {
    const pdf = await pdfjsLib.getDocument(currentDocumentPath.value).promise
    const numPages = pdf.numPages
    pages.value = Array.from({ length: numPages })

    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale: scale.value })
        const canvas = canvasRefs[i - 1]
        const context = canvas.getContext('2d')
        canvas.width = viewport.width
        canvas.height = viewport.height

        await page.render({ canvasContext: context, viewport }).promise
    }
}

const zoomIn = () => {
    scale.value += 0.2
    renderPdf()
    //   regions.value = { ...regions.value }
}

const zoomReset = () => {
    scale.value = 1.0
    renderPdf()
    //  regions.value = { ...regions.value }
}

const zoomOut = () => {
    if (scale.value > 0.4) {
        scale.value -= 0.2
        renderPdf()
        //  regions.value = { ...regions.value }
    }
}

const onMouseDown = (event, pageIndex) => {
    const canvas = canvasRefs[pageIndex]
    const rect = canvas.getBoundingClientRect()
    const x = (event.clientX - rect.left) / scale.value
    const y = (event.clientY - rect.top) / scale.value


    startPoint.x = x
    startPoint.y = y
    currentPageIndex.value = pageIndex
    selectedRegion.value = null
    drawing.value = true

    // Create only one _temp region here
    if (!regions.value[pageIndex]) regions.value[pageIndex] = []

    const tempRegion = {
        x,
        y,
        width: 0,
        height: 0,
        _temp: true,
        pageIndex,
        label: `R${(regions.value[pageIndex].filter(r => !r._temp).length || 0) + 1}`
    }

    // Remove any existing temp and add new one
    regions.value[pageIndex] = regions.value[pageIndex].filter(r => !r._temp)
    regions.value[pageIndex].push(tempRegion)
}

const onMouseMove = (event) => {
    if (!drawing.value || currentPageIndex.value === null) return

    const canvas = canvasRefs[currentPageIndex.value]
    const rect = canvas.getBoundingClientRect()
    const x = (event.clientX - rect.left) / scale.value
    const y = (event.clientY - rect.top) / scale.value

    const tempRegion = regions.value[currentPageIndex.value].find(r => r._temp)
    if (!tempRegion) return

    tempRegion.width = x - startPoint.x
    tempRegion.height = y - startPoint.y
}



const onMouseUp = () => {
    if (!drawing.value || currentPageIndex.value === null) return
    drawing.value = false

    const pageIdx = currentPageIndex.value
    const tempRegion = regions.value[pageIdx]?.find(r => r._temp)
    if (!tempRegion) return
    if (tempRegion.width < 0) {
        tempRegion.x += Math.abs(tempRegion.width)
        tempRegion.width = Math.abs(tempRegion.width)
    }
    if (tempRegion.height < 0) {
        tempRegion.y += Math.abs(tempRegion.height)
        tempRegion.height = Math.abs(tempRegion.height)
    }


    // Discard tiny regions
    if (Math.abs(tempRegion.width) > 5 && Math.abs(tempRegion.height) > 5) {
        delete tempRegion._temp
    } else {
        regions.value[pageIdx] = regions.value[pageIdx].filter(r => !r._temp)
    }



    currentPageIndex.value = null
}


const onRegionMouseDown = (event, region) => {
    dragging.value = true
    selectedRegion.value = region
    startPoint.x = event.offsetX
    startPoint.y = event.offsetY
    event.stopPropagation()
}

const onRegionMouseMove = (event) => {
    if (!dragging.value || !selectedRegion.value) return

    const dx = event.movementX / scale.value
    const dy = event.movementY / scale.value
    selectedRegion.value.x += dx
    selectedRegion.value.y += dy
}

const onRegionMouseUp = () => {
    dragging.value = false
}


const deleteSelectedRegion = () => {
    if (!selectedRegion.value) return

    const pageIndex = selectedRegion.value.pageIndex
    const index = regions.value[pageIndex].indexOf(selectedRegion.value)
    if (index !== -1) {
        regions.value[pageIndex].splice(index, 1)
        selectedRegion.value = null
    }
}

const deleteAllRegion = () => {
    selectedRegion.value = null
    regions.value = {}
}

const updateSelectedRegion = () => {

    submitted.value = true

    if (!selectedRegion.value) return

    selectedRegion.value.label = selectedRegion.value.label

    if (!selectedRegion.value.label) {
        errors.value.label = 'Label is required';
        return
    }

    regions.value = { ...regions.value }

    updateRegionDialog.value = false;
}

const getRegionStyle = (region) => {

    const scaledX = region.x * scale.value
    const scaledY = region.y * scale.value
    const scaledWidth = region.width * scale.value
    const scaledHeight = region.height * scale.value

    return {

        position: 'absolute',
        left: `${scaledX}px`,
        top: `${scaledY}px`,
        width: `${scaledWidth}px`,
        height: `${scaledHeight}px`,
        border: region === selectedRegion.value ? '2px solid blue' : '2px solid red',
        backgroundColor: 'rgba(255, 0, 0, 0.2)',
        cursor: 'move'

    }
}

const openFormDialog = () => {
    submitted.value = false;
    updateRegionDialog.value = true;
};

const hideDialog = () => {
    selectedRegion.value = null;
    submitted.value = false;
    updateRegionDialog.value = false;
};

const backToExamTemplate = () => {
    router.push({ name: "examTemplates" })
}

onMounted(() => {
    renderPdf()
    window.addEventListener('mouseup', () => {
        onMouseUp()          // for drawing
        onRegionMouseUp() // release dragged region
    })
    window.addEventListener('mousemove', onRegionMouseMove)
})
</script>



<template>

    <div class="flex flex-column h-screen">

        <Toolbar class="sticky top-0 z-5 p-3 surface-0 border-bottom-1 surface-border pb-2">
            <template v-slot:start>
                <div class="my-2">
                    <Button type="button" label="Back" icon="pi pi-arrow-left" @click="backToExamTemplate"
                        class="mr-2" />

                    <Button label="Update Selected" icon="pi pi-pencil" @click="openFormDialog"
                        :disabled="!selectedRegion" class="mr-2" size="" />

                    <Button label="Delete Selected" icon="pi pi-trash" @click="deleteSelectedRegion"
                        class=" p-button-danger mr-2" size="" />
                    <Button label="Delete All" icon="pi pi-trash" @click="deleteAllRegion" class="p-button-danger mr-2"
                        :disabled="regions.length < 1" size="" />

                    <Button label="Save" icon="pi pi-save" @click="sendToParent" class="p-button-success" />
                </div>
            </template>

            <template v-slot:end>

                <Button icon="pi pi-search-plus" @click="zoomIn" class="mr-2" rounded v-tooltip.bottom="'Zoom In'" />

                <Button icon="pi pi-search-minus" @click="zoomOut" class="mr-2" rounded v-tooltip.bottom="'Zoom Out'" />

                <Button icon="pi pi-refresh" @click="zoomReset" class="mr-2" rounded v-tooltip.bottom="'Zoom Reset'" />
            </template>
        </Toolbar>

        <div class="flex-grow-1 overflow-y-auto p-4" style="max-width: 100%; white-space: nowrap;">
            <h4 class="">Create Answer Region</h4>


            <p class="text-xs mb-5">
                1. Click and drag your mouse to draw a rectangle around the area to assign an answer
                region. <br />
                2. After drawing, click inside the rectangle to select update the info or adjust its position by
                dragging.<br />
                3. Click "Save" button, after all region are assign.

            </p>
            <div v-for="(page, index) in pages" :key="index" class=" relative mb-6 bg-white p-0 rounded-md shadow">
                <canvas :ref="el => canvasRefs[index] = el" @mousedown="event => onMouseDown(event, index)"
                    @mousemove="onMouseMove" style="border: 1px solid #ccc;"></canvas>

                <div v-for="(region, rIdx) in regions[index] || []" :key="rIdx" :style="getRegionStyle(region)"
                    class="absolute" @mousedown="event => onRegionMouseDown(event, region)" @mouseup="onRegionMouseUp">
                    <small class="text-xs text-red-700">{{ region.label }}</small>
                </div>
            </div>
        </div>



        <Dialog v-model:visible="updateRegionDialog" :style="{ width: '50rem' }"
            :breakpoints="{ '1199px': '75vw', '575px': '90vw' }" header="Update Info" :modal="true" class="">

            <div class="flex items-center gap-4 mb-4">
                <label for="label" class="font-medium" style="width: 75px;">Page No</label>
                <div class="font-medium">
                    {{ selectedRegion.pageIndex + 1 }}
                </div>
            </div>
            <div class="flex items-center gap-4 mb-4">
                <label for="label" class="font-medium" style="width: 75px;">Coordinate</label>
                <div class="font-medium">
                    [{{ selectedRegion.x }}, {{ selectedRegion.y }}, {{ selectedRegion.width }}, {{
                        selectedRegion.height }}]
                </div>
            </div>



            <div class="flex items-center gap-4 mb-4">
                <label for="label" class="font-medium mt-2" style="width: 75px;">Label</label>
                <div class="flex flex-column flex-auto gap-1">
                    <InputText v-model.trim="selectedRegion.label" :invalid="submitted && ('label' in errors)"
                        placeholder="label" id="label" class="w-full" autocomplete="off" />
                    <Message v-if="submitted && errors.label" severity="error" size="small" variant="simple">
                        {{ errors.label }}
                    </Message>
                </div>
            </div>

            <div class="flex items-center gap-4 mb-4">
                <label for="role" class="font-medium " style="width: 75px;">Type</label>
                <div class="flex flex-column flex-auto gap-1">
                    <div class="flex flex-wrap gap-4">
                        <div class="flex items-center gap-2">
                            <RadioButton v-model="selectedRegion.type" inputId="multiple_choice" name="regionType"
                                value="multiple_choice" />
                            <label for="multiple_choice">multiple choice</label>
                        </div>
                        <div class="flex items-center gap-2">
                            <RadioButton v-model="selectedRegion.type" inputId="short_answer" name="regionType"
                                value="short_answer" />
                            <label for="short_answer">short answer</label>
                        </div>
                        <div class="flex items-center gap-2">
                            <RadioButton v-model="selectedRegion.type" inputId="long_answer" name="regionType"
                                value="long_answer" />
                            <label for="long_answer">long answer</label>
                        </div>
                        <div class="flex items-center gap-2">
                            <RadioButton v-model="selectedRegion.type" inputId="qr_code" name="regionType"
                                value="qr code" />
                            <label for="qr_code">qr code</label>
                        </div>
                    </div>

                    <Message v-if="submitted && errors.type" severity="error" size="small" variant="simple">
                        {{ errors.type }}
                    </Message>
                </div>
            </div>


            <div class="flex items-center gap-4 mb-4">
                <label for="options" class="font-medium mt-2" style="width: 75px;">Options</label>
                <div class="flex flex-column flex-auto gap-1">
                    <InputText v-model.trim="selectedRegion.options" :invalid="submitted && ('options' in errors)"
                        placeholder="options" id="options" class="w-full" autocomplete="off" />
                    <Message v-if="submitted && errors.options" severity="error" size="small" variant="simple">
                        {{ errors.options }}
                    </Message>
                </div>
            </div>

            <div class="flex items-center gap-4 mb-4">
                <label for="correctAnswer" class="font-medium mt-2" style="width: 75px;">Correct Answer</label>
                <div class="flex flex-column flex-auto gap-1">
                    <InputText v-model.trim="selectedRegion.correctAnswer"
                        :invalid="submitted && ('correctAnswer' in errors)" placeholder="correctAnswer"
                        id="correctAnswer" class="w-full" autocomplete="off" />
                    <Message v-if="submitted && errors.correctAnswer" severity="error" size="small" variant="simple">
                        {{ errors.correctAnswer }}
                    </Message>
                </div>
            </div>

            <div class="flex items-center gap-4 mb-4">
                <label for="rubricAnswer" class="font-medium mt-2" style="width: 75px;">Rubric Answer</label>
                <div class="flex flex-column flex-auto gap-1">
                    <InputText v-model.trim="selectedRegion.rubricAnswer"
                        :invalid="submitted && ('rubricAnswer' in errors)" placeholder="correctAnswer" id="rubricAnswer"
                        class="w-full" autocomplete="off" />
                    <Message v-if="submitted && errors.rubricAnswer" severity="error" size="small" variant="simple">
                        {{ errors.rubricAnswer }}
                    </Message>
                </div>
            </div>


            <div class="flex items-center gap-4 mb-4">
                <label for="points" class="font-medium mt-2" style="width: 75px;">Points</label>
                <div class="flex flex-column flex-auto gap-1">
                    <InputNumber v-model.trim="selectedRegion.points" :invalid="submitted && ('points' in errors)"
                        placeholder="points" id="points" class="w-full" autocomplete="off" />
                    <Message v-if="submitted && errors.points" severity="error" size="small" variant="simple">
                        {{ errors.points }}
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
                <Button label="Save" icon="pi pi-check" @click="updateSelectedRegion" />
            </template>
        </Dialog>

    </div>
</template>
