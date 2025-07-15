import Api from "./api";

export default {
  findAllStudentAnswers(id) {
    return Api.get("exam-templates/" + id + "/student-answers");
  },

  uploadStudentAnswers(id, payload) {
    return Api.post("exam-templates/" + id + "/student-answers", payload);
  },

  ocrRequest(id, payload) {
    return Api.post("exam-templates/" + id + "/student-answers/ocr", payload);
  },

  getStudentAnswerOcrResult(exam_template_id, answer_id) {
    return Api.get(
      "exam-templates/" + exam_template_id + "/student-answers/" + answer_id
    );
  },
};
