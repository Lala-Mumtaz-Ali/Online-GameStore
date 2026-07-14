import { CategoryForm } from "../CategoryForm";
import { createCategoryAction } from "../actions";

export default function NewCategoryPage() {
  return (
    <div>
      <h2 className="mb-6 text-2xl font-semibold">New Category</h2>
      <CategoryForm action={createCategoryAction} submitLabel="Create Category" />
    </div>
  );
}
