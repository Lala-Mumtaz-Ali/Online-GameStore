import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockResetPassword } = vi.hoisted(() => ({ mockResetPassword: vi.fn() }));

vi.mock("@/data/auth", () => ({ resetPassword: mockResetPassword }));

const { resetPasswordAction } = await import("./actions");

const TOKEN = "a".repeat(64);

function formData(password: string, confirmPassword = password) {
  const data = new FormData();
  data.append("password", password);
  data.append("confirmPassword", confirmPassword);
  return data;
}

beforeEach(() => {
  mockResetPassword.mockReset();
});

describe("resetPasswordAction", () => {
  it("rejects an empty token before doing any work", async () => {
    const state = await resetPasswordAction("", {}, formData("long-enough-password"));

    expect(state).toEqual({ error: "This reset link is invalid or has expired." });
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it("rejects a password shorter than 8 characters", async () => {
    const state = await resetPasswordAction(TOKEN, {}, formData("short7c"));

    expect(state.error).toBe("Password must be at least 8 characters");
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it("rejects mismatched confirmation", async () => {
    const state = await resetPasswordAction(
      TOKEN,
      {},
      formData("long-enough-password", "something-else")
    );

    expect(state.error).toBe("Passwords do not match");
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it("passes the bound token and parsed password to the data layer", async () => {
    mockResetPassword.mockResolvedValue({ success: true });

    const state = await resetPasswordAction(TOKEN, {}, formData("long-enough-password"));

    expect(state).toEqual({ success: true });
    expect(mockResetPassword).toHaveBeenCalledWith({
      token: TOKEN,
      password: "long-enough-password",
    });
  });

  it("surfaces the data layer's generic failure message", async () => {
    mockResetPassword.mockResolvedValue({
      success: false,
      error: "This reset link is invalid or has expired.",
    });

    const state = await resetPasswordAction(TOKEN, {}, formData("long-enough-password"));

    expect(state).toEqual({ error: "This reset link is invalid or has expired." });
  });

  // Signing the user in here would mean trusting a token that was just consumed.
  it("never reports success without the data layer confirming it", async () => {
    mockResetPassword.mockResolvedValue({ success: false, error: "nope" });

    const state = await resetPasswordAction(TOKEN, {}, formData("long-enough-password"));

    expect(state.success).toBeUndefined();
  });
});
