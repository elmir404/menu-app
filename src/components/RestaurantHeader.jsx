import { FiChevronLeft, FiStar } from 'react-icons/fi';

function RestaurantHeader({ image, name, rating, showBack, onBack }) {
  return (
    <header className='rounded-2xl bg-white p-3 shadow-md'>
      <div className='flex items-center gap-4'>
        {showBack ? (
          <button
            type='button'
            onClick={onBack}
            className='flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700'
            aria-label='Go back'
          >
            <FiChevronLeft className='text-base' />
          </button>
        ) : null}
        <img
          src={image}
          alt={name}
          className='h-16 w-16 flex-shrink-0 rounded-lg object-cover'
        />
        <div>
          <h1 className='text-lg font-semibold text-stone-900'>{name}</h1>
          <div className='mt-1 flex items-center gap-1 text-sm text-stone-700'>
            <FiStar className='text-sm text-amber-500' aria-hidden='true' />
            <span>{rating}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default RestaurantHeader;
