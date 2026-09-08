import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Normalize errors into a readable message the UI can show directly.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.detail ||
      err.message ||
      "Something went wrong. Please try again.";
    return Promise.reject(new Error(message));
  }
);

// ---- Projects ----
export const listProjects = () => api.get("/api/projects").then((r) => r.data);
export const getProject = (id) => api.get(`/api/projects/${id}`).then((r) => r.data);
export const createProject = (payload) =>
  api.post("/api/projects", payload).then((r) => r.data);
export const deleteProject = (id) => api.delete(`/api/projects/${id}`);

// ---- Communications ----
export const listCommunications = (projectId) =>
  api.get(`/api/projects/${projectId}/communications`).then((r) => r.data);
export const createCommunication = (projectId, text) =>
  api
    .post(`/api/projects/${projectId}/communications`, { text })
    .then((r) => r.data);
export const analyzeCommunication = (communicationId) =>
  api.post(`/api/communications/${communicationId}/analyze`).then((r) => r.data);

// ---- Tasks ----
export const listTasks = (projectId, status) =>
  api
    .get(`/api/projects/${projectId}/tasks`, { params: status ? { status } : {} })
    .then((r) => r.data);
export const updateTask = (taskId, updates) =>
  api.patch(`/api/tasks/${taskId}`, updates).then((r) => r.data);
export const deleteTask = (taskId) => api.delete(`/api/tasks/${taskId}`);

// ---- Decisions ----
export const listDecisions = (projectId, status) =>
  api
    .get(`/api/projects/${projectId}/decisions`, {
      params: status ? { status } : {},
    })
    .then((r) => r.data);

// ---- Search ----
export const searchProject = (projectId, q) =>
  api
    .get(`/api/projects/${projectId}/search`, { params: { q } })
    .then((r) => r.data);
