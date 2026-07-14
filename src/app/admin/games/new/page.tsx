import { getAllCategories } from "@/data/games";
import { GameForm } from "../GameForm";
import { createGameAction } from "../actions";

export default async function NewGamePage() {
  const categories = await getAllCategories();

  return (
    <div>
      <h2 className="mb-6 text-2xl font-semibold">New Game</h2>
      <GameForm
        categories={categories}
        action={createGameAction}
        submitLabel="Create Game"
      />
    </div>
  );
}
