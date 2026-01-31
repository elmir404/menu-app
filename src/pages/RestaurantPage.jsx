import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MdOutlineMenuBook } from 'react-icons/md';
import { FiCopy, FiMapPin, FiPhone } from 'react-icons/fi';
import { FaGoogle } from 'react-icons/fa';
import { SiWaze } from 'react-icons/si';
import RatingModal from '../components/RatingModal';
import RestaurantHeader from '../components/RestaurantHeader';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';

const API_URL = import.meta.env.VITE_MENU_API_URL || '/menu.json';

function RestaurantPage() {
  const [restaurant, setRestaurant] = useState(null);
  const [status, setStatus] = useState('loading');
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const formatPhone = (phone) => {
    if (!phone) return '-';
    const match = phone.match(/^(\+\d{3})(\d{2})(\d{3})(\d{2})(\d{2})$/);
    if (!match) return phone;
    return `${match[1]} ${match[2]} ${match[3]} ${match[4]} ${match[5]}`;
  };

  const handleCopyPassword = async () => {
    const password = restaurant?.wifi?.password;
    if (!password || !navigator?.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (error) {
      setCopied(false);
    }
  };

  useEffect(() => {
    const loadRestaurant = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error('Failed to load restaurant data.');
        }
        const data = await response.json();
        setRestaurant(data.restaurant);
        setStatus('ready');
      } catch (error) {
        setStatus('error');
      }
    };

    loadRestaurant();
  }, []);

  if (status === 'loading') {
    return <LoadingState message='Loading restaurant...' />;
  }

  if (status === 'error' || !restaurant) {
    return <ErrorState message='Failed to load restaurant.' />;
  }

  return (
    <div className='p-4'>
      <RestaurantHeader
        image={restaurant.image}
        name={restaurant.name}
        rating={restaurant.rating}
      />
      <div className='mt-4 flex items-center gap-3'>
        <button
          type='button'
          className='flex items-center justify-center rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-medium text-stone-800'
          onClick={() => setIsRatingOpen(true)}
        >
          Rate us
        </button>
        <Link
          to='/menu'
          className='cta-ripple flex flex-1 items-center justify-between rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-white'
        >
          <span className='flex items-center gap-2'>
            <MdOutlineMenuBook className='text-base' aria-hidden='true' />
            <span>Menu</span>
          </span>
          <span className='text-xs font-normal text-white/70'>
            Try our flavors
          </span>
        </Link>
      </div>

      <section className='mt-4 rounded-2xl bg-white p-4 shadow-sm'>
        <h2 className='text-sm font-semibold text-stone-800'>WiFi details</h2>
        <div className='mt-3 grid gap-3'>
          <div className='rounded-xl border border-stone-200 bg-stone-50 px-3 py-2'>
            <p className='text-[11px] uppercase tracking-wide text-stone-500'>
              Network
            </p>
            <p className='text-sm font-medium text-stone-900'>
              {restaurant.wifi?.ssid || '—'}
            </p>
          </div>
          <div className='rounded-xl border border-stone-200 bg-stone-50 px-3 py-2'>
            <p className='text-[11px] uppercase tracking-wide text-stone-500'>
              Password
            </p>
            <div className='mt-1 flex items-center justify-between gap-2'>
              <p className='text-sm font-medium text-stone-900'>
                {restaurant.wifi?.password || '—'}
              </p>
              <button
                type='button'
                onClick={handleCopyPassword}
                className='inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-2 py-1 text-[11px] font-medium text-stone-600'
              >
                <FiCopy className='text-xs' aria-hidden='true' />
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className='mt-4 rounded-2xl bg-white p-4 shadow-sm'>
        <h2 className='text-sm font-semibold text-stone-800'>Contact</h2>
        <a
          href={`tel:${restaurant.phone}`}
          className='mt-3 flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-900'
        >
          <FiPhone className='text-sm text-stone-600' aria-hidden='true' />
          <span>{formatPhone(restaurant.phone)}</span>
        </a>
      </section>

      <section className='mt-4 rounded-2xl bg-white p-4 shadow-sm'>
        <h2 className='text-sm font-semibold text-stone-800'>Location</h2>
        <div className='mt-3 flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2'>
          <div className='flex items-center gap-2 text-sm font-medium text-stone-900'>
            <FiMapPin className='text-sm text-stone-600' aria-hidden='true' />
            <span>{restaurant.address || '-'}</span>
          </div>
          <div className='flex items-center gap-2'>
            <a
              href={restaurant.googleLocation || '#'}
              target='_blank'
              rel='noreferrer'
              className='inline-flex h-9 w-12 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600'
              aria-label='Open Google Maps'
            >
              <FaGoogle className='text-md' />
            </a>
            <a
              href={restaurant.wazeLocation || '#'}
              target='_blank'
              rel='noreferrer'
              className='inline-flex h-9 w-12 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600'
              aria-label='Open Waze'
            >
              <SiWaze className='text-md' />
            </a>
          </div>
        </div>
      </section>

      <RatingModal
        isOpen={isRatingOpen}
        onClose={() => setIsRatingOpen(false)}
      />
    </div>
  );
}

export default RestaurantPage;
