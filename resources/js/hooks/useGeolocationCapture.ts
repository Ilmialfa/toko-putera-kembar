import { useState, useCallback } from 'react';

interface GeolocationResult {
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
    error: string | null;
    loading: boolean;
}

export function useGeolocationCapture() {
    const [geoState, setGeoState] = useState<GeolocationResult>({
        latitude: null,
        longitude: null,
        accuracy: null,
        error: null,
        loading: false,
    });

    const captureLocation =
        useCallback(async (): Promise<GeolocationResult> => {
            return new Promise((resolve) => {
                setGeoState((prev) => ({
                    ...prev,
                    loading: true,
                    error: null,
                }));

                if (!navigator.geolocation) {
                    const result = {
                        latitude: null,
                        longitude: null,
                        accuracy: null,
                        error: 'Geolocation is not supported by your browser',
                        loading: false,
                    };
                    setGeoState(result);
                    resolve(result);

                    return;
                }

                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        // Check for mocked location (some browsers might report high accuracy/fake sources, hard to detect purely on web but we can log)
                        const result = {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            accuracy: position.coords.accuracy,
                            error: null,
                            loading: false,
                        };
                        setGeoState(result);
                        resolve(result);
                    },
                    (err) => {
                        let errorMessage = 'Unable to retrieve your location';

                        if (err.code === err.PERMISSION_DENIED) {
                            errorMessage =
                                'Location permission denied. Please allow location access to record attendance.';
                        }

                        const result = {
                            latitude: null,
                            longitude: null,
                            accuracy: null,
                            error: errorMessage,
                            loading: false,
                        };
                        setGeoState(result);
                        resolve(result);
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0,
                    },
                );
            });
        }, []);

    return { geoState, captureLocation };
}
