import Api from "./api";

export default {
  addExamTemplate(payload) {
    return Api.post("exam-templates", payload);
  },

  getExamTemplates() {
    return Api.get("exam-templates");
  },

  getOneExamTemplate(payload) {
    return Api.get("exam-templates/" + payload);
  },

  updateExamRegion(id, payload) {
    return Api.put("exam-templates/" + id + "/regions", payload);
  },

  updateExamInfo(id, payload) {
    return Api.put("exam-templates/" + id + "/info", payload);
  },

  uploadStudentAnswers(id, payload) {
    return Api.post("exam-templates/" + id + "/student-answers", payload);
  },
};
