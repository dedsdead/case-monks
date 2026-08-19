import { describe, it, expect, vi, beforeEach } from "vitest";
import * as api from "./api";
import axios from "axios";

vi.mock("axios", () => {
  const instance = {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };
  return {
    default: {
      create: vi.fn(() => instance),
    },
    __instance: instance,
  };
});

const mockedAxios = vi.mocked(axios, true);
const instance = (mockedAxios.create as ReturnType<typeof vi.fn>)();

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("API service", () => {
  it("getEmployees calls GET /employees", async () => {
    const mockData = [
      { id: 1, name: "Alice", email: "a@co.com", position_name: "CEO" },
    ];
    (instance.get as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: mockData,
    });

    const result = await api.getEmployees();

    expect(instance.get).toHaveBeenCalledWith("/employees");
    expect(result).toEqual(mockData);
  });

  it("getEmployee calls GET /employees/:id", async () => {
    const mockEmp = {
      id: 1,
      name: "Alice",
      email: "a@co.com",
      position_name: "CEO",
    };
    (instance.get as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: mockEmp,
    });

    const result = await api.getEmployee(1);

    expect(instance.get).toHaveBeenCalledWith("/employees/1");
    expect(result).toEqual(mockEmp);
  });

  it("getSubordinates calls GET /employees/:id/subordinates", async () => {
    (instance.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] });

    await api.getSubordinates(1);

    expect(instance.get).toHaveBeenCalledWith("/employees/1/subordinates");
  });

  it("getQuestions calls GET /evaluations/questions", async () => {
    (instance.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] });

    await api.getQuestions();

    expect(instance.get).toHaveBeenCalledWith("/evaluations/questions");
  });

  it("submitEvaluation calls POST /evaluations", async () => {
    const payload = {
      employee_id: 1,
      scores: [
        { question_id: 1, score: 4 },
        { question_id: 2, score: 3 },
        { question_id: 3, score: 4 },
        { question_id: 4, score: 2 },
        { question_id: 5, score: 3 },
        { question_id: 6, score: 4 },
      ],
    };
    const mockSummary = {
      id: 1,
      employee_id: 1,
      evaluator_id: 5,
      total_score: 3.4,
      evaluation_date: "2026-08-17T20:00:00Z",
      evaluation_year: 2026,
      week_number: 33,
      questions: [],
    };
    (instance.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: mockSummary,
    });

    const result = await api.submitEvaluation(payload);

    expect(instance.post).toHaveBeenCalledWith("/evaluations", payload);
    expect(result).toEqual(mockSummary);
  });

  it("getSubordinateEvaluations calls GET /evaluations/subordinates", async () => {
    (instance.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] });

    await api.getSubordinateEvaluations();

    expect(instance.get).toHaveBeenCalledWith("/evaluations/subordinates");
  });

  it("getEvaluationHistory calls GET /evaluations/employee/:id", async () => {
    (instance.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] });

    await api.getEvaluationHistory(5);

    expect(instance.get).toHaveBeenCalledWith("/evaluations/employee/5");
  });

  it("interceptor sets Cookie header from localStorage", () => {
    localStorage.setItem("employee_id", "42");

    const interceptorFn = (
      instance.interceptors.request.use as ReturnType<typeof vi.fn>
    ).mock.calls[0]?.[0];

    if (interceptorFn) {
      const config = { headers: {} } as Parameters<typeof interceptorFn>[0];
      const result = interceptorFn(config);
      expect(result.headers.Cookie).toBe("employee_id=42");
    }
  });

  it("interceptor does not set Cookie when localStorage is empty", () => {
    const interceptorFn = (
      instance.interceptors.request.use as ReturnType<typeof vi.fn>
    ).mock.calls[0]?.[0];

    if (interceptorFn) {
      const config = { headers: {} } as Parameters<typeof interceptorFn>[0];
      const result = interceptorFn(config);
      expect(result.headers.Cookie).toBeUndefined();
    }
  });
});
