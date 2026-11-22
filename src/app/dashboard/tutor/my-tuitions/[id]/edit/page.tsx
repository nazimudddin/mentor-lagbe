import EditTuitionForm from "./edit-tuition-form";

export const instant = false;

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditTuitionForm key={id} id={id} />;
}
