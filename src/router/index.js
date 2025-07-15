import { createRouter, createWebHistory } from "vue-router";
import Home from "@/pages/Home.vue";
import Login from "@/pages/auth/Login.vue";
import NotFound from "@/pages/NotFound.vue";
import AppLayout from "@/components/layouts/AppLayout.vue";
import Users from "@/pages/Users.vue";
import CreateRegion from "@/pages/examsTemplate/CreateRegion.vue";
import ListExamTemplate from "@/pages/examsTemplate/ListExamTemplate.vue";
import CreateExamTemplate from "@/pages/examsTemplate/CreateExamTemplate.vue";
import UploadStudentAnswers from "@/pages/examsTemplate/UploadStudentAnswers.vue";
import StudentAnswers from "@/pages/examsTemplate/StudentAnswers.vue";
import ViewOcrResult from "@/pages/examsTemplate/ViewOcrResult.vue";

const routes = [
  {
    path: "/login",
    name: "login",
    component: Login,
  },
  { path: "/:pathMatch(.*)*", name: "notfound", component: NotFound },
  {
    path: "/",
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      { path: "", name: "home", component: Home },
      { path: "users", name: "users", component: Users },
      {
        path: "/exam-templates",
        name: "examTemplates",
        component: ListExamTemplate,
      },
      {
        path: "/exam-templates/new",
        name: "createExamTemplate",
        component: CreateExamTemplate,
      },
      {
        path: "/exam-templates/:id/create-region",
        name: "createRegion",
        component: CreateRegion,
      },
      {
        path: "/exam-templates/:id/upload-answers",
        name: "uploadStudentAnswers",
        component: UploadStudentAnswers,
      },
      {
        path: "/exam-templates/:id/student-answers",
        name: "studentAnswers",
        component: StudentAnswers,
      },
      {
        path: "/exam-templates/:id/student-answers/:answerId",
        name: "viewOcrResult",
        component: ViewOcrResult,
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
