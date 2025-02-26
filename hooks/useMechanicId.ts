import { getMechanicByIdAction } from "@/app/actions/mechanic/get-mechanic-by-id.action";
import { useEffect, useState } from "react";

export const useMechanicId = (id: string) => {
    const [mechanicId, setMechanicId] = useState<string | null>(null);

    useEffect(() => {
        const fetchMechanicId = async () => {

        const response = await getMechanicByIdAction(id);
        if (!response) {
            throw new Error("Mechanic not found");
        } else {
            setMechanicId(response.mechanic?.id!);
        }

    };

        fetchMechanicId();

    }, []);

    return mechanicId;
};

export default useMechanicId;