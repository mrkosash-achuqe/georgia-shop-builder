import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

vi.mock("@/context/SiteSettingsContext", () => ({ useFeature: () => false }));
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ lang: "en", t: { checkout: { firstName: "First name", lastName: "Last name", phone: "Phone", email: "Email", city: "City", address: "Address", required: "Required" }, products: { currency: "GEL" } } }) }));
vi.mock("@/context/CartContext", () => ({ useCart: () => ({ items: [{ product: { id: "test", nameEn: "Test", price: 30, img: "" }, quantity: 1 }], totalPrice: 30, clearCart: vi.fn() }) }));
vi.mock("@/context/AuthContext", () => ({ useAuth: () => ({ user: null }) }));
vi.mock("@/hooks/useLoyalty", () => ({ useLoyalty: () => ({ balance: 0, refresh: vi.fn() }), POINTS_PER_GEL: 10 }));
vi.mock("@/hooks/useAbandonedCart", () => ({ markCartRecovered: vi.fn() }));
vi.mock("@/lib/analytics", () => ({ trackBeginCheckout: vi.fn(), trackPurchase: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: () => ({ select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [] }) }) }) }) } }));
vi.mock("@/components/Header", () => ({ default: () => null }));
vi.mock("@/components/Footer", () => ({ default: () => null }));
vi.mock("@/components/CartDrawer", () => ({ default: () => null }));
vi.mock("@/components/SEO", () => ({ default: () => null }));

import Checkout from "./Checkout";

afterEach(cleanup);

describe("checkout typing regression", () => {
  it.each(["First name", "Last name", "Phone", "Email", "City", "Address"])("keeps %s focused and preserves the same input while typing", async (label) => {
    render(<MemoryRouter><Checkout /></MemoryRouter>);
    const field = screen.getByLabelText(label);
    await waitFor(() => expect(field).toBeInTheDocument());
    field.focus();
    for (const value of ["G", "Gi", "Gio", "Giorgi"]) {
      fireEvent.change(field, { target: { value } });
      expect(screen.getByLabelText(label)).toBe(field);
      expect(document.activeElement).toBe(field);
      expect(field).toHaveValue(value);
    }
  });
});