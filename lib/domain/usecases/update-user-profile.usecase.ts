import { UpdateUserDTO, UpdateMechanicDTO, UserProfileEntity, MechanicProfileEntity } from "../dtos/user.dto"
import { IUserRepository } from "../repositories/user.repository"

export class UpdateUserProfileUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(
    userId: string,
    data: UpdateUserDTO | UpdateMechanicDTO,
    isMechanic: boolean
  ): Promise<UserProfileEntity | MechanicProfileEntity> {
    try {
      if (isMechanic) {
        return await this.userRepository.updateMechanicProfile(
          userId,
          data as UpdateMechanicDTO
        )
      }
      return await this.userRepository.updateUserProfile(userId, data)
    } catch (error) {
      console.error("Error in UpdateUserProfileUseCase:", error)
      throw error
    }
  }
}
