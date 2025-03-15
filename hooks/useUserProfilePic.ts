import { getUserProfileAction } from "@/app/actions/user/get-user-profile.action";
import { useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";

export const useUserProfilePic = (id?: string) => {
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const { user } = useUser()

    const fetchUserId = async () => {
        const response = await getUserProfileAction(id ? id : user!.id);
        if (!response || !response.data) {
            throw new Error("User not found");
        } else {
            setProfileImage(response.data.profileImage ?? null);
        }
    };

    useEffect(() => {
        fetchUserId();
    }, [user]);

    return profileImage;
};

export default useUserProfilePic;