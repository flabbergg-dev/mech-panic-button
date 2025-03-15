import { Message as MessageType, User } from '@prisma/client';
import React from 'react'
import { DynamicAvatar } from '@/components/DynamicAvatar/DynamicAvatar';
import useUserFirstName from "@/hooks/useUserFirstName";
import useUserProfilePic from "@/hooks/useUserProfilePic";

type MessageProps = {
  msg: MessageType;
  currentUser: User | null;
}

export const Message = ({ msg, currentUser }: MessageProps) => {
  // Get user info for both message author and current user
  const authorFirstName = useUserFirstName(msg.authorId);
  const authorProfilePic = useUserProfilePic(msg.authorId);

  const isCurrentUserMessage = msg.authorId === currentUser?.id;
  const avatarFallbackText = authorFirstName?.slice(0, 2) || "NA";

  return (
    <div
      className={`h-auto gap-4 w-fit flex flex-row items-center justify-center ${
        isCurrentUserMessage ? "place-self-end" : "place-self-start"
      }`}
    >
      {!isCurrentUserMessage && (
        <DynamicAvatar
          className="border-2"
          fallbackText={avatarFallbackText}
          src={authorProfilePic ?? undefined}
        />
      )}
      <p className="text-white bg-slate-600 p-2 rounded-lg">
        {msg.content}
      </p>
      {isCurrentUserMessage && (
        <DynamicAvatar
          className="border-2"
          fallbackText={avatarFallbackText}
          src={authorProfilePic ?? undefined}
        />
      )}
    </div>
  )
}
