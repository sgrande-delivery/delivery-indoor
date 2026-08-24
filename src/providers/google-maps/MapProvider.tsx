import React, { createContext, useCallback, useContext, PropsWithChildren } from 'react';
import { useAddressComponents } from '../../hooks/useAddressComponents';
import { Address } from 'src/types/address';
import { infoWindowContent } from './infoWindowContent';
import { mapStyle } from './mapStyle';
import { Position } from 'src/types/position';

interface GoogleMapsContextValue {
  createMap(position: Position): google.maps.Map;
  createMarker(map: google.maps.Map, position: Position): google.maps.Marker;
  createCircle(map: google.maps.Map, circleRadius: number, locationToCenter: Position): google.maps.Circle;
  createInfoWindow(): google.maps.InfoWindow;
  getAddressFromMarker(marker: google.maps.Marker): Promise<Address | null>;
  getAddressFromLocation(position: Position): Promise<Address | null>;
  getDistanceMarkerPosition(marker: google.maps.Marker, position: Position): number;
}

const GoogleMapsContext = createContext<GoogleMapsContextValue>({} as GoogleMapsContextValue);
export const GoogleMapsConsumer = GoogleMapsContext.Consumer;

export function useMap(): GoogleMapsContextValue {
  return useContext(GoogleMapsContext);
}

const GoogleMapsProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { getAddressComponent } = useAddressComponents();

  const createMap = useCallback((position: Position): google.maps.Map => {
    const map = new google.maps.Map(document.getElementById('map') as HTMLElement, {
      zoom: 17,
      center: position,
      mapTypeId: google.maps.MapTypeId.TERRAIN,
      disableDefaultUI: true,
      styles: mapStyle,
    });

    return map;
  }, []);

  const createMarker = useCallback((map: google.maps.Map, position: Position): google.maps.Marker => {
    const marker = new google.maps.Marker({
      position,
      icon: '/images/mark_map.png',
      opacity: 0,
    });

    marker.setMap(map);

    return marker;
  }, []);

  const createCircle = useCallback(
    (map: google.maps.Map, circleRadius: number, locationToCenter: Position): google.maps.Circle => {
      const circle = new google.maps.Circle({
        radius: circleRadius,
        strokeColor: '#FF0000',
        strokeOpacity: 0.2,
        strokeWeight: 2,
        fillColor: '#FF0000',
        fillOpacity: 0.05,
        center: locationToCenter,
      });

      circle.setMap(map);
      circle.setVisible(false);

      return circle;
    },
    []
  );

  const createInfoWindow = useCallback((): google.maps.InfoWindow => {
    const infoWindow = new google.maps.InfoWindow({
      content: infoWindowContent,
    });

    return infoWindow;
  }, []);

  const getDistanceMarkerPosition = useCallback((marker: google.maps.Marker, position: Position): number => {
    const markerPosition = marker.getPosition();
    if (!markerPosition) return 0;

    const latLng = new google.maps.LatLng(position);
    const newDistance = google.maps.geometry.spherical.computeDistanceBetween(latLng, markerPosition);

    return newDistance / 1000;
  }, []);

  const handleSetAddressGeoCodeResult = useCallback(
    (payload: google.maps.GeocoderResult | null): Address | null => {
      if (!payload) {
        return null;
      }

      const number = getAddressComponent(payload.address_components, 'street_number', 'long_name');
      const address = getAddressComponent(payload.address_components, 'route', 'long_name');
      const district = getAddressComponent(payload.address_components, 'sublocality', 'long_name');
      const city = getAddressComponent(payload.address_components, 'administrative_area_level_2', 'long_name');
      const region = getAddressComponent(payload.address_components, 'administrative_area_level_1', 'short_name');

      return {
        number,
        address,
        district,
        city,
        region,
        latitude: payload.geometry.location.lat(),
        longitude: payload.geometry.location.lng(),
        reference_point: '',
        is_main: false,
        postal_code: '',
        id: 0,
        formattedDistanceTax: '',
        distance_tax: 0,
        distance: 0,
        complement: '',
      };
    },
    [getAddressComponent]
  );

  const getAddressFromLocation = useCallback(
    async (location: Position) => {
      const geocoder = new google.maps.Geocoder();
      const response = await geocoder.geocode({ location });
      return handleSetAddressGeoCodeResult(response.results[0]);
    },
    [handleSetAddressGeoCodeResult]
  );

  const getAddressFromMarker = useCallback(
    async (marker: google.maps.Marker) => {
      const position = marker.getPosition();
      if (!position) {
        return null;
      }

      const address = await getAddressFromLocation({ lat: position.toJSON().lat, lng: position.toJSON().lng });

      return address;
    },
    [getAddressFromLocation]
  );

  return (
    <GoogleMapsContext.Provider
      value={{
        createMap,
        createMarker,
        createCircle,
        createInfoWindow,
        getDistanceMarkerPosition,
        getAddressFromMarker,
        getAddressFromLocation,
      }}
    >
      {children}
    </GoogleMapsContext.Provider>
  );
};

export default GoogleMapsProvider;
