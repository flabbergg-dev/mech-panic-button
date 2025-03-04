import { getUserProfileAction } from "@/app/actions/user/get-user-profile.action";
import { useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";

export const useUserFirstName = (id?: string) => {
    const [firstName, setFirstName] = useState<string | null>(null);
    const { user } = useUser()

    const fetchUserId = async () => {
        const response = await getUserProfileAction(id ? id : user!.id);
        if (!response || !response.data) {
            throw new Error("User not found");
        } else {
            setFirstName(response.data.firstName ?? null);
        }
    };

    useEffect(() => {
        fetchUserId();
    }, [user]);

    return firstName;
};

export default useUserFirstName;