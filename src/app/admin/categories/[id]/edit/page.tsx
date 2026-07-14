import { notFound } from "next/navigation";
import { getCategoryById } from "@/data/games";
import { CategoryForm } from "../../CategoryForm";
import { updateCategoryAction } from "../../actions";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const category = await getCategoryById(id);

  if (!category) {
    notFound();
  }

  const boundAction = updateCategoryAction.bind(null, id);

  return (
    <div>
      <h2 className="mb-6 text-2xl font-semibold">Edit Category</h2>
      <CategoryForm
        action={boundAction}
        submitLabel="Save Changes"
        defaultValues={{ name: category.name, slug: category.slug }}
      />
    </div>
  );
}
