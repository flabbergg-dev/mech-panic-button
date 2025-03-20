import { getVehicleByUserId } from "@/app/actions/vehicle/getVehicleByUserId";
import { useEffect, useState } from "react";

interface Vehicle {
    id: string;
    userId: string;
    model: string;
    year: number;
    licensePlate: string | null;
}

export const useCarInformation = (userId: string) => {
    const [carInfo, setCarInfo] = useState<Vehicle | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchVehicleInfo = async () => {
        try {
            setIsLoading(true);
            const response = await getVehicleByUserId({userId: userId});
            if (!response || !response.vehicle) {
                setError("Vehicle not found");
                setCarInfo(null);
            } else {
                setCarInfo(response.vehicle);
                setError(null);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch vehicle");
            setCarInfo(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchVehicleInfo();
        }
    }, [userId]);

    return { carInfo, isLoading, error };
};

export default useCarInformation;