export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-stone-900">Order Detail</h1>
      <p className="mt-2 text-stone-600">Viewing order ID: <span className="font-mono font-semibold">{id}</span></p>
    </div>
  );
}
