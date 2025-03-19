import { getMechanicByIdAction } from "@/app/actions/mechanic/get-mechanic-by-id.action";
import { useEffect, useState } from "react";

export const useMechanicId = () => {
    const [mechanicUserId, setMechanicUserId] = useState<string | null>(null);
    const [mechanicId, setMechanicId] = useState<string | null>(null);

    useEffect(() => {
        const fetchMechanicId = async () => {
            const response = await getMechanicByIdAction();
            if (!response || !response.mechanic) {
                throw new Error("Mechanic not found");
            }
            setMechanicUserId(response.mechanic?.userId ?? null);
            setMechanicId(response.mechanic?.id ?? null);
        };

        fetchMechanicId();

    }, []);

    return {
        mechanicUserId,
        mechanicId,
    };
};

export default useMechanicId;