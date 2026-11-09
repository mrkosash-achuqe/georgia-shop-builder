import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

const mocks = vi.hoisted(() => ({ deleteOrder: vi.fn(), isAdmin: true }));
const order = { id: "test-order", order_number: "TEST-1", first_name: "Test", last_name: "Buyer", phone: "000", email: "test@example.invalid", city: "Test", address: "Test", note: "", subtotal: 30, shipping_fee: 0, total: 30, payment_method: "cash", status: "paid", created_at: "2026-11-08T00:00:00Z" };
vi.mock("@/context/AuthContext", () => ({ useAuth: () => ({ user: { id: "test-user" }, loading: false }) }));
vi.mock("@/components/Header", () => ({ default: () => null }));
vi.mock("@/components/Footer", () => ({ default: () => null }));
vi.mock("@/components/AdminNav", () => ({ default: () => null }));
vi.mock("@/lib/invoice", () => ({ printInvoice: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: (table: string) => ({
  select: () => ({
    order: () => Promise.resolve({ data: [order] }),
    eq: () => table === "user_roles" ? { eq: () => ({ maybeSingle: () => Promise.resolve({ data: mocks.isAdmin ? { role: "admin" } : null }) }) } : Promise.resolve({ data: [] }),
  }),
  delete: mocks.deleteOrder,
}) } }));

import AdminOrders from "./AdminOrders";
afterEach(() => { cleanup(); mocks.deleteOrder.mockReset(); mocks.isAdmin = true; });

describe("order deletion", () => {
  it("requires confirmation before deleting the selected purchased order", async () => {
    mocks.deleteOrder.mockReturnValue({ eq: (key: string, id: string) => {
      expect(key).toBe("id"); expect(id).toBe("test-order");
      return { select: () => ({ single: () => Promise.resolve({ data: { id }, error: null }) }) };
    } });
    render(<MemoryRouter><AdminOrders /></MemoryRouter>);
    fireEvent.click(await screen.findByRole("button", { name: /^#TEST-1/ }));
    fireEvent.click(screen.getByRole("button", { name: "შეკვეთის წაშლა" }));
    expect(mocks.deleteOrder).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "დატოვება" }));
    expect(mocks.deleteOrder).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "შეკვეთის წაშლა" }));
    fireEvent.click(screen.getByRole("button", { name: "სამუდამოდ წაშლა" }));
    await waitFor(() => expect(mocks.deleteOrder).toHaveBeenCalledTimes(1));
    await screen.findByText("შეკვეთები არ მოიძებნა");
  });

  it("does not expose order deletion to a non-admin", async () => {
    mocks.isAdmin = false;
    render(<MemoryRouter><AdminOrders /></MemoryRouter>);
    await screen.findByText("წვდომა შეზღუდულია");
    expect(screen.queryByRole("button", { name: "შეკვეთის წაშლა" })).toBeNull();
    expect(mocks.deleteOrder).not.toHaveBeenCalled();
  });
});