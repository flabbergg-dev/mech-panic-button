import { LocationType } from './types';

// Helper function to convert location to mapbox format
export const toMapboxLngLat = (location: LocationType): [number, number] => {
  return [location.longitude, location.latitude];
};

// Create arrow element for mechanic marker
export const createArrowElement = () => {
  const el = document.createElement('div');
  el.className = 'mechanic-marker';
  el.style.width = '24px';
  el.style.height = '24px';
  el.style.backgroundImage = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233b82f6'%3E%3Cpath d='M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z'/%3E%3C/svg%3E")`;
  el.style.backgroundSize = '100%';
  return el;
};
