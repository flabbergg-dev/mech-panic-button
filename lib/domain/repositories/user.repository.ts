import { UpdateUserDTO, UpdateMechanicDTO, UserProfileEntity, MechanicProfileEntity } from "../dtos/user.dto"

export interface IUserRepository {
  getUserProfile(userId: string): Promise<UserProfileEntity | null>
  getMechanicProfile(userId: string): Promise<MechanicProfileEntity | null>
  updateUserProfile(userId: string, data: UpdateUserDTO): Promise<UserProfileEntity>
  updateMechanicProfile(userId: string, data: UpdateMechanicDTO): Promise<MechanicProfileEntity>
  uploadProfileImage(userId: string, file: File): Promise<string>
  uploadMechanicDocuments(userId: string, files: { [key: string]: File }): Promise<{
    bannerImage?: string
    driversLicenseId?: string
    merchantDocumentUrl?: string
  }>
}
