// Mapeo de logos por nombre de restaurante
// Importar logos desde assets
import pizzaLogo from '../assets/pizza_logo.png';

const logoMap = {
  "Gus Restaurant Group": "/logo-guss.png",
  "Pizza Palace": pizzaLogo,
  "default": "/logo-guss.png"
};

export const getRestaurantLogo = (restaurantName) => {
  // Buscar coincidencia exacta
  if (logoMap[restaurantName]) {
    return logoMap[restaurantName];
  }
  
  // Buscar coincidencia parcial (case insensitive)
  const normalizedName = restaurantName.toLowerCase();
  const matchedKey = Object.keys(logoMap).find(key => 
    normalizedName.includes(key.toLowerCase()) || 
    key.toLowerCase().includes(normalizedName)
  );
  
  return matchedKey ? logoMap[matchedKey] : logoMap.default;
};

export default logoMap;
