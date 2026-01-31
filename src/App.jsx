import { Route, Routes } from 'react-router-dom';
import RestaurantPage from './pages/RestaurantPage';
import MenuPage from './pages/MenuPage';
import CheckoutPage from './pages/CheckoutPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<RestaurantPage />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
    </Routes>
  );
}

export default App;
