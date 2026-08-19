import axios from "axios";
import type {
  Employee,
  EvaluationCreate,
  EvaluationSummary,
  Question,
  SubordinateEvaluation,
} from "../types";

const api = axios.create({
  baseURL: "/api",
});

// Store interceptor ID for cleanup
let interceptorId: number | null = null;

// Add authentication interceptor (cookies are handled automatically by browser)
const addAuthInterceptor = () => {
  if (interceptorId !== null) return; // Already added
  
  interceptorId = api.interceptors.request.use((config) => {
    // Browser automatically handles cookies, no need to manually set headers
    return config;
  });
};

// Remove authentication interceptor
const removeAuthInterceptor = () => {
  if (interceptorId !== null) {
    api.interceptors.request.eject(interceptorId);
    interceptorId = null;
  }
};

// Initialize interceptor when module loads
addAuthInterceptor();

export async function getEmployees(signal?: AbortSignal): Promise<Employee[]> {
  const { data } = await api.get<Employee[]>("/employees/", { signal });
  return data;
}

export async function getEmployee(id: number, signal?: AbortSignal): Promise<Employee> {
  const { data } = await api.get<Employee>(`/employees/${id}/`, { signal });
  return data;
}

export async function getSubordinates(id: number, signal?: AbortSignal): Promise<Employee[]> {
  const { data } = await api.get<Employee[]>(`/employees/${id}/subordinates/`, { signal });
  return data;
}

export async function getQuestions(signal?: AbortSignal): Promise<Question[]> {
  const { data } = await api.get<Question[]>("/evaluations/questions/", { signal });
  return data;
}

export async function submitEvaluation(
  data: EvaluationCreate,
  signal?: AbortSignal,
): Promise<EvaluationSummary> {
  const { data: result } = await api.post<EvaluationSummary>(
    "/evaluations/",
    data,
    { signal }
  );
  return result;
}

export async function getSubordinateEvaluations(signal?: AbortSignal): Promise<
  SubordinateEvaluation[]
> {
  const { data } = await api.get<SubordinateEvaluation[]>(
    "/evaluations/subordinates/",
    { signal }
  );
  return data;
}

export async function getEvaluationHistory(
  employeeId: number,
  signal?: AbortSignal,
): Promise<EvaluationSummary[]> {
  const { data } = await api.get<EvaluationSummary[]>(
    `/evaluations/employee/${employeeId}/`,
    { signal }
  );
  return data;
}

// Cleanup function to remove interceptor
export const cleanupApiInterceptor = () => {
  removeAuthInterceptor();
};
