import { getUserProfileAction } from "@/app/actions/user/get-user-profile.action";
import { useEffect, useState } from "react";

export const useUserFirstName = (id: string) => {
    const [firstName, setFirstName] = useState<string | null>(null);

    useEffect(() => {
        const fetchMechanicId = async () => {

        const response = await getUserProfileAction(id);
        if (!response) {
            throw new Error("Mechanic not found");
        } else {
            setFirstName(response.data?.firstName!);
        }

    };

        fetchMechanicId();

    }, []);

    return firstName;
};

export default useUserFirstName;