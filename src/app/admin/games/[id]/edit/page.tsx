import { notFound } from "next/navigation";
import { getGameById, getAllCategories } from "@/data/games";
import { GameForm } from "../../GameForm";
import { updateGameAction } from "../../actions";

export default async function EditGamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [game, categories] = await Promise.all([getGameById(id), getAllCategories()]);

  if (!game) {
    notFound();
  }

  const boundAction = updateGameAction.bind(null, id);

  return (
    <div>
      <h2 className="mb-6 text-2xl font-semibold">Edit Game</h2>
      <GameForm
        categories={categories}
        action={boundAction}
        submitLabel="Save Changes"
        defaultValues={{
          slug: game.slug,
          title: game.title,
          description: game.description,
          price: game.price,
          releaseDate: game.releaseDate.toISOString().slice(0, 10),
          imageUrl: game.imageUrl ?? "",
          categorySlugs: game.categories.map((c) => c.slug),
        }}
      />
    </div>
  );
}
