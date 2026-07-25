import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRegisterUser } = vi.hoisted(() => ({ mockRegisterUser: vi.fn() }));

vi.mock("@/data/auth", () => ({ registerUser: mockRegisterUser }));

const { registerAction } = await import("./actions");

function formData(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.append(key, value);
  return data;
}

const validInput = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  password: "correct-horse",
};

beforeEach(() => {
  mockRegisterUser.mockReset();
});

describe("registerAction validation", () => {
  it("rejects an invalid email without touching the data layer", async () => {
    const state = await registerAction(
      {},
      formData({ ...validInput, email: "not-an-email" })
    );

    expect(state).toEqual({ error: "Enter a valid email" });
    expect(mockRegisterUser).not.toHaveBeenCalled();
  });

  it("rejects a password shorter than 8 characters", async () => {
    const state = await registerAction(
      {},
      formData({ ...validInput, password: "short7c" })
    );

    expect(state.error).toBe("Password must be at least 8 characters");
    expect(mockRegisterUser).not.toHaveBeenCalled();
  });

  it("rejects an empty name", async () => {
    const state = await registerAction({}, formData({ ...validInput, name: "" }));

    expect(state.error).toBe("Name is required");
    expect(mockRegisterUser).not.toHaveBeenCalled();
  });

  it("rejects a submission with fields missing entirely", async () => {
    const state = await registerAction({}, new FormData());

    expect(state.error).toBeTruthy();
    expect(mockRegisterUser).not.toHaveBeenCalled();
  });
});

describe("registerAction success path", () => {
  it("passes the parsed values through and reports success", async () => {
    mockRegisterUser.mockResolvedValue({ id: "user_1" });

    const state = await registerAction({}, formData(validInput));

    expect(state).toEqual({ success: true });
    expect(mockRegisterUser).toHaveBeenCalledWith(validInput);
  });
});

describe("registerAction error handling", () => {
  it("surfaces a domain error message to the form", async () => {
    mockRegisterUser.mockRejectedValue(
      new Error("An account with this email already exists.")
    );

    const state = await registerAction({}, formData(validInput));

    expect(state).toEqual({ error: "An account with this email already exists." });
  });

  // A non-Error rejection must not leak an internal representation to the client.
  it("falls back to a generic message for a non-Error rejection", async () => {
    mockRegisterUser.mockRejectedValue({ code: "P2002", stack: "internal detail" });

    const state = await registerAction({}, formData(validInput));

    expect(state).toEqual({ error: "Registration failed" });
  });
});
