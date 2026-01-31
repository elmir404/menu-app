import { FiMinus, FiPlus, FiX } from 'react-icons/fi';

function CheckoutModal({
  isOpen,
  onClose,
  items = [],
  total = 0,
  onIncrement,
  onDecrement,
}) {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-30 flex flex-col justify-end'>
      <div
        className='absolute inset-0 bg-black/40'
        onClick={onClose}
        aria-hidden='true'
      />
      <div className='relative max-h-[80vh] rounded-t-3xl bg-white shadow-2xl'>
        <div className='flex items-center justify-between px-4 pt-3'>
          <div className='mx-auto h-1 w-12 rounded-full bg-stone-200' />
          <button
            type='button'
            className='absolute right-4 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 text-stone-600'
            onClick={onClose}
            aria-label='Close'
          >
            <FiX className='text-lg' />
          </button>
        </div>
        <div className='px-4 pb-5 pt-2'>
          <h3 className='text-lg font-semibold text-stone-900'>Your order</h3>
          <div className='mt-4 max-h-[50vh] overflow-y-auto space-y-3'>
            {items.length === 0 ? (
              <p className='text-sm text-stone-500'>Your cart is empty.</p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className='flex items-center justify-between rounded-2xl border border-stone-200 px-3 py-2'
                >
                  <div>
                    <p className='text-sm font-medium text-stone-900'>
                      {item.name}
                    </p>
                    <p className='text-xs text-stone-500'>x{item.quantity}</p>
                  </div>
                  <div className='flex items-center gap-3'>
                    <div className='flex items-center gap-2 rounded-full bg-stone-100 px-2 py-1'>
                      <button
                        type='button'
                        className='flex h-7 w-7 items-center justify-center rounded-full border border-stone-200 text-stone-700'
                        onClick={() => onDecrement?.(item.id)}
                        aria-label='Decrease'
                      >
                        <FiMinus />
                      </button>
                      <span className='min-w-[24px] text-center text-sm font-semibold text-stone-900'>
                        {item.quantity}
                      </span>
                      <button
                        type='button'
                        className='flex h-7 w-7 items-center justify-center rounded-full border border-stone-200 text-stone-700'
                        onClick={() => onIncrement?.(item.id)}
                        aria-label='Increase'
                      >
                        <FiPlus />
                      </button>
                    </div>
                    <span className='text-sm font-semibold text-stone-900'>
                      {item.currencySign}
                      {item.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className='mt-4 flex items-center justify-between rounded-2xl bg-stone-100 px-4 py-3 text-sm font-semibold text-stone-900'>
            <span>Total</span>
            <span>
              {items[0]?.currencySign || '₼'}
              {total.toFixed(2)}
            </span>
          </div>
          <button
            type='button'
            className='mt-4 w-full rounded-full bg-stone-900 px-4 py-3 text-center text-sm font-semibold text-white shadow-md'
            onClick={onClose}
          >
            Proceed to checkout
          </button>
        </div>
      </div>
    </div>
  );
}

export default CheckoutModal;
