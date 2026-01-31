import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { FiClock, FiGrid, FiList } from 'react-icons/fi';
import RestaurantHeader from '../components/RestaurantHeader';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';

const API_URL = import.meta.env.VITE_MENU_API_URL || '/menu.json';

/** Delay before scroll-based category updates (avoids conflict with click-triggered scroll) */
const SCROLL_UPDATE_DELAY_MS = 150;
/** Duration to ignore scroll updates after a category click (covers smooth scroll) */
const CLICK_SCROLL_COOLDOWN_MS = 600;
/** Threshold from viewport top (px) for "active" section - just below sticky header */
const ACTIVE_SECTION_TOP_THRESHOLD = 200;

function MenuPage() {
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const sectionRefs = useRef({});
  const headingRefs = useRef({});
  const categoryPillsRef = useRef(null);
  const categoryButtonRefs = useRef({});
  const isClickScrollingRef = useRef(false);
  const scrollUpdateTimeoutRef = useRef(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const loadRestaurant = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error('Failed to load restaurant data.');
        }
        const data = await response.json();
        setRestaurant(data.restaurant);
        const list = data.restaurant?.categories || [];
        setCategories(list);
        setActiveCategoryId(list[0]?.id || '');
        setStatus('ready');
      } catch (error) {
        setStatus('error');
      }
    };

    loadRestaurant();
  }, []);

  // Scroll listener: update active category based on visible section (with delay to avoid conflicts)
  useEffect(() => {
    if (!categories.length) return;

    const handleScroll = () => {
      if (isClickScrollingRef.current) return;

      if (scrollUpdateTimeoutRef.current) {
        clearTimeout(scrollUpdateTimeoutRef.current);
      }

      scrollUpdateTimeoutRef.current = setTimeout(() => {
        scrollUpdateTimeoutRef.current = null;
        if (isClickScrollingRef.current) return;

        const refs = sectionRefs.current;
        let bestId = categories[0]?.id;
        let bestTop = -Infinity;

        for (const cat of categories) {
          const el = refs[cat.id];
          if (!el) continue;
          const rect = el.getBoundingClientRect();
          if (rect.top <= ACTIVE_SECTION_TOP_THRESHOLD && rect.top > bestTop) {
            bestTop = rect.top;
            bestId = cat.id;
          } else if (
            rect.top > ACTIVE_SECTION_TOP_THRESHOLD &&
            bestTop === -Infinity
          ) {
            bestId = cat.id;
            break;
          }
        }

        setActiveCategoryId((prev) => (prev === bestId ? prev : bestId));
      }, SCROLL_UPDATE_DELAY_MS);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollUpdateTimeoutRef.current) {
        clearTimeout(scrollUpdateTimeoutRef.current);
      }
    };
  }, [categories]);

  // Scroll horizontal category list so active pill is in view
  useEffect(() => {
    const btn = activeCategoryId
      ? categoryButtonRefs.current[activeCategoryId]
      : null;
    if (btn) {
      btn.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeCategoryId]);

  if (status === 'loading') {
    return <LoadingState message='Loading menu...' />;
  }

  if (status === 'error' || !restaurant) {
    return <ErrorState message='Failed to load menu.' />;
  }

  return (
    <div className='min-h-screen bg-stone-50'>
      <div className='sticky top-0 z-10 bg-stone-50 px-4 pt-4 pb-2'>
        <RestaurantHeader
          image={restaurant.image}
          name={restaurant.name}
          rating={restaurant.rating}
          showBack
          onBack={() => navigate(-1)}
        />
        <div className='mt-2'>
          <div
            ref={categoryPillsRef}
            className='no-scrollbar flex gap-2 overflow-x-auto pb-2'
          >
            {categories.map((category) => (
              <button
                key={category.id}
                ref={(node) => {
                  if (node) categoryButtonRefs.current[category.id] = node;
                }}
                type='button'
                className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium ${
                  activeCategoryId === category.id
                    ? 'border-stone-900 bg-stone-900 text-white'
                    : 'border-stone-200 bg-white text-stone-700'
                }`}
                onClick={() => {
                  isClickScrollingRef.current = true;
                  setActiveCategoryId(category.id);
                  const heading = headingRefs.current[category.id];
                  heading?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  });
                  setTimeout(() => {
                    isClickScrollingRef.current = false;
                  }, CLICK_SCROLL_COOLDOWN_MS);
                }}
              >
                {category.name}
              </button>
            ))}
          </div>
          <div className='flex shrink-0 gap-1 justify-end'>
            <button
              type='button'
              className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                viewMode === 'list'
                  ? 'border-stone-900 bg-stone-900 text-white'
                  : 'border-stone-200 bg-white text-stone-700'
              }`}
              onClick={() => setViewMode('list')}
              aria-label='List view'
            >
              <FiList className='text-base' />
            </button>
            <button
              type='button'
              className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                viewMode === 'grid'
                  ? 'border-stone-900 bg-stone-900 text-white'
                  : 'border-stone-200 bg-white text-stone-700'
              }`}
              onClick={() => setViewMode('grid')}
              aria-label='Grid view'
            >
              <FiGrid className='text-base' />
            </button>
          </div>
        </div>
      </div>

      <div className='px-4 pb-6'>
        <div className='mt-2 space-y-6'>
          {categories.map((category) => (
            <section
              key={category.id}
              ref={(node) => {
                if (node) sectionRefs.current[category.id] = node;
              }}
              data-category-id={category.id}
            >
              <h2
                ref={(node) => {
                  if (node) headingRefs.current[category.id] = node;
                }}
                className='scroll-mt-48 text-base font-semibold text-stone-900'
              >
                {category.name}
              </h2>
              <div
                className={`mt-3 ${
                  viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-3'
                }`}
              >
                {category.items.map((item) => (
                  <article
                    key={item.id}
                    className={`h-full rounded-2xl border border-stone-200 bg-white p-3 shadow-sm ${
                      viewMode === 'grid'
                        ? 'flex flex-col gap-2'
                        : 'flex items-center gap-3'
                    }`}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className={
                        viewMode === 'grid'
                          ? 'h-28 w-full rounded-xl object-cover'
                          : 'h-16 w-16 flex-shrink-0 rounded-xl object-cover'
                      }
                    />
                    <div
                      className={
                        viewMode === 'grid'
                          ? 'flex min-h-0 flex-1 flex-col'
                          : 'flex-1'
                      }
                    >
                      <div
                        className={`flex items-start ${
                          viewMode === 'grid'
                            ? 'justify-between gap-2'
                            : 'items-center justify-between gap-2'
                        }`}
                      >
                        <h3
                          className={`text-sm font-semibold text-stone-900 ${
                            viewMode === 'grid' ? 'line-clamp-1 min-h-[20px]' : ''
                          }`}
                        >
                          {item.name}
                        </h3>
                        <span className='text-sm font-semibold text-stone-900'>
                          {item.currencySign}
                          {item.price}
                        </span>
                      </div>
                      <p
                        className={`mt-1 text-xs text-stone-600 ${
                          viewMode === 'grid' ? 'line-clamp-2 min-h-[34px]' : ''
                        }`}
                      >
                        {item.description}
                      </p>
                      <p
                        className={`mt-1 flex items-center gap-1 text-[11px] text-stone-500 ${
                          viewMode === 'grid' ? 'mt-auto pt-2' : ''
                        }`}
                      >
                        <FiClock className='text-[11px]' aria-hidden='true' />
                        Prep {item.prepTimeMinutes} min
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MenuPage;
