import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCart } from "@/data/cart";
import { Button } from "@/components/ui/button";
import { updateCartItemQuantityAction, removeCartItemAction } from "./actions";

export default async function CartPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/cart");
  }

  const items = await getCart();
  const total = items.reduce((sum, item) => sum + item.game.price * item.quantity, 0);

  if (items.length === 0) {
    return (
      <div>
        <h1 className="mb-2 text-3xl font-bold">Your Cart</h1>
        <p className="text-muted-foreground">
          Your cart is empty.{" "}
          <Link href="/games" className="underline">
            Browse games
          </Link>{" "}
          to add something.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Your Cart</h1>

      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 rounded-xl border p-4">
            <div className="flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-xs text-muted-foreground">
              {item.game.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.game.imageUrl}
                  alt={item.game.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                "No image"
              )}
            </div>

            <div className="flex-1">
              <Link
                href={`/games/${item.game.slug}`}
                className="font-medium hover:underline"
              >
                {item.game.title}
              </Link>
              <p className="text-sm text-muted-foreground">
                ${item.game.price.toFixed(2)} each
              </p>
            </div>

            <form
              action={async (formData: FormData) => {
                "use server";
                const quantity = Number(formData.get("quantity"));
                await updateCartItemQuantityAction(item.id, quantity);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="number"
                name="quantity"
                min={1}
                defaultValue={item.quantity}
                className="w-16 rounded-lg border bg-background px-2 py-1 text-sm"
              />
              <Button type="submit" variant="outline" size="sm">
                Update
              </Button>
            </form>

            <p className="w-20 text-right font-medium">
              ${(item.game.price * item.quantity).toFixed(2)}
            </p>

            <form
              action={async () => {
                "use server";
                await removeCartItemAction(item.id);
              }}
            >
              <Button type="submit" variant="destructive" size="sm">
                Remove
              </Button>
            </form>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between border-t pt-6">
        <p className="text-xl font-semibold">Total: ${total.toFixed(2)}</p>
        <Button
          nativeButton={false}
          render={<Link href="/checkout">Proceed to Checkout</Link>}
        />
      </div>
    </div>
  );
}
