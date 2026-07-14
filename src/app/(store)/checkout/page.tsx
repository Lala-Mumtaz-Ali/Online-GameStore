import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCart } from "@/data/cart";
import { Button } from "@/components/ui/button";
import { checkoutAction } from "./actions";

export default async function CheckoutPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/checkout");
  }

  const items = await getCart();
  if (items.length === 0) {
    redirect("/cart");
  }

  const total = items.reduce(
    (sum, item) => sum + item.game.price * item.quantity,
    0
  );

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-3xl font-bold">Checkout</h1>

      <div className="mb-6 rounded-xl border p-4">
        <h2 className="mb-3 font-semibold">Order Summary</h2>
        <div className="flex flex-col gap-2 text-sm">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between">
              <span>
                {item.game.title} × {item.quantity}
              </span>
              <span>${(item.game.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-between border-t pt-3 font-semibold">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      <form action={checkoutAction} className="rounded-xl border p-4">
        <h2 className="mb-1 font-semibold">Payment</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          This is a simulated payment for testing purposes — no real charge
          will be made and no card details are stored.
        </p>

        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Card number
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="4242 4242 4242 4242"
              defaultValue="4242 4242 4242 4242"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium">
                Expiry
              </label>
              <input
                type="text"
                placeholder="MM/YY"
                defaultValue="12/29"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium">CVC</label>
              <input
                type="text"
                placeholder="123"
                defaultValue="123"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        <Button type="submit" className="mt-4 w-full">
          Pay ${total.toFixed(2)} (Fake Payment)
        </Button>
      </form>
    </div>
  );
}
