function ErrorState({ message = 'Failed to load.' }) {
  return (
    <div className='flex min-h-[40vh] items-center justify-center px-4'>
      <div className='rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm text-rose-600 shadow-sm'>
        {message}
      </div>
    </div>
  );
}

export default ErrorState;
