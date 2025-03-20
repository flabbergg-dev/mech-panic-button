import { getVehicleByUserId } from "@/app/actions/vehicle/getVehicleByUserId";
import { useEffect, useState } from "react";

export const useCarInformation = (userId: string) => {
    const [carInfo, setCarInfo] = useState<string | null>(null);

    const fetchUserId = async () => {
        const response = await getVehicleByUserId({userId: userId});
        if (!response || !response.vehicle) {
            throw new Error("User not found");
        } else {
            setCarInfo(response.vehicle.licensePlate ?? null);
        }
    };

    useEffect(() => {
        fetchUserId();
    }, [userId]);

    return carInfo;
};

export default useCarInformation;