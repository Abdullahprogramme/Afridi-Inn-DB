export default async function BillingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-stone-900">Order Checkout & Billing</h1>
      <p className="mt-2 text-stone-600">Generate bill and record simulated payment for order ID: <span className="font-mono font-semibold">{id}</span></p>
    </div>
  );
}
