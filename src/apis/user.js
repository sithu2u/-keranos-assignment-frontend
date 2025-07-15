import Api from "./api";

export default {
  addUser(payload) {
    return Api.post("users", payload);
  },

  getUsers() {
    return Api.get("users");
  },

  getUser(payload) {
    return Api.get("users/" + payload);
  },

  updateUser(params, payload) {
    return Api.put("users/" + params, payload);
  },

  softDeleteUsers(payload) {
    return Api.put("users/delete-many", payload);
  },

  restoreUsers(payload) {
    return Api.put("users/restore", payload);
  },

  deleteUsers(payload) {
    return Api.delete("users/delete", { data: payload });
  },
};
