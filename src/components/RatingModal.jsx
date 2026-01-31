import { useEffect, useMemo, useState } from 'react';
import { MdStar, MdStarBorder } from 'react-icons/md';

const emojis = [
  { value: 1, icon: '😞', label: 'Bad' },
  { value: 2, icon: '😕', label: 'Okay' },
  { value: 3, icon: '🙂', label: 'Good' },
  { value: 4, icon: '😋', label: 'Great' },
  { value: 5, icon: '🤩', label: 'Amazing' },
];

function RatingModal({ isOpen, onClose }) {
  const [rating, setRating] = useState(0);
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [isVisible, setIsVisible] = useState(isOpen);

  const activeEmoji = useMemo(
    () => emojis.find((emoji) => emoji.value === rating),
    [rating],
  );

  useEffect(() => {
    let timer;
    if (isOpen) {
      setIsVisible(true);
    } else {
      timer = setTimeout(() => setIsVisible(false), 220);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOpen]);

  if (!isVisible) return null;

  const submitDisabled = rating === 0;

  return (
    <div className='fixed inset-0 z-50'>
      <button
        type='button'
        className={`rating-modal-overlay absolute inset-0 bg-black/40 ${
          isOpen ? 'is-open' : 'is-closed'
        }`}
        onClick={onClose}
        aria-label='Close rating modal'
      />
      <div
        className={`rating-modal-panel absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-6 shadow-2xl ${
          isOpen ? 'is-open' : 'is-closed'
        }`}
      >
        <div className='mx-auto max-w-md max-h-[80vh] overflow-y-auto pb-6'>
          <div className='flex items-center justify-between'>
            <h2 className='text-base font-semibold text-stone-900'>
              Rate this restaurant
            </h2>
            <button
              type='button'
              onClick={onClose}
              className='text-xs text-stone-500'
            >
              Close
            </button>
          </div>

          <div className='mt-4 flex items-center gap-3 rounded-2xl bg-stone-50 px-3 py-2'>
            <span className='text-2xl' aria-hidden='true'>
              {activeEmoji?.icon || '🙂'}
            </span>
            <span className='text-sm text-stone-600'>
              {activeEmoji?.label || 'Select a rating'}
            </span>
          </div>

          <div className='mt-4 flex items-center justify-between'>
            {Array.from({ length: 5 }).map((_, index) => {
              const value = index + 1;
              const active = value <= rating;
              return (
                <button
                  key={value}
                  type='button'
                  onClick={() => setRating(value)}
                  className='flex h-12 w-12 items-center justify-center rounded-full border border-stone-200 bg-white text-xl'
                  aria-label={`Rate ${value} stars`}
                >
                  {active ? (
                    <MdStar className='text-amber-400' />
                  ) : (
                    <MdStarBorder className='text-stone-300' />
                  )}
                </button>
              );
            })}
          </div>

          <div className='mt-4'>
            <label
              htmlFor='rating-name'
              className='text-xs font-medium text-stone-600'
            >
              Name
            </label>
            <input
              id='rating-name'
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder='Your name'
              className='mt-2 w-full rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-400'
            />
          </div>

          <div className='mt-4'>
            <label
              htmlFor='rating-comment'
              className='text-xs font-medium text-stone-600'
            >
              Comment
            </label>
            <textarea
              id='rating-comment'
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder='Tell us what you liked...'
              rows={4}
              className='mt-2 w-full rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-400'
            />
          </div>

          <button
            type='button'
            onClick={onClose}
            className={`mt-4 w-full rounded-full px-4 py-3 text-sm font-semibold ${
              submitDisabled
                ? 'bg-stone-200 text-stone-500'
                : 'bg-stone-900 text-white'
            }`}
            disabled={submitDisabled}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

export default RatingModal;
