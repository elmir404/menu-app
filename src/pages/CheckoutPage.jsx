import { Link } from 'react-router-dom';

function CheckoutPage() {
  return (
    <div className="min-h-screen bg-stone-50 px-4 pb-16 pt-6 text-stone-900">
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <h1 className="text-2xl font-semibold">Checkout</h1>
        <p className="text-sm text-stone-600">
          Checkout page is next. We will add order summary and payment here.
        </p>
        <Link
          to="/menu"
          className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
        >
          Back to menu
        </Link>
      </div>
    </div>
  );
}

export default CheckoutPage;
